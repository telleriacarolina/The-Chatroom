# Moderation System Documentation

## Overview

The Chatroom moderation system provides comprehensive tools for managing user behavior, handling reports, enforcing community guidelines, and maintaining audit trails. It includes role-based access control (RBAC), automated flagging, appeals processing, and temporary action expiration.

## Features

### 1. Role-Based Access Control (RBAC)

Three user roles with different permissions:

- **USER** (default): Can submit reports and appeals
- **MODERATOR**: Can view reports, take moderation actions, review appeals
- **ADMIN**: Full access including audit log viewing

### 2. User Reporting

- Any authenticated user can report other users, messages, or marketplace items
- Automatic flagging when a user receives 3+ pending reports
- Reports include reason categories: SPAM, HARASSMENT, INAPPROPRIATE_CONTENT, UNDERAGE, SCAM, OTHER
- Moderators can review and approve/reject reports

### 3. Moderation Actions

Moderators and admins can take the following actions:

- **WARNING**: Issue a warning to a user
- **MUTE**: Temporarily or permanently prevent a user from sending messages
- **KICK**: Remove a user from a chat room
- **BAN_TEMP**: Temporarily ban a user (with expiration)
- **BAN_PERMANENT**: Permanently ban a user
- **MESSAGE_DELETE**: Delete a specific message
- **ITEM_REMOVE**: Remove a marketplace item

### 4. Appeals System

- Users can appeal moderation actions taken against them
- One appeal per moderation action
- Moderators can approve or reject appeals
- Approved appeals automatically reverse the original action

### 5. Automated Expiration

Background jobs run every 2 minutes to:
- Auto-unban users with expired temporary bans
- Auto-unmute users with expired mutes
- Deactivate corresponding moderation actions

### 6. Audit Logging

Immutable audit logs track all moderation activities:
- User report submissions
- Moderation actions taken
- Appeal submissions and reviews
- Auto-flagging events
- Includes IP address and user agent for accountability

## API Endpoints

### Reports

#### Submit a Report
```
POST /api/moderation/report
Auth: Required (USER, MODERATOR, ADMIN)

Body:
{
  "reportedUserId": "uuid",        // Optional - report a user
  "reportedMessageId": "uuid",     // Optional - report a message
  "reportedItemId": "uuid",        // Optional - report a marketplace item
  "reportReason": "SPAM",          // Required - see ReportReason enum
  "reportDetails": "Description"   // Optional - additional details
}

Response: 201 Created
{
  "message": "Report submitted successfully",
  "report": { ... }
}
```

#### Get Reports
```
GET /api/moderation/reports?status=PENDING&reportedUserId=uuid&page=1&limit=20
Auth: Required (MODERATOR, ADMIN)

Response: 200 OK
{
  "reports": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Review a Report
```
POST /api/moderation/reports/:id/review
Auth: Required (MODERATOR, ADMIN)

Body:
{
  "status": "APPROVED" // or "REJECTED"
}

Response: 200 OK
{
  "message": "Report reviewed successfully",
  "report": { ... }
}
```

### Moderation Actions

#### Take Moderation Action
```
POST /api/moderation/action
Auth: Required (MODERATOR, ADMIN)

Body:
{
  "targetUserId": "uuid",          // Optional - target user
  "targetMessageId": "uuid",       // Optional - target message
  "targetItemId": "uuid",          // Optional - target item
  "actionType": "MUTE",            // Required - see ModerationActionType enum
  "reason": "Explanation",         // Required
  "duration": 30                   // Optional - minutes for MUTE/BAN_TEMP
}

Response: 201 Created
{
  "message": "Moderation action applied successfully",
  "moderationAction": { ... }
}
```

#### Get Moderation Logs
```
GET /api/moderation/logs?targetUserId=uuid&moderatorId=uuid&actionType=MUTE&page=1&limit=20
Auth: Required (MODERATOR, ADMIN)

