# ChatMessages record schema

| Field Name | Type | Options | Description |
|------------|------|---------|-------------|
| `id` | RECORD_ID | Auto-generated | Unique message ID |
| `loungeId` | LINKED_RECORD | Links to Lounges, required | Lounge where message was sent |
| `languageRoomId` | LINKED_RECORD | Links to LanguageRooms, required | Language room |
| `userId` | LINKED_RECORD | Links to Users, required | Message sender |
| `displayUsername` | SINGLE_LINE_TEXT | Required | Username shown (temp or permanent) |
| `messageText` | LONG_TEXT | Required | Message content |
| `messageType` | SELECT | Options: `TEXT`, `IMAGE`, `VIDEO`, `LINK`, `SYSTEM` | Message type |
| `attachmentUrl` | URL | Optional | Media attachment URL |
| `isEdited` | CHECKBOX | Default: false | Edit status |
| `editedAt` | DATETIME | Optional | Last edit timestamp |
| `isDeleted` | CHECKBOX | Default: false | Soft delete flag |
| `deletedAt` | DATETIME | Optional | Deletion timestamp |
| `deletedBy` | LINKED_RECORD | Links to Users, optional | Who deleted (user or moderator) |
| `flagCount` | NUMBER | Default: 0 | Number of user reports |
| `isFlagged` | CHECKBOX | Default: false | Flagged for moderation |
| `moderationStatus` | SELECT | Options: `APPROVED`, `PENDING`, `REMOVED` | Moderation status |
| `createdAt` | CREATED_AT | Auto | Message timestamp |
