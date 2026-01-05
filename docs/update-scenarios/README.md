# Update Scenarios Playbook

A concise, practical reference for where to place changes and how to update existing code across the project.

## Contents

- Backend API routes
- Server middleware & config
- Socket.IO real-time features
- Database & Prisma schema
- Background jobs
- Frontend UI updates
- Security adjustments
- Configuration & env
- Testing & verification
- Old vs New replacement examples
- Quick checklists
- Workflow steps
- Workflow steps

---

## Backend API Routes

- Location: [packages/api/src/routes/auth.js](../../packages/api/src/routes/auth.js)
- Mounted under: `/api/auth` from [packages/api/src/server.js](../../packages/api/src/server.js)

### Add a new endpoint

1. Implement route in `packages/api/src/routes/auth.js`.
2. Apply `authLimiter` or `apiLimiter` as appropriate.
3. Validate input; use Prisma for data access.
4. Return JSON responses; avoid leaking internal errors.

Example:

```js
// packages/api/src/routes/auth.js
const { authLimiter } = require('../middleware/rateLimiter');
const { prisma } = require('../lib/prisma');

router.post('/profile', authLimiter, async (req, res) => {
  try {
    const userId = req.body?.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, accountType: user.accountType } });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});
```

### Modify an existing endpoint

- Keep behavior stable; update validation or Prisma queries as needed.
- Re-run manual tests with curl or Postman and check logs.

---

## Server Middleware & Config

- Location: [packages/api/src/server.js](../../packages/api/src/server.js)
- Add global middlewares (Helmet, CORS, parsers) here.
- Mount routers and handle errors centrally.

Example (apply middleware globally):

```js
// packages/api/src/server.js
const csrfProtection = require('./middleware/csrf');
app.use(csrfProtection);
```

---

## Socket.IO Real-time Features

- Location: [packages/socket/src/socket-server.js](../../packages/socket/src/socket-server.js)
- Add listeners/emitters in `io.on('connection', ...)`.
- Test client: [public/client.js](../../public/client.js)

Example (new event):

```js
// packages/socket/src/socket-server.js
io.on('connection', (socket) => {
  socket.on('typing', (roomId) => {
    socket.to(roomId).emit('typing', { userId: socket.id });
  });
});
```

---

## Database & Prisma Schema

- Location: [prisma/schema.prisma](../../prisma/schema.prisma) (root level)
- Client: [packages/api/src/lib/prisma.ts](../../packages/api/src/lib/prisma.ts)

### Change a model

1. Edit `schema.prisma` (add fields/enums/relations).
2. Generate & migrate:

```bash
npm run prisma:generate
npm run prisma:migrate
```

1. Update queries in route handlers/services.

Example (add field):

```prisma
model User {
  id           String @id @default(uuid())
  accountType  AccountType
  displayName  String? // new optional field
}
```

---

## Background Jobs

- Location: [packages/api/src/services/backgroundJobs.js](../../packages/api/src/services/backgroundJobs.js)
- Start jobs from: [packages/api/src/server.js](../../packages/api/src/server.js)

Example (new job):

```js
// packages/api/src/services/backgroundJobs.js
export async function recalcStats() {
  try {
    const count = await prisma.user.count();
    logger.info(`Total users: ${count}`);
  } catch (e) {
    logger.error('Error recalculating stats', e);
  }
}

export function startBackgroundJobs() {
  // ...existing intervals
  setInterval(recalcStats, 10 * 60 * 1000);
}
```

---

## Frontend UI Updates

- Main UI: [packages/web/src/components/chat/Block.tsx](../../packages/web/src/components/chat/Block.tsx)
- Entry: [packages/web/src/pages/index.tsx](../../packages/web/src/pages/index.tsx) or [packages/web/src/app/page.tsx](../../packages/web/src/app/page.tsx)
  - Prefer one router (App or Pages). Remove duplicates to avoid confusion.

### Add a new feature

- Extend internal state and handlers in `Block.tsx`.
- Reuse UI components under [packages/web/src/components/ui](../../packages/web/src/components/ui).

Example:

```tsx
// packages/web/src/components/chat/Block.tsx
const [showMarketplace, setShowMarketplace] = useState(false);
// toggle and render a new section accordingly
```

---

## Security Adjustments

- CSRF: [packages/api/src/middleware/csrf.js](../../packages/api/src/middleware/csrf.js)
- Rate limiting: [packages/api/src/middleware/rateLimiter.js](../../packages/api/src/middleware/rateLimiter.js)
- JWT: [packages/api/src/lib/jwt.ts](../../packages/api/src/lib/jwt.ts)
- Encryption (AES-256-GCM): [packages/api/src/lib/crypto.js](../../packages/api/src/lib/crypto.js)

