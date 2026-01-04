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
- **UI:** Tailwind CSS, shadcn/ui components, Lucide icons
- **SMS:** Twilio (optional)
- **Storage:** AWS S3 (optional, for file uploads)
- **Utilities:** express-rate-limit, helmet, cookie-parser


## Architecture & Project Structure

**📦 Monorepo Structure:** This project uses npm workspaces with separate packages for API, Socket.IO, frontend, and shared code.

```
The-Chatroom/
├── packages/
│   ├── api/             # Backend REST API
│   │   └── src/
│   │       ├── server.js        # Express API server (port 3001)
│   │       ├── routes/          # API routes (auth, etc.)
│   │       ├── lib/             # Core libraries (JWT, crypto, Prisma, Twilio)
│   │       ├── middleware/      # Express middleware (CSRF, rate limiting)
│   │       ├── services/        # Background jobs and services
│   │       └── utils/           # Logger, security helpers
│   ├── socket/          # WebSocket server
│   │   └── src/
│   │       └── socket-server.js # Socket.IO server (port 3002)
│   ├── web/             # Next.js frontend
│   │   └── src/
│   │       ├── app/             # Next.js App Router
│   │       ├── pages/           # Next.js Pages Router (legacy)
│   │       ├── components/      # React UI components
│   │       │   ├── chat/       # Chat-related components
│   │       │   ├── auth/       # Authentication components
│   │       │   └── ui/         # shadcn/ui components
│   │       ├── lib/             # Frontend utilities
│   │       └── styles/          # Global CSS and Tailwind styles
│   └── shared/          # Shared types and utilities
│       └── src/
│           ├── types/           # TypeScript type definitions
│           ├── schemas/         # JSON schemas
│           └── utils/           # Shared utilities
├── prisma/              # Database schema and migrations
│   └── schema.prisma   # Prisma schema definition
├── public/              # Static assets & client scripts
└── docs/                # Documentation
```

## Development Setup

### Environment Variables

Required environment variables (see `.env.example`):

### Running the Application

Three separate processes are required for development:

```bash
# Terminal 1: API server (Express) - packages/api
npm run dev:api

# Terminal 2: Socket.IO server - packages/socket
npm run dev:socket

# Terminal 3: Next.js frontend - packages/web
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

- Use functional components with hooks (`useState`, `useEffect`, `useContext`)
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use TypeScript for type safety in new components
- Follow existing component structure in `packages/web/src/components/`

Example:
```tsx
// packages/web/src/components/chat/MessageList.tsx
import { useState, useEffect } from 'react';
import type { Message } from '@chatroom/shared';

