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

- **Backend:** Node.js 18+, Express, Socket.IO
- **Frontend:** Next.js 14, React 18, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (access & refresh tokens), bcrypt, CSRF protection
- **Real-time:** Socket.IO for WebSocket connections
- **Optional:** Twilio (SMS), AWS S3 (file uploads)
- **UI:** Tailwind CSS, shadcn/ui, Lucide icons


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
- `DATABASE_URL` - PostgreSQL connection string
- `ACCESS_TOKEN_SECRET` - JWT access token secret (min 32 chars)
- `REFRESH_TOKEN_SECRET` - JWT refresh token secret (min 32 chars)
- `PHONE_ENC_KEY` - 32-byte encryption key for phone numbers
- `PORT` - API server port (default: 3001)
- `SOCKET_PORT` - Socket.IO server port (default: 3002)
- `FRONTEND_URL` - Frontend URL (default: http://localhost:3000)
- `NODE_ENV` - Environment (development/production)

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

- Use functional components with hooks
- Prefer TypeScript for new components (`.tsx`)
- Co-locate related components in feature folders
- Use `'use client'` directive for client-side interactivity
- Export components as default or named exports consistently

### Next.js Routing

- Uses Next.js 14 App Router (`web/app/` directory)
- File-based routing with `page.tsx` for routes
- Use `layout.tsx` for shared layouts
- Server components by default, use `'use client'` when needed

### Database & Prisma

- Schema located at `packages/api/prisma/schema.prisma`
- After schema changes: run `npm run prisma:migrate` then `npm run prisma:generate`
- Use Prisma Client for all database operations
- Handle unique constraint violations and not-found errors explicitly

Key models: User, Session, TempSession, IDVerification, Lounge, LanguageRoom, ChatMessage, MarketplaceItem, Transaction, ModerationAction, UserReport, AuditLog

## Security Practices

### Authentication & Authorization

- JWT-based authentication with access tokens (15min expiry) and refresh tokens (30 days)
- Guest sessions supported via `TempSession` model
- Password hashing with bcrypt (strong salt rounds)
- Phone number encryption using AES-256-GCM
- CSRF protection with double-submit cookie pattern
- Rate limiting on auth endpoints and API routes

### Security Headers

- Helmet middleware enabled on API server
- CORS configured with specific origins
- Secure cookie settings (httpOnly, sameSite, secure in production)
- Content Security Policy headers as needed

### Input Validation

- Validate all user inputs before processing
- Sanitize inputs to prevent XSS attacks
- Use Prisma's type safety for database queries
- Validate phone numbers, passwords, and other sensitive data
- Return appropriate error messages without leaking system details
### Secrets Management

- **Never commit secrets** to version control
- Store secrets in `.env` files (gitignored)
- Use `.env.example` for documentation only (no real values)
- Required secrets: `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `PHONE_ENC_KEY`, `DATABASE_URL`
- Optional secrets: Twilio credentials, AWS credentials (for S3 uploads)
- **Key rotation:** Plan for rotating JWT secrets and encryption keys
- **Database credentials:** Never hardcode, always use environment variables

## Common Patterns

### API Routes

- **Express router pattern:** Use `express.Router()` for route grouping
- **Middleware chain:** auth → validation → handler
- **Error handling:** Use try-catch with proper error responses
- **Response format:** Consistent JSON responses with status codes

Example:
```javascript
// api/routes/auth.js (root level)
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

router.get('/endpoint', authenticate, async (req, res) => {
  try {
    // Handle request
    const data = await someOperation();
    res.json({ data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

### Socket.IO Events

- Server runs on port 3002 (separate from API server)
- Handle connection/disconnection events
- Emit and listen for custom events (chat messages, user presence, etc.)
- Room-based messaging for language lounges
- Error handling for socket connections

### React Components

- Use client-side state management (useState, useContext)
- Implement error boundaries for graceful error handling
- Handle loading and error states in components
- Use useEffect for side effects and cleanup
- Fetch data from API using fetch or axios
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

- **API errors:** Return appropriate HTTP status codes (400, 401, 403, 404, 500)
- **Client errors:** Display user-friendly error messages
- **Logging:** Use the logger utility from `packages/api/src/utils/logger.js`
- **Async errors:** Always use try-catch blocks in async functions
- **Database errors:** Handle Prisma errors specifically (unique constraints, not found, etc.)

## Testing Approach

**Manual testing workflow:**
1. Start API server: `npm run dev:api` (port 3001)
2. Start Socket.IO server: `npm run dev:socket` (port 3002)
3. Start Next.js frontend: `npm run dev:web` (port 3000)
4. Or run all at once: `npm run dev`

**Testing checklist:**
- Verify all three servers start without errors
- Test API endpoints with curl or Postman
- Check Socket.IO connections in browser console
- Test user flows in the frontend
- Verify database operations with Prisma Studio

**No automated test suite currently:** Focus on manual testing and code review

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

**Port conflicts:**
- Check if ports 3000, 3001, 3002 are in use
- Kill conflicting processes or change PORT/SOCKET_PORT in .env

**Database connection errors:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env is correct
- Run `npm run prisma:generate` and `npm run prisma:migrate`

**Missing environment variables:**
- Copy `.env.example` to `.env`
- Set all required secrets (JWT secrets, encryption keys)

**Prisma errors:**
- Run `npm run prisma:generate` after pulling schema changes
- Run `npm run prisma:migrate` to apply new migrations
- Delete and recreate database if migrations are broken

**Build errors:**
- Clear `.next` directory: `rm -rf web/.next`
- Clear node_modules: `npm run clean` then `npm install`
- Check Node.js version (requires 18.x, use `nvm use`)
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

- **API debugging:** Use `console.log` or Node.js debugger (`--inspect` flag)
- **Frontend debugging:** React DevTools browser extension
- **Socket debugging:** Use Socket.IO client debugging with `socket.on('connect_error', ...)`
- **Database queries:** Enable Prisma query logging with `log: ['query']` in Prisma Client
- **Network issues:** Check browser Network tab and CORS configuration

## Documentation

**Key documentation files:**
- **[README.md](../README.md)** - Project overview, setup instructions, and features
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Combined architecture approach and folder structure
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines and workflow
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - Deployment instructions and configurations
- **[docs/COMPLETE_CODEBASE.md](../docs/COMPLETE_CODEBASE.md)** - Full codebase reference and API documentation
- **[docs/update-scenarios/](../docs/update-scenarios/)** - Where to place changes and patterns
- **[docs/update-scenarios/UPDATE_WORKFLOW.md](../docs/update-scenarios/UPDATE_WORKFLOW.md)** - Step-by-step update process
- **`.env.example`** - Environment variable documentation
- **Prisma Schema:** `packages/api/prisma/schema.prisma` - Database models and relationships

**When to update documentation:**
- New features that change user-facing behavior
- API endpoint additions or changes
- Database schema modifications
- New environment variables required
- Significant architectural changes
- New setup or deployment procedures

## Important Notes

1. **Three servers:** Always remember this app requires three separate processes (API on port 3001, Socket.IO on port 3002, Next.js on port 3000)
2. **Mixed codebase:** Both TypeScript and JavaScript - respect existing file types
3. **Path aliases:** Use `@/*` imports for web package, relative imports for API/socket packages
4. **Package imports:**
   - API: Use relative imports (`./lib/`, `./routes/`, `./utils/`)
   - Socket: Use relative imports
   - Web: Use path aliases (`@/components/`, `@/lib/`, `@/utils/`)
   - Shared: Import as `@chatroom/shared` from other packages
5. **Prisma workflow:** Schema change → migrate → generate → update code
6. **Security first:** Never commit secrets, always validate inputs
7. **Minimal changes:** Keep PRs focused and avoid unnecessary refactoring
8. **Documentation:** Update relevant docs when making significant changes
9. **Environment setup:** Copy `.env.example` to `.env` before starting development
10. **Server startup order:** Start API server first, then Socket.IO, then Next.js frontend

## Getting Help

**Resources:**
- **Issues:** Open an issue on GitHub with detailed description and error logs
- **Discussions:** Use GitHub Discussions for questions and general help
- **Documentation:** Check the `docs/` folder for detailed guides
- **Code examples:** Look at existing code for patterns and conventions

**Before asking for help:**
- Review documentation in `docs/` directory
- Check existing code patterns before implementing new features
- Test changes with all three servers running
- Use health check endpoints to verify services are running
- Review Prisma schema for database structure understanding
- Check commit history for examples of similar changes
