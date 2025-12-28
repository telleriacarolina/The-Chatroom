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
- Quick checklists

---

## Backend API Routes

- Location: [routes/auth.js](../routes/auth.js)
- Mounted under: `/api/auth` from [server/server.js](../server/server.js)

### Add a new endpoint
1. Implement route in `routes/auth.js`.
2. Apply `authLimiter` or `apiLimiter` as appropriate.
3. Validate input; use Prisma for data access.
4. Return JSON responses; avoid leaking internal errors.

Example:
```js
// routes/auth.js
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

- Location: [server/server.js](../server/server.js)
- Add global middlewares (Helmet, CORS, parsers) here.
- Mount routers and handle errors centrally.

Example (apply middleware globally):
```js
// server/server.js
const csrfProtection = require('../middleware/csrf');
app.use(csrfProtection);
```

---

## Socket.IO Real-time Features

- Location: [server/socket-server.js](../server/socket-server.js)
- Add listeners/emitters in `io.on('connection', ...)`.
- Test client: [public/client.js](../public/client.js)

Example (new event):
```js
// server/socket-server.js
io.on('connection', (socket) => {
  socket.on('typing', (roomId) => {
    socket.to(roomId).emit('typing', { userId: socket.id });
  });
});
```

---

## Database & Prisma Schema

- Location: [prisma/schema.prisma](../prisma/schema.prisma)
- Client: [lib/prisma.ts](../lib/prisma.ts)

### Change a model
1. Edit `schema.prisma` (add fields/enums/relations).
2. Generate & migrate:
```bash
npm run prisma:generate
npm run prisma:migrate
```
3. Update queries in route handlers/services.

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

- Location: [services/backgroundJobs.js](../services/backgroundJobs.js)
- Start jobs from: [server/server.js](../server/server.js)

Example (new job):
```js
// services/backgroundJobs.js
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

- Main UI: [components/chat/Block.tsx](../components/chat/Block.tsx)
- Entry: [pages/index.tsx](../pages/index.tsx) or [app/page.tsx](../app/page.tsx)
  - Prefer one router (App or Pages). Remove duplicates to avoid confusion.

### Add a new feature
- Extend internal state and handlers in `Block.tsx`.
- Reuse UI components under [components/ui](../components/ui).

Example:
```tsx
// components/chat/Block.tsx
const [showMarketplace, setShowMarketplace] = useState(false);
// toggle and render a new section accordingly
```

---

## Security Adjustments

- CSRF: [middleware/csrf.js](../middleware/csrf.js)
- Rate limiting: [middleware/rateLimiter.js](../middleware/rateLimiter.js)
- JWT: [lib/jwt.ts](../lib/jwt.ts)
- Encryption (AES-256-GCM): [lib/crypto.js](../lib/crypto.js)

Example (apply rate limiting per route):
```js
// routes/auth.js
const { apiLimiter } = require('../middleware/rateLimiter');
router.post('/profile', apiLimiter, async (req, res) => { /* ... */ });
```

---

## Configuration & Env

- Scripts: [package.json](../package.json)
- Path aliases: [tsconfig.json](../tsconfig.json), [jsconfig.json](../jsconfig.json)
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
# Start servers
npm run dev            # API
npm run socket:dev     # WebSocket
npm run next:dev       # Frontend

# Prisma
npm run prisma:generate
npm run prisma:migrate
```

---

## Old vs New Replacement Examples

Use these patterns to replace legacy snippets with shared utilities and standard middleware.

### Replace inline phone encryption with shared helper

- Where: [routes/auth.js](../routes/auth.js)

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

- Where: [routes/auth.js](../routes/auth.js)

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

- Where: [routes/auth.js](../routes/auth.js)

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

- Where: any server file

Old:
```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
```

New:
```js
const { prisma } = require('../lib/prisma');
```


## Quick Checklists

### When adding an API feature
- [ ] Route in `routes/auth.js`
- [ ] Input validation & rate limiter
- [ ] Prisma queries
- [ ] Response shape documented

### When changing data models
- [ ] Update `schema.prisma`
- [ ] Generate & migrate
- [ ] Update queries/usages

### When adding background work
- [ ] Job function in `services/backgroundJobs.js`
- [ ] Register in `startBackgroundJobs()`

### When updating frontend
- [ ] State + handlers in `Block.tsx`
- [ ] UI under `components/ui`

---

For deeper details, see:
- [docs/COMPLETE_CODEBASE.md](./COMPLETE_CODEBASE.md)
- [README.md](../README.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [LICENSE](../LICENSE)
