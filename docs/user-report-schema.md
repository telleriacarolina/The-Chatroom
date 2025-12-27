# UserReports record schema

| Field Name | Type | Options | Description |
|------------|------|---------|-------------|
| `id` | RECORD_ID | Auto-generated | Unique report ID |
| `reporterId` | LINKED_RECORD | Links to Users, required | User who reported |
| `reportedUserId` | LINKED_RECORD | Links to Users, optional | Reported user |
| `reportedMessageId` | LINKED_RECORD | Links to ChatMessages, optional | Reported message |
| `reportedItemId` | LINKED_RECORD | Links to MarketplaceItems, optional | Reported item |
| `reportReason` | SELECT | Options: `SPAM`, `HARASSMENT`, `INAPPROPRIATE_CONTENT`, `UNDERAGE`, `SCAM`, `OTHER` | Report reason |
| `reportDetails` | LONG_TEXT | Optional | Additional details |
| `status` | SELECT | Options: `PENDING`, `REVIEWED`, `ACTION_TAKEN`, `DISMISSED` | Report status |
| `reviewedBy` | LINKED_RECORD | Links to Users, optional | Moderator who reviewed |
| `reviewedAt` | DATETIME | Optional | Review timestamp |
| `createdAt` | CREATED_AT | Auto | Report timestamp |
