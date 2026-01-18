# Moderation System Testing Guide

This guide provides manual testing procedures for the new moderation system features.

## Prerequisites

1. Set up environment variables in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/chatroom
   ACCESS_TOKEN_SECRET=your-secret-here
   REFRESH_TOKEN_SECRET=your-secret-here
   PORT=3001
   ```

2. Run Prisma migrations:
   ```bash
   npx prisma generate --schema=packages/api/prisma/schema.prisma
   npx prisma migrate dev --schema=packages/api/prisma/schema.prisma
   ```

3. Start the API server:
   ```bash
   npm run dev:api
   ```

## Testing Scenarios

### 1. Role-Based Access Control (RBAC)

**Test: Only moderators can access moderation logs**

```bash
# Create a test user with USER role (default)
# Attempt to access moderation logs - should fail with 403

curl -X GET http://localhost:3001/api/moderation/logs \
  -H "Authorization: Bearer <user_token>"

# Expected: 403 Forbidden
# Response: {"error": "Insufficient permissions", "required": ["MODERATOR", "ADMIN"]}
```

```bash
# Update user role to MODERATOR in database
# psql: UPDATE "User" SET role = 'MODERATOR' WHERE id = '<user_id>';

# Attempt to access moderation logs again - should succeed

curl -X GET http://localhost:3001/api/moderation/logs \
  -H "Authorization: Bearer <moderator_token>"

# Expected: 200 OK
# Response: {"logs": [...], "pagination": {...}}
```

### 2. User Reporting and Auto-Flagging

**Test: Submit reports and verify auto-flagging after 3 reports**

```bash
# Submit first report
curl -X POST http://localhost:3001/api/moderation/report \
  -H "Authorization: Bearer <user1_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reportedUserId": "<target_user_id>",
    "reportReason": "SPAM",
    "reportDetails": "User is spamming chat with ads"
  }'

# Expected: 201 Created
# Check database: User should NOT be flagged yet
```

```bash
# Submit second report (from different user)
curl -X POST http://localhost:3001/api/moderation/report \
  -H "Authorization: Bearer <user2_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reportedUserId": "<target_user_id>",
    "reportReason": "HARASSMENT",
    "reportDetails": "User is harassing others"
  }'

# Expected: 201 Created
# Check database: User should NOT be flagged yet
```

```bash
# Submit third report (from different user)
curl -X POST http://localhost:3001/api/moderation/report \
  -H "Authorization: Bearer <user3_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reportedUserId": "<target_user_id>",
    "reportReason": "INAPPROPRIATE_CONTENT",
    "reportDetails": "Posting inappropriate content"
  }'

# Expected: 201 Created
# Check database: User SHOULD be flagged now (isFlagged = true)
# Check audit log: Should have 'USER_AUTO_FLAGGED' entry
```

### 3. Moderation Actions

**Test: Moderator can mute a user**

```bash
curl -X POST http://localhost:3001/api/moderation/action \
  -H "Authorization: Bearer <moderator_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "<target_user_id>",
    "actionType": "MUTE",
    "reason": "Repeated spam violations",
    "duration": 30
  }'

# Expected: 201 Created
# Check database: User should have isMuted = true, muteExpiresAt set to 30 minutes from now
# Check audit log: Should have 'MODERATION_ACTION_TAKEN' entry
```

**Test: Moderator can issue temporary ban**

```bash
curl -X POST http://localhost:3001/api/moderation/action \
  -H "Authorization: Bearer <moderator_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "<target_user_id>",
    "actionType": "BAN_TEMP",
    "reason": "Harassment and inappropriate behavior",
    "duration": 1440
  }'

# Expected: 201 Created
# Check database: 
#   - User should have isBanned = true, accountStatus = 'BANNED'
#   - banExpiresAt set to 24 hours (1440 minutes) from now
# Check audit log: Should have 'MODERATION_ACTION_TAKEN' entry
```

**Test: Moderator can issue permanent ban**

```bash
curl -X POST http://localhost:3001/api/moderation/action \
  -H "Authorization: Bearer <moderator_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "<target_user_id>",
    "actionType": "BAN_PERMANENT",
    "reason": "Severe terms of service violations"
  }'

