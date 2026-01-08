# The Chatroom

A real-time chat application with multi-tier authentication, language-specific lounges, user marketplace, moderation, and verification system. Built with Node.js, Express, Socket.IO, Next.js, and PostgreSQL.

**📦 Monorepo Structure:** This project is fully consolidated with all code in the `packages/` directory.

---

## 📦 Packages

```bash

##Packages 

The-Chatroom/
├── packages/
│   ├── api/          # Backend REST API (Express + Prisma + PostgreSQL)
│   ├── socket/       # WebSocket server (Socket.IO)
│   ├── web/          # Frontend (Next.js 14 + React 18 + TypeScript)
│   └── shared/       # Shared types, schemas, and utilities
├── docs/             # Documentation
└── package.json      # Workspace configuration

### Package Details

- **[@chatroom/api](packages/api/)** - Backend REST API (Express, Prisma, JWT)
- **[@chatroom/socket](packages/socket/)** - WebSocket server (Socket.IO)
- **[@chatroom/web](packages/web/)** - Frontend application (Next.js, React)
- **[@chatroom/shared](packages/shared/)** - Shared types, schemas, and utilities

---

## Features

- **Multi-tier Authentication**
  - Guest sessions
  - Phone number registration
  - JWT-based sessions with access & refresh tokens

- **Real-time Chat**
  - WebSocket messaging via Socket.IO
  - Language-based rooms & lounges
  - Online/offline presence tracking

- **Marketplace**
  - User-generated content sales
  - Payment transaction management

- **Moderation**
  - User reporting
  - Moderation actions and audit logs

- **Verification**
  - Age verification
  - ID/document verification

---

## Technology Stack

- **Backend:** Node.js, Express, Socket.IO
- **Frontend:** Next.js 14, React 18, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT, bcrypt, CSRF protection, rate limiting
- **Real-time Messaging:** Socket.IO
- **SMS Integration:** Twilio (optional)
- **UI:** Tailwind CSS, shadcn/ui, Lucide icons

---

## Project Structure

The-Chatroom/
├── server/           # API and Socket.IO servers
├── routes/           # API routes
├── lib/              # Core libraries (JWT, crypto, Prisma, Twilio)
├── middleware/       # Express middleware (rate limiting, CSRF)
├── services/         # Background jobs
├── utils/            # Logger & security helpers
├── components/       # React UI components
├── pages/            # Next.js pages
├── prisma/           # Database schema
├── public/           # Static assets & client scripts
└── docs/             # Documentation

⸻

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### 1. Install Dependencies

```bash
npm install
npm run dev
```

### 2. Configure Environment

Each package has its own environment configuration:

**API Package** (`packages/api/.env`):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/chatroom"
ACCESS_TOKEN_SECRET="your-access-secret"
REFRESH_TOKEN_SECRET="your-refresh-secret"
PHONE_ENC_KEY="32-byte-encryption-key"
PORT=3001
```

**Socket Package** (`packages/socket/.env`):

```bash
SOCKET_PORT=3002
FRONTEND_URL="http://localhost:3000"
```

**Web Package** (`packages/web/.env.local`):

```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3002"
```

### 3. Set Up Database

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Run the Application

#### Option A: All-in-One Script (Recommended)

```bash
# First time setup
./start-all.sh --setup

# Start all services
./start-all.sh

# View logs
./start-all.sh --logs

# Get help
./start-all.sh --help
```

#### Option B: Individual Services

```bash
npm run dev:api      # API server (http://localhost:3001)
npm run dev:socket   # Socket.IO (http://localhost:3002)
npm run dev:web      # Next.js (http://localhost:3000)
```

#### Option C: Standalone Single-File App

```bash
node app-standalone.js
```

### 5. Access Application

- **🌐 Frontend:** <http://localhost:3000>
- **📡 API:** <http://localhost:3001>
- **🔌 WebSocket:** <http://localhost:3002>
- **📊 Health Check:** <http://localhost:3001/health>

---

### Health Checks

Quickly verify the services are healthy and connected.

```bash
# API health (expects a JSON response with status: ok)
curl -s http://localhost:3001/health
```

