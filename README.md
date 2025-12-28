The Chatroom

A real-time chat application with multi-tier authentication, language-specific lounges, user marketplace, moderation, and verification system. Built with Node.js, Express, Socket.IO, Next.js, and PostgreSQL.

⸻

Features
	•	Multi-tier Authentication
	•	Guest sessions
	•	Phone number registration
	•	JWT-based sessions with access & refresh tokens
	•	Real-time Chat
	•	WebSocket messaging via Socket.IO
	•	Language-based rooms & lounges
	•	Online/offline presence tracking
	•	Marketplace
	•	User-generated content sales
	•	Payment transaction management
	•	Moderation
	•	User reporting
	•	Moderation actions and audit logs
	•	Verification
	•	Age verification
	•	ID/document verification

⸻

Technology Stack
	•	Backend: Node.js, Express, Socket.IO
	•	Frontend: Next.js 14, React 18, TypeScript
	•	Database: PostgreSQL with Prisma ORM
	•	Authentication: JWT, bcrypt, CSRF protection, rate limiting
	•	Real-time Messaging: Socket.IO
	•	SMS Integration: Twilio (optional)
	•	UI: Tailwind CSS, shadcn/ui, Lucide icons

⸻

  Project Structure
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

Getting started
    1. Install dependencies.
    npm install

    2. Configure environment.
    cp .env.example .env
    # Edit .env with your database, JWT secrets, and optional Twilio credentials

    3. Set up database.
    npm run prisma:migrate
    npm run prisma:generate

    4. Run servers.
    # API server
    npm run dev

    # Socket.IO server
    npm run socket:dev

    # Next.js frontend
    npm run next:dev

    5. Access application.
    	•	Frontend: http://localhost:3000
	    •	API: http://localhost:3001
	    •	WebSocket: http://localhost:3002

⸻

Environmental variables:
  DATABASE_URL="postgresql://user:password@localhost:5432/chatroom"
  ACCESS_TOKEN_SECRET="your-access-secret"
  REFRESH_TOKEN_SECRET="your-refresh-secret"
  PHONE_ENC_KEY="32-byte-encryption-key"
  ENCRYPTION_KEY="fallback-key"
  TWILIO_ACCOUNT_SID="optional"
  TWILIO_AUTH_TOKEN="optional"
  TWILIO_FROM_NUMBER="+1234567890"
  PORT=3001
  SOCKET_PORT=3002
  FRONTEND_URL="http://localhost:3000"
  NODE_ENV="development"

  ⸻

  Script:
  "scripts": {
  "start": "node server/server.js",
  "dev": "nodemon server/server.js",
  "socket:dev": "nodemon server/socket-server.js",
  "next:dev": "next dev",
  "next:build": "next build",
  "next:start": "next start",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev --name init"
}

Last updated: December 28,2025

⸻

Documentation

- Full codebase reference: [docs/COMPLETE_CODEBASE.md](docs/COMPLETE_CODEBASE.md)
- Commit history: [docs/Commit.md](docs/Commit.md)
- Project TODOs: [docs/TODO.md](docs/TODO.md)

⸻

API Overview

- POST /api/auth/csrf: returns CSRF token and sets cookie
- POST /api/auth/signup: registers by phone; returns status and userId
  - Body: `phoneNumber`, `firstName`, `lastName`, `birthYear`
- POST /api/auth/signin: authenticates and sets `accessToken` + `refreshToken`
  - Body: `phoneNumber`, `password`, `staySignedIn`
- POST /api/auth/guest: creates temporary guest session
  - Body: `ageCategory` (`_18PLUS` or `_18PLUS_RED`)
- POST /api/auth/change-password: change password after auth
  - Body: `phoneNumber`, `currentPassword`, `newPassword`
- POST /api/auth/refresh: rotates access token from refresh token
- POST /api/auth/logout: clears tokens, deactivates session

⸻

Database Models (Prisma)

- User: account, profile, verification status
- Session: refresh token sessions with expiry
- TempSession: guest sessions
- IDVerification: age/ID checks
- Lounge: chat rooms
- LanguageRoom: language-specific rooms
- ChatMessage: messages with moderation metadata
- MarketplaceItem: user content for sale
- Transaction: payments and statuses
- ModerationAction: moderation event log
- UserReport: reporting system
- AuditLog: system audit trail

See the full schema in [prisma/schema.prisma](prisma/schema.prisma) and detailed docs in [docs/COMPLETE_CODEBASE.md](docs/COMPLETE_CODEBASE.md).

⸻

Security

- AES-256-GCM encryption for phone numbers
- CSRF protection (double-submit: header + cookie)
- Rate limiting via `express-rate-limit` (auth, API, heartbeat)
- Helmet security headers enabled on API server
- Passwords hashed with `bcryptjs`
- JWT-based auth with access (15m) + refresh (30d) tokens

⸻

Troubleshooting

- Prisma generate/migrate fails: ensure `DATABASE_URL` is correct and database is reachable; run `npm run prisma:generate` then `npm run prisma:migrate`.
- Database connection errors: verify Postgres running and credentials in `.env`.
- Missing JWT/crypto envs: set `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `PHONE_ENC_KEY`.
- Ports in use: adjust `PORT` and `SOCKET_PORT` or stop conflicting processes.
- Next.js build issues: clear `.next/` and retry `npm run next:build`.

⸻

Development Setup

- Recommended VS Code extensions: Prisma, ESLint, Prettier, Tailwind CSS IntelliSense.
- Debugging API: `npm run dev:debug` to start with `--inspect`.
- Formatting: use Prettier; keep TypeScript `strict` off as configured.
- Path aliases: `@/*` for workspace root, `@/components/*`, `@/lib/*`, `@/utils/*`.

⸻

Contributing

- PRs welcome. Use feature branches like `feat/short-description`.
- Commit style: Conventional Commits (e.g., `feat: add lounge filter`).
- Add tests where feasible; keep changes focused and minimal.
- Discuss breaking changes via issue before submitting.
- See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

⸻

License

- MIT License. See [LICENSE](LICENSE) for the full text.