# Expected: 201 Created
# Check database: 
#   - User should have isBanned = true, accountStatus = 'BANNED'
#   - banExpiresAt should be NULL (permanent)
# Check audit log: Should have 'MODERATION_ACTION_TAKEN' entry
```

### 4. Appeals System

**Test: User can submit an appeal**

```bash
curl -X POST http://localhost:3001/api/moderation/appeal \
  -H "Authorization: Bearer <banned_user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "moderationActionId": "<action_id>",
    "reason": "I believe this action was taken in error. I was not spamming, just sharing helpful information."
  }'

# Expected: 201 Created
# Check database: ModerationAppeal created with status = 'PENDING'
# Check audit log: Should have 'MODERATION_APPEAL_SUBMITTED' entry
```

**Test: Moderator can review and approve appeal**

```bash
curl -X POST http://localhost:3001/api/moderation/appeals/<appeal_id>/review \
  -H "Authorization: Bearer <moderator_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "reviewNotes": "After review, the ban was excessive. User will be given a warning instead."
  }'

# Expected: 200 OK
# Check database:
#   - Appeal status should be 'APPROVED'
#   - Original ModerationAction should have isActive = false
#   - User should be unbanned (isBanned = false, accountStatus = 'ACTIVE')
# Check audit log: Should have 'APPEAL_REVIEWED' entry
```

**Test: Moderator can reject appeal**

```bash
curl -X POST http://localhost:3001/api/moderation/appeals/<appeal_id>/review \
  -H "Authorization: Bearer <moderator_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "reviewNotes": "The evidence clearly shows violations. Appeal denied."
  }'

# Expected: 200 OK
# Check database:
#   - Appeal status should be 'REJECTED'
#   - Original ModerationAction remains active
#   - User remains banned
# Check audit log: Should have 'APPEAL_REVIEWED' entry
```

### 5. Automated Expiration

**Test: Temporary ban expires automatically**

1. Create a temporary ban with short duration:
   ```bash
   curl -X POST http://localhost:3001/api/moderation/action \
     -H "Authorization: Bearer <moderator_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "targetUserId": "<target_user_id>",
       "actionType": "BAN_TEMP",
       "reason": "Testing expiration",
       "duration": 2
     }'
   ```

2. Check database: User should be banned immediately

3. Wait 3+ minutes

4. Check database: User should be automatically unbanned
   - isBanned = false
   - banExpiresAt = null
   - accountStatus = 'ACTIVE'
   - ModerationAction isActive = false

5. Check logs: Should see "Auto-unbanned X users with expired bans" in server logs

**Test: Temporary mute expires automatically**

1. Create a temporary mute with short duration:
   ```bash
   curl -X POST http://localhost:3001/api/moderation/action \
     -H "Authorization: Bearer <moderator_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "targetUserId": "<target_user_id>",
       "actionType": "MUTE",
       "reason": "Testing mute expiration",
       "duration": 2
     }'
   ```

2. Check database: User should be muted immediately

3. Wait 3+ minutes

4. Check database: User should be automatically unmuted
   - isMuted = false
   - muteExpiresAt = null
   - ModerationAction isActive = false

5. Check logs: Should see "Auto-unmuted X users with expired mutes" in server logs

### 6. Audit Log Immutability

**Test: Audit logs cannot be deleted or modified**

The Prisma schema doesn't include delete or update operations for AuditLog model in the routes. To verify immutability:

1. Submit several moderation actions and appeals
2. Query the audit logs:
   ```bash
   curl -X GET "http://localhost:3001/api/moderation/audit?page=1&limit=50" \
     -H "Authorization: Bearer <admin_token>"
   ```

3. Verify all actions are logged
4. Attempt to delete from database directly (should only be done by DBAs with special permissions)
5. The application code provides no delete/update endpoints for audit logs

### 7. Viewing Logs and Reports

**Test: Moderator can view moderation logs**

```bash
# Get all logs
curl -X GET "http://localhost:3001/api/moderation/logs?page=1&limit=20" \
  -H "Authorization: Bearer <moderator_token>"

# Filter by target user
curl -X GET "http://localhost:3001/api/moderation/logs?targetUserId=<user_id>&page=1" \
  -H "Authorization: Bearer <moderator_token>"

# Filter by action type
curl -X GET "http://localhost:3001/api/moderation/logs?actionType=BAN_TEMP&page=1" \
  -H "Authorization: Bearer <moderator_token>"

