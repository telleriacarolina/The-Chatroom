<!-- # AuditLogs record schema -->

| Field Name | Type | Options | Description |
|------------|------|---------|-------------|
| `id` | RECORD_ID | Auto-generated | Unique log ID |
| `userId` | LINKED_RECORD | Links to Users, optional | User who triggered event |
| `eventType` | SELECT | Options: `LOGIN`, `LOGOUT`, `VERIFICATION_ATTEMPT`, `MESSAGE_SENT`, `ITEM_PURCHASED`, `MODERATION_ACTION`, `ACCOUNT_DELETED` | Event type |
| `eventDetails` | LONG_TEXT | Optional | JSON event data |
| `ipAddress` | SINGLE_LINE_TEXT | Optional | User's IP |
| `userAgent` | LONG_TEXT | Optional | Browser/device info |
| `createdAt` | CREATED_AT | Auto | Event timestamp |
