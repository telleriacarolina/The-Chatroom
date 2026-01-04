# GitHub Copilot Instructions for The Chatroom

## Quick Start for Contributors

When working on this codebase:
1. **Three servers required:** API (port 3001), Socket.IO (port 3002), Next.js (port 3000)
2. **Mixed TypeScript/JavaScript:** Respect existing file types, use TypeScript for new features
3. **Path aliases:** Use `@/*` imports, not relative paths across directories
4. **Security:** Never commit secrets, always validate user inputs
5. **Database changes:** Edit schema → migrate → generate → update code

## Project Overview

The Chatroom is a real-time chat application with multi-tier authentication, language-specific lounges, user marketplace, moderation, and verification system. Built with Node.js, Express, Socket.IO, Next.js, and PostgreSQL.

## Technology Stack

- **Backend:** Node.js 18+, Express.js, Socket.IO
- **Frontend:** Next.js 14, React 18, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (access & refresh tokens), bcryptjs, CSRF protection
- **Real-time:** Socket.IO for WebSocket connections
- **SMS (Optional):** Twilio for phone verification
- **UI:** Tailwind CSS, shadcn/ui components, Lucide icons
- **Security:** Helmet, express-rate-limit, AES-256-GCM encryption


## Architecture & Project Structure

**📦 Combined Approach:** This project uses a hybrid structure with development at the root level and optional packages for distribution.

```
The-Chatroom/
├── api/                # Primary API implementation (root level)
│   ├── server.js      # Express API server (port 3001)
│   ├── routes/        # API routes (auth.js, lounges.js)
│   ├── middleware/    # Express middleware (rateLimiter.js)
│   ├── services/      # Background jobs and services
│   └── utils/         # Logger, security helpers
│
├── socket/            # Primary WebSocket implementation (root level)
│   └── socket-server.js # Socket.IO server (port 3002)
│
├── web/               # Primary Next.js frontend (root level)
│   ├── app/           # Next.js App Router
│   ├── components/    # React UI components
│   │   └── chat/      # Chat-related components
│   ├── lib/           # Frontend utilities
│   └── package.json   # Web dependencies
│
├── packages/          # Package workspace (for distribution)
│   ├── api/           # API package exports
│   │   ├── src/       # API source (server.js, routes/, lib/, etc.)
│   │   └── prisma/    # Database schema (schema.prisma)
│   ├── socket/        # Socket.IO package
│   ├── web/           # Web package
│   └── shared/        # Shared types and utilities
│
├── public/            # Static assets
└── docs/              # Documentation
```

**Important:** Development happens primarily at root level (`api/`, `socket/`, `web/`), while `packages/` mirrors this structure for npm workspace compatibility.

## Development Setup

### Environment Variables

Required environment variables (see `.env.example`):

### Running the Application

Three separate processes are required for development:

```bash
# Terminal 1: API server (Express) - root/api
npm run dev:api

# Terminal 2: Socket.IO server - root/socket
npm run dev:socket

# Terminal 3: Next.js frontend - root/web
npm run dev:web

# Or run all services at once:
npm run dev
```

### Database Setup

```bash
npm run prisma:migrate    # Run migrations
npm run prisma:generate   # Generate Prisma client
```

## Code Style & Conventions

### TypeScript Configuration

  - Use TypeScript (`.ts`, `.tsx`) for new components and features when possible
  - Respect existing file types when modifying existing code
  - Backend code (routes, middleware, services) is primarily JavaScript
  - Frontend components use both TypeScript and JavaScript

### Coding Standards

1. **Follow Conventional Commits:**
   - `feat: add lounge filter`
   - `fix: correct refresh token expiry`
   - `docs: update README links`
   - `refactor: move server files`

2. **Code formatting:**
   - Use Prettier and ESLint (if configured)
   - Keep TypeScript `strict: false` as configured
   - Respect existing code style in files you modify