export function MessageList() {
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Component logic...
  
  return (
    <div className="message-list">
      {/* JSX */}
    </div>
  );
}
```

### Next.js Routing

- **App Router** (primary): Use for new pages in `packages/web/src/app/`
- **Pages Router** (legacy): Existing pages in `packages/web/src/pages/`
- Dynamic routes: Use `[param]` folders in app directory
- API routes: Place in `packages/api/src/routes/` (not Next.js API routes)
- Server components by default, use `"use client"` when needed

### Database & Prisma

- **Schema location:** `packages/api/prisma/schema.prisma`
- **Workflow:** Edit schema → `npm run prisma:migrate` → `npm run prisma:generate`
- **Client usage:** Import from `@prisma/client`
- **Transactions:** Use Prisma transactions for complex operations
- **Migrations:** Always create migrations, never use `prisma db push` in production

Key models:
- **User** - Account information, profile, tier (guest/viewer/creator)
- **Session** - Refresh token sessions with expiry tracking
- **TempSession** - Guest sessions with temporary usernames
- **IDVerification** - Age and identity verification records
- **Lounge** - Chat rooms organized by language/country
- **LanguageRoom** - Language-specific room configurations
- **ChatMessage** - Messages with moderation metadata
- **MarketplaceItem** - User-generated content for sale
- **Transaction** - Payment transactions and status tracking
- **ModerationAction** - Audit log for moderation events
- **UserReport** - User reporting system

## Security Practices

### Authentication & Authorization

- **JWT tokens:** Access tokens (15 min expiry), refresh tokens (30 days)
- **Token storage:** `httpOnly` cookies for refresh tokens, memory/localStorage for access tokens
- **Password hashing:** Use bcrypt with salt rounds (configured in environment)
- **Phone encryption:** AES-256-GCM encryption for phone numbers with `PHONE_ENC_KEY`
- **Middleware:** Use `authenticate` middleware from `packages/api/src/middleware/auth.js`
- **Guest sessions:** Temporary sessions with age verification for 18+ content

Example:
```javascript
// Protected route
router.get('/profile', authenticate, async (req, res) => {
  // req.user contains authenticated user info
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json(user);
});
```

### Security Headers

- **Helmet:** Enabled on API server for security headers
- **CORS:** Configured to allow frontend origin only
- **CSRF protection:** Double-submit pattern (cookie + header validation)
- **Content Security Policy:** Configure in `packages/api/src/server.js`

### Input Validation

- **Always validate:** Validate all user inputs on the backend
- **Sanitize data:** Sanitize before database operations
- **Phone numbers:** Validate format before encryption
- **Rate limiting:** Applied to auth routes, API endpoints, and heartbeats

### Secrets Management

- **Never commit secrets:** Use `.env` files (gitignored)
- **Environment variables:** Required secrets in `.env.example`
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
// packages/api/src/routes/auth.js
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

- **Connection handling:** Authenticate connections before allowing events
- **Event naming:** Use clear, descriptive event names (e.g., 'chat:message', 'user:typing')
- **Room management:** Use Socket.IO rooms for language/country-specific lounges
- **Error handling:** Emit error events back to client on failures
- **Broadcasting:** Use `socket.to(room).emit()` for room-specific messages

Example:
```javascript
// packages/socket/src/socket-server.js
io.on('connection', (socket) => {
  socket.on('join:lounge', (loungeId) => {
    socket.join(loungeId);
    io.to(loungeId).emit('user:joined', { userId: socket.userId });
  });
  
  socket.on('chat:message', (data) => {
    io.to(data.loungeId).emit('chat:message', data);
  });
});
```

### React Components

- **Component structure:** One component per file, named export preferred
- **Props typing:** Use TypeScript interfaces for component props
- **State management:** Use React hooks, Context API for shared state
- **Side effects:** Use `useEffect` with proper dependencies
- **Event handlers:** Prefix with `handle` (e.g., `handleSubmit`, `handleClick`)

Example:
```tsx
// packages/web/src/components/chat/ChatInput.tsx
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
      />
      <button type="submit">Send</button>
    </form>
  );
}
```

### Error Handling

- **API errors:** Return appropriate HTTP status codes (400, 401, 403, 404, 500)
- **Client errors:** Display user-friendly error messages
- **Logging:** Use the logger utility from `packages/api/src/utils/logger.js`
- **Async errors:** Always use try-catch blocks in async functions
- **Database errors:** Handle Prisma errors specifically (unique constraints, not found, etc.)

## Testing Approach

- **Manual testing:** Run all three servers and test features interactively
- **Health checks:** Use `/health` endpoint on API server
- **Socket testing:** Test Socket.IO connection from browser console
- **No automated tests yet:** Focus on manual verification during development
- **Test all servers together:** Always test with all three services running:
  1. API server: `npm run dev:api` (port 3001)
  2. Socket.IO server: `npm run dev:socket` (port 3002)
  3. Next.js frontend: `npm run dev:web` (port 3000)

### Manual Testing Examples

**API Health Check:**
```bash
curl -s http://localhost:3001/health
```

**Socket.IO Connection Test (Browser Console):**
```javascript
const socket = io('http://localhost:3002', { transports: ['websocket'] });
socket.on('connect', () => console.log('Connected:', socket.id));
socket.on('chat:message', (msg) => console.log('Message:', msg));
socket.emit('chat:message', { text: 'Hello from browser' });
```

## Common Tasks

### Adding a New API Endpoint

1. Create route handler in `packages/api/src/routes/` directory
2. Add middleware if needed (auth, CSRF, rate limiting)
3. Update Prisma schema if database changes needed
4. Run migrations: `npm run prisma:migrate`
5. Test with all three servers running: `npm run dev`

### Adding a New React Component

1. Create component in appropriate directory (`packages/web/src/components/chat/`, `components/auth/`, `components/ui/`)
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

1. **Port already in use:**
   - Solution: Change `PORT` or `SOCKET_PORT` in `.env`, or stop conflicting processes
   - Check running processes: `lsof -i :3001` or `lsof -i :3002`

2. **Database connection errors:**
   - Verify PostgreSQL is running
   - Check `DATABASE_URL` in `.env`
   - Run `npm run prisma:generate` and `npm run prisma:migrate`

3. **Prisma client errors:**
   - Run `npm run prisma:generate` to regenerate client
   - Delete `node_modules/.prisma` and regenerate
   - Ensure migrations are up to date

4. **JWT/Crypto errors:**
   - Verify `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, and `PHONE_ENC_KEY` are set
   - Keys should be at least 32 characters long
   - Use the provided `.env.example` as a template

