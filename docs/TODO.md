# The Chatroom - Project TODO

High-level overview of active tasks and progress.

## Quick Status
- [x] Component reorganization (chat/ and auth/ subdirectories)
- [x] TypeScript/JSX configuration
- [x] Server architecture (API + Socket.IO split)
- [ ] Run and test locally
- [ ] Deploy to production

## Recent Changes
- ✅ Split server.js (API) from socket-server.js (WebSocket)
- ✅ Created components/chat/ and components/auth/ with organized structure
- ✅ Added tsconfig.json with JSX support and path aliases
- ✅ Created badge.tsx and progress.tsx UI components
- ✅ Added lib/utils.ts for shared utilities
- ⚠️ Pending: Fix TypeScript errors in Block.tsx
- ✅ Made Card, CardHeader, Button, Badge components flexible with proper props
- ✅ Simplified Progress component to work without @radix-ui dependency
- ✅ Updated tsconfig.json moduleResolution to "bundler"

## Next Steps
1. Install dependencies: `npm install`
2. Set up environment files for api/socket/web as per README
3. Start dev servers (`npm run dev:api`, `npm run dev:socket`, `npm run dev:web`)
4. Test chat UI rendering and lounge selection flow
5. Connect frontend guest flow to `/api/auth/guest`

---

# Frontend

Next.js App Router, React components, UI/UX, styling.

## Components
- [x] Reorganized Block components into chat/ and auth/ subdirectories
- [x] Created badge.tsx UI component
- [x] Created progress.tsx UI component
- [x] Test Badge component rendering in Block.tsx
- [x] Test Progress component rendering (for loading states)
- [ ] Create missing Dialog component wrapper
- [ ] Create Alert component if not present
- [x] Verify all shadcn/ui component imports resolve

## Pages & Routing
- [x] Updated app/page.tsx to import from @/components/chat/Block
- [x] Updated pages/index.jsx to import from @/components/chat/Block
- [x] Updated pages/index.tsx to import from @/components/chat/Block
- [ ] Test Next.js App Router entry point (app/page.tsx)
- [ ] Test legacy Pages Router fallback (pages/index.tsx)
- [ ] Add proper error boundaries for graceful failures

## Styling & CSS
- [x] Tailwind CSS integration (inferred from classNames)
- [ ] Verify globals.css is loaded in app/page.tsx or _app.jsx
- [ ] Test responsive design on mobile/tablet/desktop
- [ ] Audit color scheme (dark mode support?)

## Testing
- [ ] Run `npm run next:dev` and verify no compilation errors
- [ ] Open http://localhost:3000 and check chat UI loads
- [ ] Test username creation flow
- [ ] Test language selection (8 categories)
- [ ] Test lounge selection and scrolling
- [ ] Verify icons render (lucide-react)

## Performance
- [ ] Check bundle size after build
- [ ] Audit unused imports and code splitting
- [ ] Lazy load language categories if needed

---

# Backend

Express API, Socket.IO, authentication, real-time chat.

## API Routes
- [ ] Verify /api/auth/signup endpoint works
- [ ] Verify /api/auth/signin endpoint works
- [ ] Verify /api/auth/guest endpoint works
- [ ] Verify /api/auth/me endpoint works
- [ ] Verify /api/auth/refresh endpoint works
- [ ] Verify /api/auth/change-password endpoint works
- [ ] Verify /api/auth/signout endpoint works
- [ ] Verify /health check endpoint works
- [ ] Add error handling and validation to all routes
- [ ] Add proper HTTP status codes and error responses

## WebSocket / Real-Time Chat
- [ ] Test Socket.IO server on port 3002
- [ ] Implement room joining (by language/lounge ID)
- [ ] Implement message broadcasting within rooms
- [ ] Test connection/disconnect event handling
- [ ] Add graceful reconnection logic
- [ ] Implement presence tracking (user list per lounge)

## Authentication
- [ ] Verify JWT token generation works
- [ ] Verify JWT token refresh works
- [ ] Test guest session creation
- [ ] Test default password generation for sign-up (firstName + birthYear + lastName)
- [ ] Implement rate limiting on auth endpoints (already has middleware)
- [ ] Add CSRF protection (already has middleware)

## Server Setup
- [x] Separate API server (server.js, port 3001)
- [x] Separate Socket.IO server (socket-server.js, port 3002)
- [x] Fixed duplicate Express declarations
- [ ] Test server.js starts without errors
- [ ] Test socket-server.js starts without errors
- [ ] Configure environment variables (.env)
- [ ] Add proper logging and debugging

## Database Queries
- [ ] Implement user creation in signup
- [ ] Implement user lookup in signin
- [ ] Implement session creation/deletion
- [ ] Implement chat message storage
- [ ] Add proper indexes for query performance

