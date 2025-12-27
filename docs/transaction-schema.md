# Transactions record schema

| Field Name | Type | Options | Description |
|------------|------|---------|-------------|
| `id` | RECORD_ID | Auto-generated | Unique transaction ID |
| `itemId` | LINKED_RECORD | Links to MarketplaceItems, required | Purchased item |
| `buyerId` | LINKED_RECORD | Links to Users, required | Buyer |
| `sellerId` | LINKED_RECORD | Links to Users, required | Seller |
| `amount` | CURRENCY | Required | Transaction amount |
| `currency` | SELECT | Options: `USD`, `EUR`, `GBP` | Currency |
| `paymentMethod` | SELECT | Options: `STRIPE`, `PAYPAL`, `CRYPTO` | Payment processor |
| `paymentStatus` | SELECT | Options: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED` | Payment status |
| `transactionFee` | CURRENCY | Optional | Platform fee |
| `sellerPayout` | CURRENCY | Auto-calculated | Seller's net amount |
| `paymentIntentId` | SINGLE_LINE_TEXT | Optional | Stripe/PayPal ID |
| `createdAt` | CREATED_AT | Auto | Transaction timestamp |
| `completedAt` | DATETIME | Optional | Completion timestamp |
