# @chatroom/api

Backend REST API for The Chatroom application.

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** JWT (access + refresh tokens)
- **Security:** bcrypt, CSRF protection, rate limiting
- **SMS:** Twilio integration

## Structure

```
src/
├── server.js           # Main Express server
├── routes/             # API endpoints
│   └── auth.js         # Authentication routes
├── middleware/         # Express middleware
│   ├── csrf.js         # CSRF protection
│   └── rateLimiter.js  # Rate limiting
├── services/           # Business logic
│   └── backgroundJobs.js
├── utils/              # Utilities
│   ├── logger.js
│   └── security.js
├── lib/                # Core libraries
│   ├── jwt.ts          # JWT utilities
│   ├── crypto.js       # Encryption
│   ├── prisma.ts       # Database client
│   └── twilio.ts       # SMS integration
prisma/
└── schema.prisma       # Database schema
```

## Environment Variables

Create a `.env` file:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/chatroom"
ACCESS_TOKEN_SECRET="your-access-secret-32-chars-min"
REFRESH_TOKEN_SECRET="your-refresh-secret-32-chars-min"
PHONE_ENC_KEY="your-encryption-key-32-bytes"
PORT=3001
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"

# Optional: Twilio
TWILIO_ACCOUNT_SID="your-sid"
TWILIO_AUTH_TOKEN="your-token"
TWILIO_FROM_NUMBER="+1234567890"
```

## Development

```bash
# Install dependencies (from root)
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start dev server
npm run dev:api
```

Server runs on http://localhost:3001

### Health & CORS

- Health endpoint: `GET /health` returns `{ status: "ok", timestamp }`.
- CORS origin: configured to `FRONTEND_URL` (default `http://localhost:3000`).
- Cookies: auth tokens set as httpOnly cookies; ensure same-origin frontend in dev.

## API Endpoints

### Authentication

- `POST /api/auth/csrf` - Get CSRF token
- `POST /api/auth/signup` - Register with phone number
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/guest` - Create guest session
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Sign out

### Health Check

- `GET /health` - Server health status

## Database

Prisma schema includes:
- User (accounts, profiles, verification)
- Session (JWT sessions)
- TempSession (guest sessions)
- Lounge, LanguageRoom (chat rooms)
- ChatMessage (messages with moderation)
- MarketplaceItem, Transaction
- ModerationAction, UserReport
- IDVerification, AuditLog

## Scripts

```bash
npm run dev          # Start with nodemon
npm run start        # Production start
npm run dev:debug    # Start with inspector
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
```

## Dependencies

See [package.json](./package.json) for full list.

Key dependencies:
- express
- @prisma/client
- jsonwebtoken
- bcryptjs
- helmet, cors
- express-rate-limit
- twilio