3. **Imports:**
   - **API package:** Use relative imports (`./routes/`, `./lib/`, `./utils/`)
   - **Web package:** Use path aliases (`@/components/*`, `@/lib/*`, `@/utils/*`) from `packages/web/src`
   - **Shared package:** Import from `@chatroom/shared` in other packages
   - Prefer relative imports for files within the same package

4. **Naming conventions:**
   - Use camelCase for variables and functions
   - Use PascalCase for React components and classes
   - Use UPPER_CASE for constants and environment variables

### React Component Patterns

- Use functional components with hooks (useState, useEffect, useContext)
- Extract reusable logic into custom hooks
- Keep components focused and single-responsibility
- Use TypeScript interfaces for component props when possible

**Example component structure:**
```tsx
// web/components/chat/MessageList.tsx
import { useState, useEffect } from 'react';

interface MessageListProps {
  loungeId: string;
  userId: string;
}

export default function MessageList({ loungeId, userId }: MessageListProps) {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // Fetch messages
  }, [loungeId]);
  
  return <div>{/* Render messages */}</div>;
}
```

### Next.js Routing

- Uses both App Router (`app/`) and Pages Router (`pages/`) - **App Router preferred for new pages**
- Client-side navigation with `next/link` and `next/navigation`
- API routes in `pages/api/` (legacy) - **prefer dedicated API server at port 3001**
- Dynamic routes: `[id].tsx` for parameters
- Layout components for shared UI structure

### Database & Prisma

**Workflow for schema changes:**
1. Edit `packages/api/prisma/schema.prisma`
2. Run `npm run prisma:migrate` - creates and applies migration
3. Run `npm run prisma:generate` - updates Prisma Client types
4. Update application code to use new schema

**Common Prisma patterns:**
```javascript
// Import Prisma client
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Query examples
const user = await prisma.user.findUnique({ where: { id: userId } });
const users = await prisma.user.findMany({ where: { accountStatus: 'ACTIVE' } });
const newUser = await prisma.user.create({ data: { /* fields */ } });
```

Key models: User, Session, TempSession, IDVerification, Lounge, LanguageRoom, ChatMessage, MarketplaceItem, Transaction, ModerationAction, UserReport, AuditLog

## Security Practices

### Authentication & Authorization

- **JWT tokens:** Access token (15min), Refresh token (30 days)
- **Token storage:** Refresh tokens in httpOnly cookies, access tokens in memory/localStorage
- **Password hashing:** bcryptjs with 10+ salt rounds
- **Phone encryption:** AES-256-GCM for storing phone numbers
- **Session management:** Database-backed sessions with expiry tracking

**Authentication middleware pattern:**
```javascript
// api/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Security Headers

- **Helmet:** Enabled on API server for security headers
- **CORS:** Configured with specific origins, credentials enabled
- **CSRF Protection:** Double-submit cookie pattern (token in header + cookie)
- Validate CSRF token on state-changing operations

### Input Validation

- **Validate all user inputs** on both client and server
- **Sanitize data** before database operations
- **Use Prisma's type safety** to prevent SQL injection
- **Validate file uploads** for type, size, and content
- **Rate limiting** on all public endpoints (especially auth)

**Validation example:**
```javascript
// Validate phone number format
const isValidPhone = (phone) => /^\+?[1-9]\d{1,14}$/.test(phone);

router.post('/signup', async (req, res) => {
  const { phoneNumber, password } = req.body;
  
  if (!phoneNumber || !isValidPhone(phoneNumber)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }
  
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password too short' });
  }
  
  // Proceed with signup
});
```

### Secrets Management

- **Never commit secrets** to version control
- Store secrets in `.env` files (gitignored)
- Use `.env.example` for documentation only (no real values)
- Required secrets: `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `PHONE_ENC_KEY`, `DATABASE_URL`
- Optional secrets: Twilio credentials, AWS credentials (for S3 uploads)


## Common Patterns

### API Routes


Example:
```javascript
// api/routes/auth.js (root level)
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

router.get('/endpoint', authenticate, async (req, res) => {
  // Handle request
  res.json({ data: 'response' });
});
```

