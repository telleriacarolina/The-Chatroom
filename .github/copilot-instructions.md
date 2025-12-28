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

- **Backend:** Node.js, Express.js, Socket.IO
- **Frontend:** Next.js 14, React 18, TypeScript/JavaScript (mixed)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (access & refresh tokens), bcrypt
- **Real-time:** Socket.IO for WebSocket messaging
- **UI:** Tailwind CSS, shadcn/ui components, Lucide icons
- **SMS:** Twilio (optional)

## Architecture & Project Structure

```
The-Chatroom/
├── server/              # API and Socket.IO servers
│   ├── server.js        # Express API server (port 3001)
│   └── socket-server.js # Socket.IO server (port 3002)
├── routes/              # Express API routes (auth, etc.)
├── lib/                 # Core libraries (JWT, crypto, Prisma, Twilio)
├── middleware/          # Express middleware (CSRF, rate limiting)
├── services/            # Background jobs and services
├── utils/               # Logger, security helpers
├── components/          # React UI components
│   ├── chat/           # Chat-related components
│   └── auth/           # Authentication components
├── pages/               # Next.js Pages Router (legacy)
├── app/                 # Next.js App Router
├── prisma/              # Database schema and migrations
│   └── schema.prisma   # Prisma schema definition
├── public/              # Static assets & client scripts
├── styles/              # Global CSS and Tailwind styles
└── docs/                # Documentation
```

## Development Setup

