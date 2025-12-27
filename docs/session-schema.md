# Session record schema

| Field Name | Type | Options | Description |
|------------|------|---------|-------------|
| `id` | RECORD_ID | Auto-generated | Unique session identifier |
| `userId` | LINKED_RECORD | Links to Users, required | User who owns this session |
| `sessionToken` | SINGLE_LINE_TEXT | Unique, indexed, required | Secure session token (JWT or UUID) |
| `ipAddress` | SINGLE_LINE_TEXT | Optional | User's IP address |
| `userAgent` | LONG_TEXT | Optional | Browser/device info |
| `isActive` | CHECKBOX | Default: true | Session active status |
| `expiresAt` | DATETIME | Required | Session expiration time |
| `createdAt` | CREATED_AT | Auto | Session start time |
| `lastActivityAt` | DATETIME | Auto-updated | Last activity in this session |
| `stayOnlineEnabled` | CHECKBOX | Default: false | Stay online for this session |

Notes:
- `sessionToken` should be stored securely (hashed if persistent) and rotated on sensitive actions.
- Keep `expiresAt` and `lastActivityAt` authoritative for session cleanup and expiry logic.
- Link `userId` to the `Users` collection/table with cascade rules as appropriate for your DB.
