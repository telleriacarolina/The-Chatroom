# ModerationActions record schema

| Field Name | Type | Options | Description |
|------------|------|---------|-------------|
| `id` | RECORD_ID | Auto-generated | Unique action ID |
| `moderatorId` | LINKED_RECORD | Links to Users, required | Moderator who took action |
| `targetUserId` | LINKED_RECORD | Links to Users, optional | User being moderated |
| `targetMessageId` | LINKED_RECORD | Links to ChatMessages, optional | Message being moderated |
| `targetItemId` | LINKED_RECORD | Links to MarketplaceItems, optional | Marketplace item |
| `actionType` | SELECT | Options: `WARNING`, `MUTE`, `KICK`, `BAN_TEMP`, `BAN_PERMANENT`, `MESSAGE_DELETE`, `ITEM_REMOVE` | Action type |
| `reason` | LONG_TEXT | Required | Reason for action |
| `duration` | NUMBER | Optional (minutes) | Duration for temp actions |
| `expiresAt` | DATETIME | Optional | Expiration for temp actions |
| `isActive` | CHECKBOX | Default: true | Action active status |
| `createdAt` | CREATED_AT | Auto | Action timestamp |