Response: 200 OK
{
  "logs": [...],
  "pagination": { ... }
}
```

### Appeals

#### Submit an Appeal
```
POST /api/moderation/appeal
Auth: Required (USER, MODERATOR, ADMIN)

Body:
{
  "moderationActionId": "uuid",    // Required
  "reason": "Appeal explanation"   // Required
}

Response: 201 Created
{
  "message": "Appeal submitted successfully",
  "appeal": { ... }
}
```

#### Get Appeals
```
GET /api/moderation/appeals?status=PENDING&page=1&limit=20
Auth: Required (USER sees own, MODERATOR/ADMIN see all)

Response: 200 OK
{
  "appeals": [...],
  "pagination": { ... }
}
```

#### Review an Appeal
```
POST /api/moderation/appeals/:id/review
Auth: Required (MODERATOR, ADMIN)

Body:
{
  "status": "APPROVED",            // or "REJECTED"
  "reviewNotes": "Explanation"     // Optional
}

Response: 200 OK
{
  "message": "Appeal reviewed successfully",
  "appeal": { ... }
}
```

### Audit Logs

#### Get Audit Logs
```
GET /api/moderation/audit?userId=uuid&eventType=MODERATION_ACTION_TAKEN&page=1&limit=50
Auth: Required (ADMIN only)

