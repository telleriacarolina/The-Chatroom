# Marketplace API Testing Guide

This document provides manual testing instructions for the Marketplace MVP endpoints.

## Prerequisites

1. **Database Setup**: Run migrations to apply schema changes
   ```bash
   npx prisma migrate dev --schema=./packages/api/prisma/schema.prisma
   npx prisma generate --schema=./packages/api/prisma/schema.prisma
   ```

2. **Environment Variables**: Configure `.env` file with required values:
   ```bash
   # Required
   DATABASE_URL="postgresql://user:password@localhost:5432/chatroom"
   ACCESS_TOKEN_SECRET="your-super-secret-access-key-min-32-chars"
   
   # Optional (for Stripe integration)
   STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
   STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
   
   # Optional (for S3 file storage)
   AWS_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="your_access_key"
   AWS_SECRET_ACCESS_KEY="your_secret_key"
   S3_BUCKET_NAME="your-bucket-name"
   ```

3. **Start the API Server**:
   ```bash
   npm run dev:api
   ```
   Server should start on `http://localhost:3001`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

To get a test token, you can use the existing auth endpoints or create a test user.

## Test Endpoints

### 1. Upload Marketplace Content

**Endpoint**: `POST /api/market/content`  
**Auth**: Required  
**Content-Type**: `multipart/form-data`

**Form Fields**:
- `file`: File upload (required) - The main content file (image/video/pdf/zip)
- `thumbnail`: File upload (required) - Thumbnail image
- `title`: String (required) - Title of the item
- `description`: String (required) - Description
- `price`: Number (required) - Price in decimal format (e.g., 9.99)
- `category`: String (required) - One of: PHOTOS, VIDEOS, CUSTOM_CONTENT, SERVICES, OTHER
- `contentType`: String (required) - SFW or NSFW
- `accessLevel`: String (required) - MAIN_LOUNGE or RED_LOUNGE
- `currency`: String (optional, default: USD) - USD, EUR, or GBP

**Example using cURL**:
```bash
curl -X POST http://localhost:3001/api/market/content \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/content.jpg" \
  -F "thumbnail=@/path/to/thumbnail.jpg" \
  -F "title=Amazing Content" \
  -F "description=High quality content for you" \
  -F "price=9.99" \
  -F "category=PHOTOS" \
  -F "contentType=SFW" \
  -F "accessLevel=MAIN_LOUNGE" \
  -F "currency=USD"
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "item": {
    "id": "uuid",
    "title": "Amazing Content",
    "description": "High quality content for you",
    "price": "9.99",
    "currency": "USD",
    "category": "PHOTOS",
    "contentType": "SFW",
    "thumbnailUrl": "https://...",
    "status": "ACTIVE",
    "createdAt": "2024-01-17T06:00:00.000Z"
  }
}
```

### 2. Purchase an Item

**Endpoint**: `POST /api/market/purchase`  
**Auth**: Required  
**Content-Type**: `application/json`

**Body**:
```json
{
  "itemId": "uuid-of-item",
  "paymentMethod": "STRIPE"
}
```

**Example using cURL**:
```bash
curl -X POST http://localhost:3001/api/market/purchase \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "ITEM_UUID",
    "paymentMethod": "STRIPE"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "status": "PENDING",
    "amount": "9.99",
    "currency": "USD",
    "platformFee": "1.00",
    "creatorPayout": "8.99"
  },
  "paymentIntent": {
    "id": "pi_xxx",
    "clientSecret": "pi_xxx_secret_xxx"
  }
}
```

**Note**: Platform fee is calculated at 10% of the total amount.

### 3. Get Creator Statistics

**Endpoint**: `GET /api/market/creator/stats`  
**Auth**: Required

**Example using cURL**:
```bash
curl -X GET http://localhost:3001/api/market/creator/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "stats": {
    "totalItems": 5,
    "activeItems": 4,
    "totalSales": 10,
    "totalRevenue": 99.90,
    "totalPayout": 89.91,
    "totalFees": 9.99
  }
}
```

### 4. Get Creator Sales History

**Endpoint**: `GET /api/market/creator/sales`  
**Auth**: Required  
**Query Params**: `page` (default: 1), `limit` (default: 20)

**Example using cURL**:
```bash
curl -X GET "http://localhost:3001/api/market/creator/sales?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "sales": [
    {
      "id": "uuid",
      "item": {
        "id": "uuid",
        "title": "Amazing Content",
        "thumbnailUrl": "https://...",
        "category": "PHOTOS"
      },
      "buyer": {
        "id": "uuid",
        "permanentUsername": "user123",
        "preferredName": "John"
      },
      "amount": "9.99",
      "currency": "USD",
      "platformFee": "1.00",
      "payout": "8.99",
      "status": "COMPLETED",
      "createdAt": "2026-01-17T06:00:00.000Z",
      "completedAt": "2026-01-17T06:01:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 10,
    "totalPages": 1
  }
}
```

### 5. Get Creator Items

**Endpoint**: `GET /api/market/creator/items`  
**Auth**: Required  
**Query Params**: `status` (optional: ACTIVE, INACTIVE), `page` (default: 1), `limit` (default: 20)

