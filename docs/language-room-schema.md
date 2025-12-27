# LanguageRooms record schema

| Field Name | Type | Options | Description |
|------------|------|---------|-------------|
| `id` | RECORD_ID | Auto-generated | Unique room ID |
| `loungeId` | LINKED_RECORD | Links to Lounges, required | Parent lounge |
| `languageCode` | SINGLE_LINE_TEXT | Required (e.g., "en", "es") | ISO language code |
| `languageName` | SINGLE_LINE_TEXT | Required | Display name (e.g., "English") |
| `flagEmoji` | SINGLE_LINE_TEXT | Required | Flag emoji |
| `currentUserCount` | NUMBER | Auto-calculated | Current online users |
| `isActive` | CHECKBOX | Default: true | Room availability |
| `createdAt` | CREATED_AT | Auto | Creation timestamp |

Notes:
- `currentUserCount` should be computed from active sessions/presence.
