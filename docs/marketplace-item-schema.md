# MarketplaceItems record schema

| Field Name | Type | Options | Description |
|------------|------|---------|-------------|
| `id` | RECORD_ID | Auto-generated | Unique item ID |
| `sellerId` | LINKED_RECORD | Links to Users, required | Item seller |
| `title` | SINGLE_LINE_TEXT | Required, max 100 chars | Item title |
| `description` | LONG_TEXT | Required | Item description |
| `price` | CURRENCY | Required | Item price |
| `currency` | SELECT | Options: `USD`, `EUR`, `GBP` | Currency type |
| `category` | SELECT | Options: `PHOTOS`, `VIDEOS`, `CUSTOM_CONTENT`, `SERVICES`, `OTHER` | Item category |
| `contentType` | SELECT | Options: `SFW`, `NSFW` | Content rating |
| `thumbnailUrl` | URL | Required | Preview image |
| `previewUrls` | ATTACHMENT | Multiple allowed | Additional previews |
| `accessLevel` | SELECT | Options: `MAIN_LOUNGE`, `RED_LOUNGE` | Where item is visible |
| `status` | SELECT | Options: `ACTIVE`, `SOLD`, `REMOVED`, `PENDING_REVIEW` | Item status |
| `viewCount` | NUMBER | Default: 0 | Number of views |
| `purchaseCount` | NUMBER | Default: 0 | Number of purchases |
| `createdAt` | CREATED_AT | Auto | Listing creation |
| `updatedAt` | UPDATED_AT | Auto | Last update |