**Example using cURL**:
```bash
curl -X GET "http://localhost:3001/api/market/creator/items?status=ACTIVE&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "items": [
    {
      "id": "uuid",
      "title": "Amazing Content",
      "description": "High quality content",
      "price": "9.99",
      "currency": "USD",
      "category": "PHOTOS",
      "contentType": "SFW",
      "thumbnailUrl": "https://...",
      "status": "ACTIVE",
      "viewCount": 100,
      "purchaseCount": 5,
      "createdAt": "2026-01-17T06:00:00.000Z",
      "updatedAt": "2026-01-17T06:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 4,
    "totalPages": 1
  }
}
```

### 6. Browse Marketplace Items

**Endpoint**: `GET /api/market/items`  
**Auth**: Not required  
**Query Params**: 
- `category` (optional): PHOTOS, VIDEOS, CUSTOM_CONTENT, SERVICES, OTHER
- `contentType` (optional): SFW, NSFW
- `accessLevel` (optional): MAIN_LOUNGE, RED_LOUNGE
- `sort` (optional): createdAt (default), price_asc, price_desc, popular
- `page` (default: 1)
- `limit` (default: 20)

**Example using cURL**:
```bash
curl -X GET "http://localhost:3001/api/market/items?category=PHOTOS&sort=popular&page=1&limit=10"
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "items": [
    {
      "id": "uuid",
      "title": "Amazing Content",
      "description": "High quality content",
      "price": "9.99",
      "currency": "USD",
      "category": "PHOTOS",
      "contentType": "SFW",
      "thumbnailUrl": "https://...",
      "seller": {
        "id": "uuid",
        "permanentUsername": "creator123",
        "preferredName": "Jane",
        "avatarUrl": "https://..."
      },
      "viewCount": 100,
      "purchaseCount": 5,
      "createdAt": "2026-01-17T06:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 25,
    "totalPages": 3
  }
}
```

### 7. Get Item Details

**Endpoint**: `GET /api/market/items/:id`  
**Auth**: Not required

**Example using cURL**:
```bash
curl -X GET http://localhost:3001/api/market/items/ITEM_UUID
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "item": {
    "id": "uuid",
    "title": "Amazing Content",
    "description": "High quality content for you",
    "price": "9.99",
    "currency": "USD",
    "category": "PHOTOS",
    "contentType": "SFW",
    "thumbnailUrl": "https://...",
    "accessLevel": "MAIN_LOUNGE",
    "status": "ACTIVE",
    "seller": {
      "id": "uuid",
      "permanentUsername": "creator123",
      "preferredName": "Jane",
      "avatarUrl": "https://..."
    },
    "viewCount": 101,
    "purchaseCount": 5,
    "createdAt": "2026-01-17T06:00:00.000Z",
    "updatedAt": "2026-01-17T06:00:00.000Z"
  }
}
```

### 8. Stripe Webhook (For Testing Payment Events)

**Endpoint**: `POST /api/market/webhook/stripe`  
**Auth**: Stripe signature verification  
**Content-Type**: `application/json`

**Note**: This endpoint is called by Stripe automatically. To test locally:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3001/api/market/webhook/stripe
   ```
3. Use the webhook signing secret provided by the CLI in your `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```
4. Trigger test events:
   ```bash
   stripe trigger payment_intent.succeeded
   stripe trigger payment_intent.payment_failed
   stripe trigger charge.refunded
   ```

## Testing Transaction Lifecycle

### Test Scenario 1: Successful Purchase
1. Create an item using `POST /api/market/content`
2. Purchase the item using `POST /api/market/purchase` (status: PENDING)
3. Simulate Stripe webhook: `payment_intent.succeeded` (status: COMPLETED)
4. Verify purchase count incremented on item
5. Check creator stats show the sale

### Test Scenario 2: Failed Payment
1. Create an item
2. Purchase the item (status: PENDING)
3. Simulate Stripe webhook: `payment_intent.payment_failed` (status: FAILED)
4. Verify transaction status is FAILED
5. Verify purchase count NOT incremented

### Test Scenario 3: Refund
1. Create an item
2. Purchase the item (status: PENDING)
3. Complete payment (status: COMPLETED)
4. Simulate Stripe webhook: `charge.refunded` (status: REFUNDED)
5. Verify purchase count decremented

## Platform Fee Calculation

The platform takes a **10% fee** on all transactions:
- Sale Price: $10.00
- Platform Fee: $1.00 (10%)
- Creator Payout: $9.00 (90%)

## Error Scenarios to Test

1. **Missing Authentication**: Try accessing protected endpoints without token → 401 Unauthorized
2. **Invalid Item ID**: Purchase non-existent item → 404 Not Found
3. **Self-Purchase**: Try to buy your own item → 400 Bad Request
4. **Missing Fields**: Upload content without required fields → 400 Bad Request
5. **Invalid File Type**: Upload unsupported file type → 400 Bad Request
6. **No Payment Processor**: Purchase without Stripe configured → Transaction PENDING with message

## Notes

- All monetary values are in decimal format (e.g., "9.99")
- File uploads require multipart/form-data encoding
- S3 storage is optional; if not configured, local file paths are used
- Stripe integration is optional; if not configured, transactions remain PENDING
- Transaction status lifecycle: PENDING → COMPLETED / FAILED / REFUNDED
- Platform fee is always 10% of the transaction amount
