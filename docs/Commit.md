````markdown
# The-Chatroom - Commit History

## Initial Scaffold

feat: initial application scaffold with auth, schemas, and core setup

- add Next.js app structure and UI components
- implement JWT-based auth API routes
- add Prisma schema and typed domain models
- add Twilio SMS integration
- add JSON schemas and documentation
- configure env example, tooling, and project config

---

## App Setup

Simple Node.js + Express + Socket.io demo chatroom scaffold.

Run locally:

```bash
npm install
npm start

# then open http://localhost:3000
```

Files added:

- `package.json` — project manifest
- `server.js` — Express + Socket.io server
- `public/` — static client (`index.html`, `client.js`, `style.css`)

Notes:

- If you want auto-reload during development, install `nodemon` and run `npm run dev`.

---

## Crypto

chore(security): add standardized crypto helpers

- Move/enhance phone encryption into `lib/crypto` (AES-GCM)
- Provide CommonJS wrapper for `encryptPhone`/`decryptPhone`
- Update `utils/security.js` to delegate to `lib/crypto`

---

## Middleware

chore(middleware): add request lifecycle utilities

- Add rate limiting middleware with Redis fallback
- Add CSRF protection middleware (double-submit)
- Add `lib/middleware` helpers for auth and rate limiting utilities

---

## Migrations

chore(migrations): add verification tables and retention policy

- Add `migrations/003_verification_tables.sql` to create `id_verifications` and `verification_retention_policy`
- Add user verification fields to `users` table

---

## Services

feat(services): add domain-level services

- Add `services/heartbeat` and `services/backgroundJobs` for presence and session cleanup
- Add `services/documentUpload` (S3 delete helper)
- Add verification cleanup cron job under `src/jobs`

---

## Utils

chore(utils): add helpers and logging

- Add `utils/security` wrapper for CSRF and encryption delegation
- Add `utils/logger` lightweight logging utility

````
