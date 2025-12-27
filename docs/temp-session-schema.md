# Temporary Session record schema

| Field Name | Type | Options | Description |
|------------|------|---------|-------------|
| `id` | RECORD_ID | Auto-generated | Unique temp session ID |
| `userId` | LINKED_RECORD | Links to Users, optional | User (if registered using temp username) |
| `temporaryUsername` | SINGLE_LINE_TEXT | Unique, 4-10 chars, required | Temporary username |
| `ageCategory` | SELECT | Options: `18+`, `18+RED` | Age category selected |
| `sessionToken` | SINGLE_LINE_TEXT | Unique, indexed | Session token |
| `expiresAt` | DATETIME | Required | Temp session expiration |
| `createdAt` | CREATED_AT | Auto | Creation timestamp |

Notes:
- Temporary sessions are intended for short-lived, optionally anonymous usage. Rotate or invalidate `sessionToken` on logout or expiry.
- If `userId` is present, link the record to the permanent user account.