### Environment Variables

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `ACCESS_TOKEN_SECRET` - JWT access token secret (min 32 chars)
- `REFRESH_TOKEN_SECRET` - JWT refresh token secret (min 32 chars)
- `PHONE_ENC_KEY` - AES-256-GCM encryption key for phone numbers
- `ENCRYPTION_KEY` - Fallback encryption key
- `PORT` - API server port (default: 3001)
- `SOCKET_PORT` - Socket.IO server port (default: 3002)
- `FRONTEND_URL` - Next.js frontend URL (default: http://localhost:3000)
- `NODE_ENV` - Environment (development/production)
- `TWILIO_*` - Optional Twilio credentials for SMS

### Running the Application

Three separate processes are required for development:

```bash
# Terminal 1: API server (Express)
npm run dev

# Terminal 2: Socket.IO server
npm run socket:dev

# Terminal 3: Next.js frontend
npm run next:dev
```

### Database Setup

```bash
npm run prisma:migrate    # Run migrations
npm run prisma:generate   # Generate Prisma client
```

## Code Style & Conventions

### TypeScript Configuration

- **Mixed codebase:** Both TypeScript (`.ts`, `.tsx`) and JavaScript (`.js`, `.jsx`) files
- **TypeScript strict mode:** Disabled (`strict: false`)
- **Path aliases:** `@/*` maps to project root
- **JSX:** Supported in both `.tsx` and `.jsx` files
- **File type guidance:**
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
   - Use path aliases: `@/components/*`, `@/lib/*`, `@/utils/*`
   - Prefer relative imports for nearby files

4. **Naming conventions:**
   - Use camelCase for variables and functions
   - Use PascalCase for React components and classes
   - Use UPPER_CASE for constants and environment variables

### React Component Patterns

- Prefer functional components with hooks
- Use TypeScript for new components when possible
- Follow existing component structure in `components/chat/` and `components/auth/`
- Import UI components from their respective files (e.g., `@/components/ui/button`)

### Next.js Routing

- **Mixed routing approach:** Both Pages Router (`pages/`) and App Router (`app/`) are present
- **Pages Router:** Primary routing mechanism, includes API routes in `pages/api/`
- **App Router:** Minimal usage, contains basic page structure
- **New routes:** Add to `pages/` directory to maintain consistency
- **API endpoints:** Create in `pages/api/` or `routes/` for Express routes

### Database & Prisma

- **Schema location:** `prisma/schema.prisma`
- **Client import:** Use `import prisma from '@/lib/prisma'`
- **Always regenerate:** Run `npm run prisma:generate` after schema changes
- **Migrations:** Use `npm run prisma:migrate` for schema updates

Key models:
- User (account, profile, verification)
- Session (refresh tokens)
- TempSession (guest sessions)
- Lounge, LanguageRoom (chat rooms)
- ChatMessage (messages with moderation)
- MarketplaceItem, Transaction (marketplace)
- ModerationAction, UserReport (moderation)
- IDVerification (age/ID verification)
- AuditLog (system audit trail)

## Security Practices

### Authentication & Authorization

- **JWT tokens:** Access token (15 min expiry), Refresh token (30 days)
- **Password hashing:** Use bcryptjs with strong salt rounds
- **Phone encryption:** AES-256-GCM for storing phone numbers
- **CSRF protection:** Double-submit pattern (header + cookie)
- **Rate limiting:** Applied on auth, API, and heartbeat endpoints

### Security Headers

- Helmet enabled on API server
- CORS configured for frontend URL only
- Secure cookie settings in production

### Input Validation

- Validate and sanitize all user inputs
- Use Prisma parameterized queries (SQL injection protection)
- Check for XSS vulnerabilities in user-generated content

### Secrets Management

- Never commit secrets to source code
- Use environment variables for all sensitive data
- Reference `.env.example` for required variables

## Common Patterns

### API Routes

- Located in `routes/` directory
- Export Express router objects
- Use middleware: `csrf`, `rateLimiter`, `authenticate`
- Return JSON responses with appropriate status codes

Example:
```javascript
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

router.get('/endpoint', authenticate, async (req, res) => {
  // Handle request
  res.json({ data: 'response' });
});
```

### Socket.IO Events

- Socket server in `server/socket-server.js`
- Emit events for real-time features
- Implement proper error handling and validation

### React Components

- Place in appropriate subdirectory (`components/chat/`, `components/auth/`, `components/ui/`)
- Use TypeScript interfaces for props when possible
- Follow shadcn/ui component patterns for UI elements

### Error Handling

- Use try-catch blocks in async functions
- Log errors with `logger.error()` from `utils/logger.js`
- Return meaningful error messages to clients
- Use appropriate HTTP status codes

## Testing Approach

- **No formal test framework currently configured**
- Manual testing required for new features
- Test all three servers when making changes:
  1. API server (npm run dev)
  2. Socket.IO server (npm run socket:dev)
  3. Next.js frontend (npm run next:dev)
- Verify database changes with Prisma Studio: `npx prisma studio`

## Common Tasks

### Adding a New API Endpoint

1. Create route handler in `routes/` directory
2. Add middleware if needed (auth, CSRF, rate limiting)
3. Update Prisma schema if database changes needed
4. Run migrations: `npm run prisma:migrate`
5. Test with all three servers running

### Adding a New React Component

1. Create component in appropriate directory (`components/chat/`, `components/auth/`, `components/ui/`)
2. Use TypeScript if possible (`.tsx`)
3. Import from path alias: `import Component from '@/components/...'`
4. Follow existing patterns in similar components

### Modifying Database Schema

1. Edit `prisma/schema.prisma`
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

- **Prisma errors:** Ensure `DATABASE_URL` is correct, run `npm run prisma:generate`
- **Port conflicts:** Check if ports 3000, 3001, 3002 are available
- **JWT errors:** Verify all JWT secrets are set in `.env`
- **Database connection:** Ensure PostgreSQL is running
- **Missing dependencies:** Run `npm install`
- **Next.js build issues:** Clear `.next/` directory and rebuild
- **Module not found errors:** Check path aliases in `tsconfig.json` and `jsconfig.json`
- **Socket.IO connection issues:** Verify `SOCKET_PORT` is correct and Socket.IO server is running
- **CSRF token errors:** Ensure CSRF token is obtained from `/api/auth/csrf` before authenticated requests

### Debugging

- API server debug mode: `npm run dev:debug` (enables Node.js inspector)
- Check server logs for error messages
- Use Prisma Studio to inspect database: `npx prisma studio`
- Check browser console for frontend errors

## Documentation

- **Main README:** [README.md](../README.md) - Setup and overview
- **Contributing Guide:** [CONTRIBUTING.md](../CONTRIBUTING.md) - PR guidelines
- **TODO List:** [TODO.md](../TODO.md) - Active tasks and roadmap
- **Complete Codebase:** [docs/COMPLETE_CODEBASE.md](../docs/COMPLETE_CODEBASE.md) - Full reference
- **Update Scenarios:** [docs/update-scenarios/README.md](../docs/update-scenarios/README.md) - Common patterns
- **Commit History:** [docs/Commit.md](../docs/Commit.md) - Development log

## Important Notes

1. **Three servers:** Always remember this app requires three separate processes (API, Socket.IO, Next.js)
2. **Mixed codebase:** Both TypeScript and JavaScript - respect existing file types
3. **Path aliases:** Always use `@/*` imports, not relative paths across directories
4. **Prisma workflow:** Schema change → migrate → generate → update code
5. **Security first:** Never commit secrets, always validate inputs
6. **Minimal changes:** Keep PRs focused and avoid unnecessary refactoring
7. **Documentation:** Update relevant docs when making significant changes
8. **Environment setup:** Copy `.env.example` to `.env` before starting development
9. **Server startup order:** Start API server first, then Socket.IO, then Next.js frontend

## Getting Help

- Check existing documentation in `docs/` directory
- Review similar code in the codebase for patterns
- Consult `README.md` for setup issues
- Check `TODO.md` for context on current work
