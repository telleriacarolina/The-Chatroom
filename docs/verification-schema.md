# Verification record schema

| Field Name | Type | Options | Description |
|------------|------|---------|-------------|
| `id` | RECORD_ID | Auto-generated | Unique verification ID |
| `userId` | LINKED_RECORD | Links to Users, required | User being verified |
| `verificationType` | SELECT | Options: `AGE_ONLY`, `ID_FULL` | Verification level |
| `verificationStatus` | SELECT | Options: `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED` | Current status |
| `documentType` | SELECT | Options: `DRIVERS_LICENSE`, `PASSPORT`, `NATIONAL_ID`, `STATE_ID` | ID document type |
| `documentImageUrl` | URL | Encrypted, required | Uploaded ID image URL |
| `selfieImageUrl` | URL | Encrypted, required | Selfie for verification |
| `verificationProvider` | SINGLE_LINE_TEXT | Optional | Third-party service (e.g., Onfido, Jumio) |
| `verificationProviderResponse` | LONG_TEXT | Encrypted, optional | Raw API response |
| `verifiedAt` | DATETIME | Optional | Approval timestamp |
| `expiresAt` | DATETIME | Optional | Verification expiration (e.g., annual re-verification) |
| `rejectionReason` | LONG_TEXT | Optional | Reason for rejection |
| `createdAt` | CREATED_AT | Auto | Submission timestamp |
| `updatedAt` | UPDATED_AT | Auto | Last status update |

Notes:
- Treat uploaded images and provider responses as sensitive PII. Store encrypted and limit access.