### Socket.IO Events

**Server-side (socket/socket-server.js):**
```javascript
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join a lounge
  socket.on('join-lounge', (loungeId) => {
    socket.join(`lounge-${loungeId}`);
    socket.to(`lounge-${loungeId}`).emit('user-joined', { userId: socket.userId });
  });
  
  // Send message
  socket.on('chat-message', (data) => {
    io.to(`lounge-${data.loungeId}`).emit('new-message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
```

**Client-side (web frontend):**
```typescript
import { io, Socket } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002');

socket.on('connect', () => {
  console.log('Connected to Socket.IO');
});

socket.emit('join-lounge', loungeId);

socket.on('new-message', (message) => {
  // Handle incoming message
});
```

### React Components

- **File organization:** Group by feature (`chat/`, `auth/`, `ui/`)
- **Naming:** PascalCase for components, camelCase for utilities
- **Styling:** Tailwind CSS classes, avoid inline styles unless dynamic
- **State management:** React Context for global state, local state with useState
- **Side effects:** useEffect for data fetching, subscriptions

### Error Handling

**Backend error handling:**
```javascript
// api/server.js - Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({ 
    error: 'Internal server error',
    ...(isDev && { details: err.message })
  });
});

// Route-level error handling
router.get('/endpoint', async (req, res) => {
  try {
    // Handle request
  } catch (error) {
    logger.error('Endpoint error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});
```

**Frontend error handling:**
```typescript
// Use error boundaries for component errors
// Use try-catch for async operations
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) throw new Error('Request failed');
  const data = await response.json();
} catch (error) {
  console.error('API error:', error);
  setError('Failed to load data');
}
```


## Testing Approach

**Current testing setup:**
- Manual testing by running all three servers simultaneously
- Health check endpoint at `/health` on API server
- Socket.IO connection testing from browser console

**Testing workflow:**
1. Start API server: `npm run dev:api` (port 3001)
2. Start Socket.IO server: `npm run dev:socket` (port 3002)
3. Start Next.js frontend: `npm run dev:web` (port 3000)
4. Test API: `curl http://localhost:3001/health`
5. Test Socket.IO from browser console:
   ```javascript
   const s = io('http://localhost:3002', { transports: ['websocket'] });
   s.on('connect', () => console.log('connected:', s.id));
   ```

**Future testing considerations:**
- Add Jest for unit tests (API logic, utilities)
- Add React Testing Library for component tests
- Add integration tests for API endpoints
- Add E2E tests with Playwright for critical user flows

## Common Tasks

### Adding a New API Endpoint

1. Create route handler in `api/routes/` directory (root level)
2. Add middleware if needed (auth, CSRF, rate limiting)
3. Update Prisma schema if database changes needed (in `packages/api/prisma/schema.prisma`)
4. Run migrations: `npm run prisma:migrate`
5. Test with all three servers running: `npm run dev`

### Adding a New React Component

1. Create component in appropriate directory (`web/components/chat/`, `web/components/ui/`)
2. Use TypeScript if possible (`.tsx`)
3. Import from path alias: `import Component from '@/components/...'`
4. Follow existing patterns in similar components

### Modifying Database Schema

