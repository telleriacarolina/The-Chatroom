# Lounge record schema

| Field Name | Type | Options | Description |
|------------|------|---------|-------------|
| `id` | RECORD_ID | Auto-generated | Unique lounge ID |
| `name` | SINGLE_LINE_TEXT | Required | Lounge name (e.g., "The Main Lounge") |
| `slug` | SINGLE_LINE_TEXT | Unique, required | URL-safe identifier (e.g., "main", "red") |
| `description` | LONG_TEXT | Required | Lounge description |
| `accessLevel` | SELECT | Options: `18+`, `18+RED` | Required verification level |
| `iconColor` | SINGLE_LINE_TEXT | Hex color | UI icon color |
| `isActive` | CHECKBOX | Default: true | Lounge availability |
| `maxCapacity` | NUMBER | Optional | Max concurrent users |
| `currentUserCount` | NUMBER | Auto-calculated | Current online users |
| `createdAt` | CREATED_AT | Auto | Creation timestamp |

Notes:
- `slug` should be URL-safe; enforce uniqueness and sensible validation.
- `currentUserCount` typically computed from session/user presence, not manually edited.