5. **Next.js build issues:**
   - Clear `.next/` directory: `rm -rf packages/web/.next`
   - Clear root `.next/` if it exists: `rm -rf .next`
   - Rebuild: `npm run dev:web`

6. **Socket.IO connection failures:**
   - Verify Socket.IO server is running on port 3002
   - Check CORS configuration in socket server
   - Verify `FRONTEND_URL` environment variable

7. **Module not found errors:**
   - Run `npm install` at root level
   - Check path aliases in `tsconfig.json` (web package)
   - Ensure imports use correct paths (`@/*` for web, relative for api)

### Debugging

- **API debugging:** Use `console.log` or Node.js debugger (`--inspect` flag)
- **Frontend debugging:** React DevTools browser extension
- **Socket debugging:** Use Socket.IO client debugging with `socket.on('connect_error', ...)`
- **Database queries:** Enable Prisma query logging with `log: ['query']` in Prisma Client
- **Network issues:** Check browser Network tab and CORS configuration

## Documentation

- **[README.md](../README.md)** - Project overview, setup instructions, and features
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Combined architecture approach and folder structure
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines and workflow
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - Deployment instructions and configurations
- **[docs/COMPLETE_CODEBASE.md](../docs/COMPLETE_CODEBASE.md)** - Full codebase reference and API documentation
- **[docs/update-scenarios/](../docs/update-scenarios/)** - Where to place changes and patterns
- **[docs/update-scenarios/UPDATE_WORKFLOW.md](../docs/update-scenarios/UPDATE_WORKFLOW.md)** - Step-by-step update process
- **Prisma Schema:** `packages/api/prisma/schema.prisma` - Database models and relationships

## Important Notes

1. **Monorepo structure:** Project uses npm workspaces with packages in `packages/` directory
2. **Three servers required:** Always remember this app requires three separate processes (API, Socket.IO, Next.js)
3. **Mixed codebase:** Both TypeScript and JavaScript - respect existing file types when modifying code
4. **Package imports:**
   - API: Use relative imports (`./lib/`, `./routes/`, `./utils/`)
   - Web: Use path aliases (`@/components/`, `@/lib/`, `@/utils/`) from `packages/web/src`
   - Shared: Import as `@chatroom/shared` from other packages
5. **Prisma workflow:** Schema change → migrate (`npm run prisma:migrate`) → generate (`npm run prisma:generate`) → update code
6. **Security first:** Never commit secrets, always validate inputs, use environment variables
7. **Minimal changes:** Keep PRs focused and avoid unnecessary refactoring
8. **Documentation:** Update relevant docs when making significant changes
9. **Environment setup:** Copy `.env.example` to `.env` before starting development
10. **Server startup order:** Start API server first, then Socket.IO, then Next.js frontend
11. **Node version:** Use Node 18.x (specified in `.nvmrc`), newer versions may have compatibility issues

## Getting Help

- **Issues:** Open an issue on GitHub with detailed description and error logs
- **Discussions:** Use GitHub Discussions for questions and general help
- **Documentation:** Check the docs/ folder for detailed guides
- **Code examples:** Look at existing code for patterns and conventions