From the browser console on the frontend (<http://localhost:3000>):

```js
(() => {
  const s = io('http://localhost:3002', { transports: ['websocket'] });
  s.on('connect', () => console.log('socket connected:', s.id));
  s.on('chat message', (m) => console.log('message:', m));
  s.emit('chat message', 'hello from UI');
})();
```

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chatroom"

# JWT Secrets
ACCESS_TOKEN_SECRET="your-access-secret"
REFRESH_TOKEN_SECRET="your-refresh-secret"

# Encryption
PHONE_ENC_KEY="32-byte-encryption-key"
ENCRYPTION_KEY="fallback-key"

# Twilio (optional)
TWILIO_ACCOUNT_SID="optional"
TWILIO_AUTH_TOKEN="optional"
TWILIO_FROM_NUMBER="+1234567890"

# Server Configuration
PORT=3001
SOCKET_PORT=3002
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

## NPM Scripts

### Development

```bash
npm run dev              # Run all services
npm run dev:api          # API server only
npm run dev:socket       # Socket.IO server only
npm run dev:web          # Next.js frontend only
```

### Production

```bash
npm run build            # Build all packages
npm run build:web        # Build web only
npm run start            # Start all services
npm run start:api        # Start API only
npm run start:socket     # Start Socket.IO only
npm run start:web        # Start Next.js only
```

### Database

```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
```

### Utilities

```bash
npm run clean            # Clean all build artifacts and node_modules
```

## Dev Tips

- Prefer workspace-specific runs: use npm run dev:web, npm run dev:api, and npm run dev:socket to start services individually.
- Avoid npm run dev when you only need one service; it runs dev scripts across all workspaces.
- Expected ports: Web :3000, API :3001, Socket :3002.
- If TypeScript errors appear from other packages, limit scope during web dev as configured in tsconfig.json.

---

### Last updated: December 28, 2025

⸻

## Documentation

- [Full Codebase Reference](docs/COMPLETE_CODEBASE.md) – Complete code listings and architecture
- [Update Scenarios Playbook](docs/update-scenarios/README.md) – Where to place changes and patterns
- [Update Workflow Checklist](docs/update-scenarios/UPDATE_WORKFLOW.md) – Step-by-step process for updates
- [Commit History](docs/Commit.md) – Development progression and past changes
- [Project TODOs](docs/TODO.md) – Active tasks and implementation roadmap

---

## API Overview

### Authentication Routes

- **POST /api/auth/csrf** – Returns CSRF token and sets cookie
- **POST /api/auth/signup** – Register by phone; returns status and userId
  - Body: `phoneNumber`, `firstName`, `lastName`, `birthYear`
- **POST /api/auth/signin** – Authenticate and set `accessToken` + `refreshToken`
  - Body: `phoneNumber`, `password`, `staySignedIn`
- **POST /api/auth/guest** – Create temporary guest session
  - Body: `ageCategory` (`_18PLUS` or `_18PLUS_RED`)
- **POST /api/auth/change-password** – Change password (requires auth)
  - Body: `phoneNumber`, `currentPassword`, `newPassword`
- **POST /api/auth/refresh** – Rotate access token from refresh token
- **POST /api/auth/logout** – Clear tokens and deactivate session

---

## Database Models (Prisma)

- **User** – Account, profile, verification status
- **Session** – Refresh token sessions with expiry
- **TempSession** – Guest sessions
- **IDVerification** – Age/ID checks
- **Lounge** – Chat rooms
- **LanguageRoom** – Language-specific rooms
- **ChatMessage** – Messages with moderation metadata
- **MarketplaceItem** – User content for sale
- **Transaction** – Payments and statuses
- **ModerationAction** – Moderation event log
- **UserReport** – Reporting system
- **AuditLog** – System audit trail

See the full schema in [prisma/schema.prisma](prisma/schema.prisma) and detailed docs in [docs/COMPLETE_CODEBASE.md](docs/COMPLETE_CODEBASE.md).

---

## Security

- **Encryption:** AES-256-GCM for phone numbers
- **CSRF Protection:** Double-submit pattern (header + cookie)
- **Rate Limiting:** `express-rate-limit` on auth, API, and heartbeat endpoints
- **Security Headers:** Helmet enabled on API server
- **Password Hashing:** bcryptjs with strong salt rounds
- **JWT Tokens:** Access (15m) and refresh (30d) with secure secrets

---

## Troubleshooting

- **Prisma errors:** Ensure `DATABASE_URL` is correct and database is reachable. Run `npm run prisma:generate` then `npm run prisma:migrate`.
- **Database connection errors:** Verify PostgreSQL is running and credentials in `.env` are correct.
- **Missing JWT/crypto secrets:** Set `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, and `PHONE_ENC_KEY`.
- **Ports in use:** Adjust `PORT` and `SOCKET_PORT` environment variables or stop conflicting processes.
- **Next.js build issues:** Clear `.next/` directory and retry `npm run next:build`.

---

## Development Setup

- **VS Code Extensions:** Prisma, ESLint, Prettier, Tailwind CSS IntelliSense
- **Debugging API:** `npm run dev:debug` to start Node with `--inspect` flag
- **Code Formatting:** Configure Prettier; TypeScript `strict` is disabled for development
- **Path Aliases:** `@/*` (root), `@/components/*`, `@/lib/*`, `@/utils/*`

---

## Contributing

- **Branches:** Use feature branches like `feat/short-description`
- **Commits:** Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add lounge filter`)
- **Tests:** Add tests where feasible; keep changes focused and minimal
- **Breaking Changes:** Discuss via issue before submitting PR
- **Guidelines:** See [CONTRIBUTING.md](CONTRIBUTING.md) for full details

---

## License

- MIT License. See [LICENSE](LICENSE) for the full text.