Example (apply rate limiting per route):

```js
// packages/api/src/routes/auth.js
const { apiLimiter } = require('../middleware/rateLimiter');
router.post('/profile', apiLimiter, async (req, res) => { /* ... */ });
```

---

## Configuration & Env

- Scripts: [package.json](../../package.json)
- Path aliases: [tsconfig.json](../../tsconfig.json), [jsconfig.json](../../jsconfig.json)
- Env vars: see README section and `.env` file.

### Add a new script

```json
{
  "scripts": {
    "dev:debug": "nodemon --inspect server/server.js"
  }
}
```

---

## Testing & Verification

- Health check: `GET /health` on the API server.
- Auth flow: test `/api/auth/signin`, `/refresh`, `/logout`.
- Socket: send/receive events with the client.
- Prisma: run migrations and validate CRUD operations.

Commands:

```bash
# Start all servers
npm run dev              # All services

# Or start individually
npm run dev:api          # API (packages/api)
npm run dev:socket       # WebSocket (packages/socket)
npm run dev:web          # Frontend (packages/web)

# Prisma
npm run prisma:generate
npm run prisma:migrate
```

---

## Old vs New Replacement Examples

Use these patterns to replace legacy snippets with shared utilities and standard middleware.

### Replace inline phone encryption with shared helper

- Where: [packages/api/src/routes/auth.js](../../packages/api/src/routes/auth.js)

Old:

```js
const crypto = require('crypto');
// ...
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()]);
```

New:

```js
const { encryptPhone } = require('../lib/crypto');
// ...
const encryptedPhone = encryptPhone(phoneNumber);
```

### Replace manual JWT signing with shared helper

- Where: [packages/api/src/routes/auth.js](../../packages/api/src/routes/auth.js)

Old:

```js
const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
```

New:

```js
const { signAccess } = require('../lib/jwt');
const accessToken = signAccess({ userId });
```

### Apply standard rate limiting

- Where: [packages/api/src/routes/auth.js](../../packages/api/src/routes/auth.js)

Old:

```js
// no rate limit applied
router.post('/signin', async (req, res) => { /* ... */ });
```

New:

```js
const { authLimiter } = require('../middleware/rateLimiter');
router.post('/signin', authLimiter, async (req, res) => { /* ... */ });
```

### Use shared Prisma client instead of ad-hoc instantiation

- Where: any API server file

Old:

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
```

New:

```js
// In packages/api/src/
const { prisma } = require('./lib/prisma');
```

---

## Quick Checklists

### When adding an API feature

- [ ] Route in `packages/api/src/routes/auth.js`
- [ ] Input validation & rate limiter
- [ ] Prisma queries
- [ ] Response shape documented

### When changing data models

- [ ] Update `prisma/schema.prisma`
- [ ] Generate & migrate: `npm run prisma:generate && npm run prisma:migrate`
- [ ] Update queries/usages in `packages/api/src/`

### When adding background work

- [ ] Job function in `packages/api/src/services/backgroundJobs.js`
- [ ] Register in `startBackgroundJobs()`

### When updating frontend

- [ ] State + handlers in `packages/web/src/components/chat/Block.tsx`
- [ ] UI under `packages/web/src/components/ui`

---

## Workflow Steps (Overview)

For detailed workflow guidance, see the companion doc: [UPDATE_WORKFLOW.md](./UPDATE_WORKFLOW.md).

1) Clarify scope and affected areas (API, sockets, UI, DB, jobs, security).
2) Plan placement using this playbook.
3) Implement with shared helpers (crypto, JWT, Prisma, rate limiting).
4) Validate with the standard commands.
5) Document changes (README and docs as needed).
6) Commit on a branch and open a PR.

---

For deeper details, see:

- [docs/COMPLETE_CODEBASE.md](../COMPLETE_CODEBASE.md)
- [README.md](../../README.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [LICENSE](../../LICENSE)

The-Chatroom/
├── packages/
│   ├── api/          # Backend REST API (Express + Prisma + PostgreSQL)
│   ├── socket/       # WebSocket server (Socket.IO)
│   ├── web/          # Frontend (Next.js 14 + React 18 + TypeScript)
│   └── shared/       # Shared types, schemas, and utilities
├── prisma/           # Database schema and migrations
├── docs/             # Documentation
├── public/           # Static assets & client scripts
├── package.json      # Workspace configuration
├── tsconfig.json     # TypeScript config (root and per-package)
├── .gitignore
└── README.md
