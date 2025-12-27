# User record schema

| Field Name | Type | Options | Description |
|------------|------|---------|-------------|
| `id` | RECORD_ID | Auto-generated | Unique user identifier |
| `email` | EMAIL | Unique, required for registered users | User's email address |
| `passwordHash` | SINGLE_LINE_TEXT | Encrypted, required for registered users | Hashed password (bcrypt/argon2) |
| `permanentUsername` | SINGLE_LINE_TEXT | Unique, 4-20 chars, required for registered | Permanent account username |
| `preferredName` | SINGLE_LINE_TEXT | Optional | Display name for UI |
| `avatarUrl` | URL | Optional | Profile picture URL |
| `accountType` | SELECT | Options: `REGISTERED`, `GUEST` | Account type |
| `ageVerified` | CHECKBOX | Default: false | Age verification status (18+) |
| `idVerified` | CHECKBOX | Default: false | ID verification status (18+ RED) |
| `idVerificationDate` | DATETIME | Optional | When ID was verified |
| `idVerificationProvider` | SINGLE_LINE_TEXT | Optional | Verification service used |
| `dateOfBirth` | DATE | Optional, encrypted | User's DOB (for age verification) |
| `accountStatus` | SELECT | Options: `ACTIVE`, `SUSPENDED`, `BANNED`, `DELETED` | Account status |
| `banReason` | LONG_TEXT | Optional | Reason for ban/suspension |
| `banExpiresAt` | DATETIME | Optional | Temporary ban expiration |
| `createdAt` | CREATED_AT | Auto | Account creation timestamp |
| `updatedAt` | UPDATED_AT | Auto | Last profile update |
| `lastSeenAt` | DATETIME | Auto-updated | Last activity timestamp |
| `isOnline` | CHECKBOX | Default: false | Current online status |
| `stayOnline` | CHECKBOX | Default: false | "Stay online" preference |
| `stayOnlineUntil` | DATETIME | Optional | Stay online expiration time |

Notes:
- For `REGISTERED` accounts, `email`, `passwordHash`, and `permanentUsername` must be present and unique.
- `passwordHash` must be stored using a modern, secure hashing method (bcrypt, argon2). Never store plaintext passwords.
- Treat `dateOfBirth` and other PII as sensitive: encrypt at rest and limit access in application logic.
- Use `createdAt`, `updatedAt`, and `lastSeenAt` to manage account lifecycle and session/timeouts.