# Expected: 200 OK with paginated results
```

**Test: Moderator can view user reports**

```bash
# Get all pending reports
curl -X GET "http://localhost:3001/api/moderation/reports?status=PENDING&page=1" \
  -H "Authorization: Bearer <moderator_token>"

# Filter by reported user
curl -X GET "http://localhost:3001/api/moderation/reports?reportedUserId=<user_id>" \
  -H "Authorization: Bearer <moderator_token>"

# Expected: 200 OK with paginated results
```

**Test: Admin can view audit logs**

```bash
# Get all audit logs
curl -X GET "http://localhost:3001/api/moderation/audit?page=1&limit=50" \
  -H "Authorization: Bearer <admin_token>"

# Filter by event type
curl -X GET "http://localhost:3001/api/moderation/audit?eventType=MODERATION_ACTION_TAKEN" \
  -H "Authorization: Bearer <admin_token>"

# Filter by user
curl -X GET "http://localhost:3001/api/moderation/audit?userId=<user_id>" \
  -H "Authorization: Bearer <admin_token>"

# Expected: 200 OK with paginated results
```

## Database Verification Queries

```sql
-- Check user flags and moderation status
SELECT id, "permanentUsername", role, "isFlagged", "isBanned", "isMuted", 
       "banExpiresAt", "muteExpiresAt", "accountStatus"
FROM "User"
WHERE "isFlagged" = true OR "isBanned" = true OR "isMuted" = true;

-- Check pending reports
SELECT ur.id, ur."reportReason", ur."reportDetails", ur.status,
       reporter."permanentUsername" as reporter_name,
       reported."permanentUsername" as reported_name
FROM "UserReport" ur
JOIN "User" reporter ON ur."reporterId" = reporter.id
LEFT JOIN "User" reported ON ur."reportedUserId" = reported.id
WHERE ur.status = 'PENDING'
ORDER BY ur."createdAt" DESC;

-- Check active moderation actions
SELECT ma.id, ma."actionType", ma.reason, ma.duration, ma."expiresAt", ma."isActive",
       moderator."permanentUsername" as moderator_name,
       target."permanentUsername" as target_name
FROM "ModerationAction" ma
JOIN "User" moderator ON ma."moderatorId" = moderator.id
LEFT JOIN "User" target ON ma."targetUserId" = target.id
WHERE ma."isActive" = true
ORDER BY ma."createdAt" DESC;

-- Check pending appeals
SELECT mapp.id, mapp.reason, mapp.status, mapp."reviewNotes",
       appellant."permanentUsername" as appellant_name,
       ma."actionType" as action_type
FROM "ModerationAppeal" mapp
JOIN "User" appellant ON mapp."userId" = appellant.id
JOIN "ModerationAction" ma ON mapp."moderationActionId" = ma.id
WHERE mapp.status = 'PENDING'
ORDER BY mapp."createdAt" DESC;

-- Check recent audit logs
SELECT al.id, al."eventType", al."eventDetails", al."ipAddress",
       u."permanentUsername" as user_name, al."createdAt"
FROM "AuditLog" al
LEFT JOIN "User" u ON al."userId" = u.id
ORDER BY al."createdAt" DESC
LIMIT 50;
```

## Expected Outcomes

### ✅ Successful Tests

1. **RBAC Enforcement**: Only users with MODERATOR or ADMIN roles can access moderation endpoints
2. **Auto-Flagging**: Users are automatically flagged after receiving 3 pending reports
3. **Moderation Actions**: Moderators can successfully mute, kick, and ban users
4. **Appeals**: Users can submit appeals, and moderators can approve/reject them
5. **Auto-Expiration**: Temporary bans and mutes expire automatically via background jobs
6. **Audit Logging**: All actions are logged immutably in the AuditLog table
7. **Pagination**: All list endpoints support pagination

### ❌ Expected Failures

1. Regular users attempting to access moderation logs should receive 403 Forbidden
2. Users attempting to report themselves should receive 400 Bad Request
3. Users attempting to appeal actions not targeting them should receive 403 Forbidden
4. Duplicate appeals for the same action should receive 400 Bad Request
5. Invalid action types or missing required fields should receive 400 Bad Request

## Notes

- All timestamps should be stored in UTC
- Background jobs run every 2 minutes for ban/mute expiration checks
- Audit logs include IP address and user agent for all actions
- Appeals automatically reverse the original moderation action when approved
- Pagination defaults: page=1, limit=20 (moderation logs/reports), limit=50 (audit logs)