Response: 200 OK
{
  "logs": [...],
  "pagination": { ... }
}
```

## Database Models

### User (additions)
```prisma
model User {
  role           String   @default("USER") // USER, MODERATOR, ADMIN
  isFlagged      Boolean  @default(false)
  isBanned       Boolean  @default(false)
  banExpiresAt   DateTime?
  isMuted        Boolean  @default(false)
  muteExpiresAt  DateTime?
}
```

### ModerationAction
```prisma
model ModerationAction {
  id              String   @id @default(uuid())
  moderatorId     String
  targetUserId    String?
  targetMessageId String?
  targetItemId    String?
  actionType      ModerationActionType
  reason          String
  duration        Int?      // minutes
  expiresAt       DateTime?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  
  @@index([targetUserId])
  @@index([moderatorId])
  @@index([isActive])
}
```

### UserReport
```prisma
model UserReport {
  id                String   @id @default(uuid())
  reporterId        String
  reportedUserId    String?
  reportedMessageId String?
  reportedItemId    String?
  reportReason      ReportReason
  reportDetails     String?
  status            String   @default("PENDING")
  reviewedById      String?
  reviewedAt        DateTime?
  createdAt         DateTime @default(now())
  
  @@index([reportedUserId])
  @@index([status])
  @@index([createdAt])
}
```

### ModerationAppeal
```prisma
model ModerationAppeal {
  id                 String   @id @default(uuid())
  userId             String
  moderationActionId String
  reason             String
  status             String   @default("PENDING")
  reviewedById       String?
  reviewNotes        String?
  reviewedAt         DateTime?
  createdAt          DateTime @default(now())
  
  @@index([userId])
  @@index([status])
}
```

### AuditLog
```prisma
model AuditLog {
  id           String   @id @default(uuid())
  userId       String?
  eventType    String
  eventDetails Json?
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())
  
  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
}
```

## Event Types

Audit log event types:
- `USER_REPORT_SUBMITTED`: User submits a report
- `USER_AUTO_FLAGGED`: User automatically flagged after 3 reports
- `MODERATION_ACTION_TAKEN`: Moderator takes action
- `REPORT_REVIEWED`: Moderator reviews a report
- `MODERATION_APPEAL_SUBMITTED`: User submits an appeal
- `APPEAL_REVIEWED`: Moderator reviews an appeal

## Background Jobs

The system includes automated background jobs:

### processExpiredBans()
- **Frequency**: Every 2 minutes
- **Function**: Checks for expired temporary bans and auto-unbans users
- **Actions**: 
  - Sets `isBanned = false`
  - Clears `banExpiresAt`
  - Sets `accountStatus = 'ACTIVE'`
  - Deactivates corresponding moderation actions

### processExpiredMutes()
- **Frequency**: Every 2 minutes
- **Function**: Checks for expired mutes and auto-unmutes users
- **Actions**:
  - Sets `isMuted = false`
  - Clears `muteExpiresAt`
  - Deactivates corresponding moderation actions

## Middleware

### authenticateRequest
- Validates JWT access token
- Extracts userId from token
- Required for all moderation endpoints

### requireRole([roles])
- Enforces role-based access control
- Accepts array of allowed roles
- Returns 403 if user doesn't have required role

### auditMiddleware
- Attaches audit logging helpers to request object
- Automatically captures IP address and user agent
- Provides `req.auditLog.create()` method

## Security Features

1. **RBAC**: Strict role enforcement on all sensitive endpoints
2. **Self-Report Prevention**: Users cannot report themselves
3. **Appeal Ownership**: Users can only appeal actions against themselves
4. **Duplicate Prevention**: One appeal per moderation action
5. **Immutable Audit Logs**: No delete/update operations exposed
6. **IP & User Agent Tracking**: All actions logged with source information
7. **Account Status Checks**: Inactive accounts cannot perform moderation actions

## Usage Examples

### Promote User to Moderator
```sql
UPDATE "User" SET role = 'MODERATOR' WHERE id = '<user_id>';
```

### Issue 24-Hour Temporary Ban
```javascript
POST /api/moderation/action
{
  "targetUserId": "user-123",
  "actionType": "BAN_TEMP",
  "reason": "Harassment violations",
  "duration": 1440  // 24 hours in minutes
}
```

### Check Flagged Users
```sql
SELECT id, "permanentUsername", "isFlagged" 
FROM "User" 
WHERE "isFlagged" = true;
```

### View Pending Appeals
```javascript
GET /api/moderation/appeals?status=PENDING&page=1&limit=20
```

## Integration with Socket.IO

For real-time moderation:
- KICK actions should emit socket events to disconnect users
- Banned users should be rejected on socket connection
- Muted users should have message sending disabled

Example socket middleware:
```javascript
io.use(async (socket, next) => {
  const user = await prisma.user.findUnique({
    where: { id: socket.userId }
  });
  
  if (user.isBanned) {
    return next(new Error('Account is banned'));
  }
  
  socket.isMuted = user.isMuted;
  next();
});
```

## Best Practices

1. **Always provide detailed reasons** for moderation actions
2. **Review reports promptly** to maintain community trust
3. **Use temporary bans** before permanent bans when appropriate
4. **Document appeal decisions** in review notes
5. **Monitor audit logs regularly** for moderator accountability
6. **Adjust auto-flag threshold** based on community size
7. **Set reasonable durations** for temporary actions

## Troubleshooting

### Reports not auto-flagging users
- Check that reports have status = 'PENDING'
- Verify threshold is set to 3 in code
- Check database for reportedUserId match

### Expired bans not lifting automatically
- Verify background jobs are running
- Check server logs for ban expiration messages
- Ensure banExpiresAt is in the past
- Confirm isBanned is true before expiration

### RBAC errors
- Verify user role is set correctly in database
- Check that middleware is applied to routes
- Ensure JWT token includes userId
- Confirm accountStatus is 'ACTIVE'

## Migration Guide

To add moderation to existing project:

1. Run Prisma migrations to add new fields and models
2. Set all existing users to role = 'USER'
3. Promote moderators/admins manually in database
4. Import moderation routes in server.js
5. Start background jobs on server initialization
6. Test RBAC with different user roles

## Future Enhancements

- [ ] Automated content filtering (profanity, spam detection)
- [ ] Moderator activity reports and analytics
- [ ] Appeal escalation to admins
- [ ] Configurable auto-flag thresholds
- [ ] Moderator notes on user profiles
- [ ] Email notifications for moderation actions
- [ ] Moderation queue with priority levels
- [ ] Bulk moderation actions
- [ ] IP-based bans for repeated offenders
- [ ] Moderator training and onboarding tools