1. Edit `packages/api/prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create and apply migration
3. Run `npm run prisma:generate` to update Prisma client
4. Update affected code to handle schema changes

### Adding New Dependencies

1. Use `npm install <package>` for production dependencies
2. Use `npm install -D <package>` for dev dependencies
3. Update documentation if the dependency changes workflow
4. Test that all servers still work after installation
5. **Optional dependencies:** Some features (AWS S3, face recognition, OCR) use optional dependencies
   - These are in `optionalDependencies` in `package.json`
   - The app works without them; they enable advanced features
   - Install individually if needed: `npm install <package>`

## Troubleshooting

### Common Issues

**Database connection errors:**
- Verify PostgreSQL is running: `pg_isready` or check service status
- Check `DATABASE_URL` in `.env` files
- Ensure database exists: `createdb chatroom`
- Run migrations: `npm run prisma:migrate`

**Prisma client errors:**
- Regenerate Prisma Client: `npm run prisma:generate`
- Check schema syntax in `packages/api/prisma/schema.prisma`
- Clear Prisma cache: `rm -rf node_modules/.prisma`

**Port conflicts:**
- Check if ports are in use: `lsof -i :3001`, `lsof -i :3002`, `lsof -i :3000`
- Change ports in `.env` files: `PORT`, `SOCKET_PORT`
- Kill conflicting processes or use different ports

**JWT/Authentication errors:**
- Verify secrets are set: `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`
- Check token expiry settings
- Clear cookies and localStorage for fresh start

**Missing environment variables:**
- Copy `.env.example` to `.env` in root directory
- Set required variables: `DATABASE_URL`, JWT secrets, `PHONE_ENC_KEY`
- Restart servers after changing environment variables

**Next.js build issues:**
- Clear build cache: `rm -rf web/.next`
- Check for TypeScript errors: `cd web && npx tsc --noEmit`
- Verify dependencies are installed: `npm install`

**Socket.IO connection issues:**
- Check CORS configuration in `socket/socket-server.js`
- Verify `FRONTEND_URL` and `NEXT_PUBLIC_SOCKET_URL` are correct
- Check browser console for connection errors
- Ensure Socket.IO server is running on correct port

### Debugging

**Enable debug logging:**
```bash
# API server
DEBUG=express:* npm run dev:api

# View logs
tail -f logs/app.log
```

**Debug API requests:**
```bash
# Test endpoints with curl
curl -X POST http://localhost:3001/api/auth/csrf
curl -X POST http://localhost:3001/api/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"ageCategory": "PLUS_18"}'
```

**Debug database queries:**
```javascript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

**Debug Socket.IO:**
```javascript
// Enable Socket.IO debug logging in browser
localStorage.debug = 'socket.io-client:*';
```


## Documentation

**Key documentation files:**
- `README.md` - Project overview, setup, and getting started
- `ARCHITECTURE.md` - Combined architecture approach (root + packages)
- `CONTRIBUTING.md` - Contribution guidelines and workflows
- `docs/COMPLETE_CODEBASE.md` - Full codebase reference
- `docs/update-scenarios/README.md` - Where to place changes
- `docs/update-scenarios/UPDATE_WORKFLOW.md` - Step-by-step process
- `.env.example` - Environment variable documentation

**When to update documentation:**
- New features that change user-facing behavior
- API endpoint additions or changes
- Database schema modifications
- New environment variables required
- Significant architectural changes
- New setup or deployment procedures


## Important Notes

1. **Three servers:** Always remember this app requires three separate processes (API, Socket.IO, Next.js)
2. **Mixed codebase:** Both TypeScript and JavaScript - respect existing file types
3. **Path aliases:** Always use `@/*` imports in web package, relative imports in API/socket packages
4. **Prisma workflow:** Schema change → migrate → generate → update code
5. **Security first:** Never commit secrets, always validate inputs
6. **Minimal changes:** Keep PRs focused and avoid unnecessary refactoring
7. **Documentation:** Update relevant docs when making significant changes
8. **Environment setup:** Copy `.env.example` to `.env` before starting development
9. **Server startup order:** Start API server first, then Socket.IO, then Next.js frontend
10. **Monorepo structure:** Project uses combined approach - develop in root folders, packages/ for distribution
11. **Node version:** Use Node 18.x (see `.nvmrc`), newer versions may have dependency issues
12. **Optional dependencies:** Some features (AWS S3, face recognition, OCR) are optional

## Getting Help

- Review documentation in `docs/` directory
- Check existing code patterns before implementing new features
- Test changes with all three servers running
- Use health check endpoints to verify services are running
- Review Prisma schema for database structure understanding
- Check commit history for examples of similar changes