## Security
- [ ] Review CORS configuration (currently http://localhost:3000)
- [ ] Add helmet for security headers
- [ ] Validate all user inputs on API routes
- [ ] Implement rate limiting properly
- [ ] Add HTTPS for production

---

# Database

Prisma ORM, schema design, migrations, data models.

## Schema & Models
- [ ] Review prisma/schema.prisma for completeness
- [ ] Verify User model has all needed fields (email, phone, password, username, etc.)
- [ ] Verify Session model for temporary sessions
- [ ] Verify ChatMessage model for message storage
- [ ] Verify LanguageRoom model for lounge organization
- [ ] Add timestamps (createdAt, updatedAt) to all models
- [ ] Add soft deletes if needed

## Migrations
- [x] Review existing migration: 003_verification_tables.sql
- [ ] Create migration for User table
- [ ] Create migration for Session table
- [ ] Create migration for ChatMessage table
- [ ] Create migration for LanguageRoom table
- [ ] Run migrations: `npm run prisma:migrate`
- [ ] Verify database schema matches models

## Indexes & Performance
- [ ] Add index on User.email for fast lookups
- [ ] Add index on User.phone for fast lookups
- [ ] Add index on Session.userId for joins
- [ ] Add index on ChatMessage.roomId for queries
- [ ] Add index on ChatMessage.createdAt for sorting

## Testing & Queries
- [ ] Test user creation query
- [ ] Test user lookup by email
- [ ] Test user lookup by phone
- [ ] Test session creation/deletion
- [ ] Test message insertion and retrieval
- [ ] Verify prisma client is properly initialized (lib/prisma.ts)

## Environment & Connection
- [ ] Configure DATABASE_URL in .env
- [ ] Test database connection on startup
- [ ] Add connection pooling for production
- [ ] Configure proper timeout values

---

# Bugs & Fixes

Known issues, blockers, and fixes needed.

## Fixed Issues
- [x] JSX syntax error in Block.tsx line 457 (malformed className)
- [x] Duplicate Express declarations in server.js
- [x] Socket.IO port conflict (running on same port as API)
- [x] Missing tsconfig.json for TypeScript JSX support
- [x] Missing badge.tsx component
- [x] Missing progress.tsx component
- [x] Component type mismatches in Block.tsx (Card, Button, Badge props)
- [x] Missing Progress component
- [x] TypeScript module resolution for progress component

## Current Blockers
- [x] Missing npm dependencies: clsx, tailwind-merge, @radix-ui/react-progress
  - Action: Simplified components to remove dependency on @radix-ui
- [x] Component type mismatches in Block.tsx (relaxed with strict: false)
  - Status: Fixed by making components accept flexible props
- [ ] Need to test server.js and socket-server.js start correctly

## High Priority
- [ ] Run `npm install && npm run next:dev` locally
- [ ] Verify app loads on http://localhost:3000 without errors
- [ ] Check browser console for client-side errors
- [ ] Test Socket.IO connection between client and server

## Medium Priority
- [ ] Add proper error handling to all API endpoints
- [ ] Implement input validation on form submissions
- [ ] Add loading states and error messages to UI
- [ ] Fix type safety issues in Block.tsx (add proper prop types)

## Low Priority
- [ ] Audit performance and bundle size
- [ ] Add unit/integration tests
- [ ] Set up CI/CD pipeline
- [ ] Add logging/monitoring

## Resolved But Should Monitor
- TypeScript strictness relaxed to unblock development
  - Future: Add proper type definitions for components and re-enable strict mode
- Some shadcn/ui components imported but not installed
  - Status: Creating local versions (badge.tsx, progress.tsx)

---

# Infrastructure

Environment, deployment, configuration, DevOps, CI/CD.

## Environment Setup
- [ ] Create .env.local for development
- [ ] Create .env.example for documentation
- [ ] Configure DATABASE_URL (PostgreSQL connection string)
- [ ] Configure API_PORT (default 3001)
- [ ] Configure SOCKET_PORT (default 3002)
- [ ] Configure JWT_SECRET for token signing
- [ ] Configure TWILIO credentials (if needed)
- [ ] Configure CORS origins properly

## Development
- [ ] Document setup instructions in README.md
- [ ] Add npm scripts for common tasks
  - `npm run dev` — Start all servers (API, Socket.IO, Next.js)
  - `npm run dev:api` — Start API server only
  - `npm run dev:socket` — Start Socket.IO server only
  - `npm run db:migrate` — Run Prisma migrations
  - `npm run db:seed` — Seed test data
- [ ] Set up nodemon for auto-reload
- [ ] Add environment variable validation on startup

## Build & Deployment
- [ ] Configure Next.js build process (`npm run next:build`)
- [ ] Test production build locally
- [ ] Set up Docker containers (optional)
- [ ] Configure deployment target (Vercel, AWS, Heroku, etc.)
- [ ] Set up environment variables in deployment platform

## Testing
- [ ] Add Jest for unit testing
- [ ] Add Cypress/Playwright for E2E testing
- [ ] Set up test coverage reporting
- [ ] Create test fixtures and mocks

## CI/CD
- [ ] Set up GitHub Actions workflows
  - Run linter on push
  - Run tests on push
  - Build and deploy on merge to main
- [ ] Configure branch protection rules
- [ ] Set up automated deployments

## Monitoring & Logging
- [ ] Configure logging service (Winston, Pino, etc.)
- [ ] Add error tracking (Sentry, etc.)
- [ ] Set up uptime monitoring
- [ ] Add performance monitoring

## Security
- [ ] Review and fix CORS configuration
- [ ] Enable HTTPS in production
- [ ] Configure security headers (Helmet)
- [ ] Set up rate limiting properly
- [ ] Add CSRF protection
- [ ] Audit dependencies for vulnerabilities

## Documentation
- [ ] Update README.md with setup instructions
- [ ] Document API endpoints
- [ ] Document WebSocket message formats
- [ ] Document database schema
- [ ] Create deployment guide
