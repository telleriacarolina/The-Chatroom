# The Chatroom - Task Tracker

This file contains GitHub-ready tasks that can be imported into GitHub Projects or converted to issues.

**🔗 Quick Links:**

- [Create New Issue](https://github.com/telleriacarolina/The-Chatroom/issues/new/choose)
- [View Project Board](https://github.com/telleriacarolina/The-Chatroom/projects)
- [View All Issues](https://github.com/telleriacarolina/The-Chatroom/issues)

---

## 🎯 IMMEDIATE ACTIONS (High Priority)

### #1 Fix TypeScript Errors in Block.tsx
<<<<<<< HEAD

=======
>>>>>>> origin/main
**Package:** `@chatroom/web`  
**Labels:** `bug`, `typescript`, `high-priority`  
**Time:** 5 minutes  
**Status:** Pending

**Description:**
Fix type error on line 14 of `components/chat/Block.tsx`

**Tasks:**
<<<<<<< HEAD

=======
>>>>>>> origin/main
- [ ] Change `useState(null)` to `useState<string | null>(null)`
- [ ] Verify no TypeScript errors with `npm run build`
- [ ] Test component renders correctly

**Files:**

- `packages/web/src/components/chat/Block.tsx`

---

### #2 Set Up Environment Variables

**Package:** `@chatroom/api`, `@chatroom/socket`, `@chatroom/web`  
**Labels:** `infrastructure`, `high-priority`  
**Time:** 10 minutes

**Description:**
Create environment configuration files for all packages

**Tasks:**

- [ ] Copy `packages/api/.env.example` to `packages/api/.env`
- [ ] Configure DATABASE_URL with PostgreSQL connection
- [ ] Set ACCESS_TOKEN_SECRET (32+ chars)
- [ ] Set REFRESH_TOKEN_SECRET (32+ chars)
- [ ] Set PHONE_ENC_KEY (32-byte encryption key)
- [ ] Copy `packages/socket/.env.example` to `packages/socket/.env`
- [ ] Create `packages/web/.env.local` with API/Socket URLs

**Files:**

- `packages/api/.env`
- `packages/socket/.env`
- `packages/web/.env.local`

---

### #3 Initialize Database

**Package:** `@chatroom/api`  
**Labels:** `database`, `high-priority`  
**Time:** 5 minutes

**Description:**
Generate Prisma client and run database migrations

**Tasks:**

- [ ] Run `cd packages/api && npm run prisma:generate`
- [ ] Run `npm run prisma:migrate`
- [ ] Verify database tables created
- [ ] Test database connection

**Commands:**

```bash
cd packages/api
npm run prisma:generate
npm run prisma:migrate
```

---

### #4 Test Application Startup

**Package:** All  
**Labels:** `testing`, `high-priority`  
**Time:** 15 minutes

**Description:**
Verify all three servers start without errors

**Tasks:**

- [ ] Start API server: `npm run dev:api` (port 3001)
- [ ] Start Socket.IO: `npm run dev:socket` (port 3002)
- [ ] Start Next.js: `npm run dev:web` (port 3000)
- [ ] Test API health endpoint: `GET http://localhost:3001/health`
- [ ] Test Socket.IO connection from browser console
- [ ] Verify Block component renders in browser

---

## 🚀 PHASE 1: Connect Frontend to Backend (1-2 hours)

### #5 Create API Client Utilities

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `frontend`  
**Time:** 30 minutes

**Description:**
Build reusable API client with fetch wrapper

**Tasks:**

- [ ] Create `packages/web/src/lib/api.ts`
- [ ] Implement fetch wrapper with error handling
- [ ] Add baseURL from env variables
- [ ] Add request/response interceptors
- [ ] Add TypeScript types for API responses
- [ ] Create helper functions for common requests

**Files:**

- `packages/web/src/lib/api.ts`

---

### #6 Create Socket.IO Client Wrapper

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `frontend`, `websocket`  
**Time:** 30 minutes

**Description:**
Set up Socket.IO client instance with reconnection logic

**Tasks:**

- [ ] Create `packages/web/src/lib/socket.ts`
- [ ] Initialize socket.io-client with server URL
- [ ] Add connection/disconnection event handlers
- [ ] Implement reconnection logic
- [ ] Add TypeScript types for socket events
- [ ] Create React hook for socket usage

**Files:**

- `packages/web/src/lib/socket.ts`
- `packages/web/src/hooks/useSocket.ts` (optional)

---

### #7 Connect Guest Registration to API

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `frontend`  
**Time:** 45 minutes

**Description:**
Connect Block.tsx username creation to `/api/auth/guest` endpoint

**Tasks:**

- [ ] Import API client in Block.tsx
- [ ] Call `/api/auth/guest` on username submission
- [ ] Store guest token in state/localStorage
- [ ] Handle API errors gracefully
- [ ] Add loading state during API call
- [ ] Update UI based on response

**Files:**

- `packages/web/src/components/chat/Block.tsx`

---

### #8 Display Real-Time User Counts

**Package:** `@chatroom/web`, `@chatroom/socket`  
**Labels:** `enhancement`, `websocket`  
**Time:** 1 hour

**Description:**
Show live user counts per lounge from Socket.IO

**Tasks:**

- [ ] Emit user count events from socket server
- [ ] Subscribe to user count events in Block.tsx
- [ ] Update lounge member counts in real-time
- [ ] Add connection status indicator
- [ ] Handle disconnection gracefully

**Files:**

- `packages/socket/src/socket-server.js`
- `packages/web/src/components/chat/Block.tsx`

---

### #9 Add Connection Status Indicator

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `ui`  
**Time:** 20 minutes

**Description:**
Show connection status (connected/disconnected/reconnecting)

**Tasks:**

- [ ] Create ConnectionStatus component
- [ ] Add socket connection state tracking
- [ ] Show colored badge (green/red/yellow)
- [ ] Add reconnect button on disconnect
- [ ] Display status in header/footer

**Files:**

- `packages/web/src/components/ConnectionStatus.tsx`

---

### #10 Implement Error Toast Notifications

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `ui`  
**Time:** 30 minutes

**Description:**
Add toast notification system for errors and success messages

**Tasks:**

- [ ] Install sonner or react-hot-toast
- [ ] Create toast provider in layout
- [ ] Add error toasts for API failures
- [ ] Add success toasts for actions
- [ ] Style toasts to match theme

**Files:**

- `packages/web/src/app/layout.tsx`
- `packages/web/src/lib/toast.ts`

---

## 🚀 PHASE 2: Authentication Flow (2-3 hours)

### #11 Create Login Form Component

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `auth`  
**Time:** 45 minutes

**Tasks:**

- [ ] Create `packages/web/src/components/auth/LoginForm.tsx`
- [ ] Add phone number input with validation
- [ ] Add password input with show/hide toggle
- [ ] Add "Stay signed in" checkbox
- [ ] Connect to `/api/auth/signin` endpoint
- [ ] Handle JWT token storage
- [ ] Redirect to chat on success

---

### #12 Create Signup Form Component

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `auth`  
**Time:** 45 minutes

**Tasks:**

- [ ] Create `packages/web/src/components/auth/SignupForm.tsx`
- [ ] Add phone number input
- [ ] Add first name, last name, birth year fields
- [ ] Add phone number validation
- [ ] Connect to `/api/auth/signup` endpoint
- [ ] Show SMS confirmation message
- [ ] Handle errors (duplicate phone, etc.)

---

### #13 Implement JWT Token Storage

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `auth`, `security`  
**Time:** 30 minutes

**Tasks:**

- [ ] Use httpOnly cookies for tokens (backend sets)
- [ ] Add token refresh logic before expiry
- [ ] Clear tokens on logout
- [ ] Handle token expiration errors
- [ ] Add token validation

---

### #14 Create Auth Context Provider

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `auth`  
**Time:** 1 hour

**Tasks:**

- [ ] Create `packages/web/src/contexts/AuthContext.tsx`
- [ ] Track authentication state (logged in/out/guest)
- [ ] Provide login/logout/signup functions
- [ ] Provide current user data
- [ ] Persist auth state across reloads
- [ ] Create useAuth() hook

---

### #15 Add Protected Route Middleware

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `auth`  
**Time:** 30 minutes

**Tasks:**

- [ ] Create middleware.ts for route protection
- [ ] Redirect unauthenticated users to login
- [ ] Allow guest access to public routes
- [ ] Protect admin/creator routes by account type

---

## 🚀 PHASE 3: Real-Time Chat (3-4 hours)

### #16 Create ChatMessage Component

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `chat`, `ui`  
**Time:** 45 minutes

**Tasks:**

- [ ] Create `packages/web/src/components/chat/ChatMessage.tsx`
- [ ] Display message text, sender, timestamp
- [ ] Add avatar/icon for sender
- [ ] Style based on message type (own/other/system)
- [ ] Add message actions (report, delete if admin)

---

### #17 Create ChatInput Component

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `chat`, `ui`  
**Time:** 30 minutes

**Tasks:**

- [ ] Create `packages/web/src/components/chat/ChatInput.tsx`
- [ ] Add text input with multiline support
- [ ] Add send button
- [ ] Emit typing events
- [ ] Handle Enter to send (Shift+Enter for newline)
- [ ] Character limit validation

---

### #18 Create ChatRoom Component

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `chat`  
**Time:** 1 hour

**Tasks:**

- [ ] Create `packages/web/src/components/chat/ChatRoom.tsx`
- [ ] Display list of messages
- [ ] Auto-scroll to latest message
- [ ] Connect to Socket.IO for real-time updates
- [ ] Handle room join/leave events
- [ ] Show typing indicators

---

### #19 Implement Message Broadcasting

**Package:** `@chatroom/socket`  
**Labels:** `enhancement`, `websocket`  
**Time:** 1 hour

**Tasks:**

- [ ] Handle `chat message` event in socket server
- [ ] Broadcast to all users in same room
- [ ] Add message validation
- [ ] Prevent spam (rate limiting)
- [ ] Store messages in database

---

### #20 Add Online User List

**Package:** `@chatroom/web`, `@chatroom/socket`  
**Labels:** `enhancement`, `chat`, `ui`  
**Time:** 45 minutes

**Tasks:**

- [ ] Track users in each room
- [ ] Emit user list on join/leave
- [ ] Display online users in sidebar
- [ ] Show user count badge
- [ ] Update in real-time

---

## 📋 QUICK WINS

### #21 Add Dark Mode Toggle

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `ui`, `quick-win`  
**Time:** 30 minutes

**Tasks:**

- [ ] Add theme toggle button in header
- [ ] Use CSS variables already defined
- [ ] Persist preference in localStorage
- [ ] Add smooth transition animation

---

### #22 Create Error Boundary

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `error-handling`, `quick-win`  
**Time:** 15 minutes

**Tasks:**

- [ ] Create ErrorBoundary component
- [ ] Wrap app in layout.tsx
- [ ] Show friendly error message
- [ ] Add "Reload" button
- [ ] Log errors to console

---

### #23 Add Loading Spinners

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `ui`, `quick-win`  
**Time:** 20 minutes

**Tasks:**

- [ ] Add loading state to API calls
- [ ] Show Loader2 icon from lucide-react
- [ ] Disable buttons during loading
- [ ] Add skeleton loaders for lists

---

### #24 Create 404 Page

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `ui`, `quick-win`  
**Time:** 20 minutes

**Tasks:**

- [ ] Create `packages/web/src/app/not-found.tsx`
- [ ] Add friendly message
- [ ] Add link back to home
- [ ] Style to match theme

---

### #25 Add Form Validation

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `validation`, `quick-win`  
**Time:** 30 minutes

**Tasks:**

- [ ] Install react-hook-form
- [ ] Add validation to login form
- [ ] Add validation to signup form
- [ ] Show inline error messages
- [ ] Disable submit when invalid

---

## 🔧 TECHNICAL IMPROVEMENTS

### #26 Add ESLint Configuration

**Package:** All  
**Labels:** `infrastructure`, `code-quality`  
**Time:** 45 minutes

**Tasks:**

- [ ] Create shared ESLint config in root
- [ ] Extend in each package
- [ ] Add lint script to package.json
- [ ] Fix existing lint errors
- [ ] Add pre-commit hook

---

### #27 Add Prettier Configuration

**Package:** All  
**Labels:** `infrastructure`, `code-quality`  
**Time:** 30 minutes

**Tasks:**

- [ ] Create .prettierrc in root
- [ ] Add format script
- [ ] Configure VS Code integration
- [ ] Format all existing files
- [ ] Add pre-commit hook

---

### #28 Set Up Jest Testing

**Package:** All  
**Labels:** `testing`, `infrastructure`  
**Time:** 2 hours

**Tasks:**

- [ ] Install Jest and dependencies
- [ ] Configure jest.config.js
- [ ] Add test scripts
- [ ] Create example test
- [ ] Set up test coverage

---

### #29 Add E2E Testing with Playwright

**Package:** `@chatroom/web`  
**Labels:** `testing`, `infrastructure`  
**Time:** 2 hours

**Tasks:**

- [ ] Install Playwright
- [ ] Configure playwright.config.ts
- [ ] Write login flow test
- [ ] Write chat flow test
- [ ] Add to CI pipeline

---

### #30 Implement Redis Caching

**Package:** `@chatroom/api`  
**Labels:** `performance`, `infrastructure`  
**Time:** 2 hours

**Tasks:**

- [ ] Install Redis client
- [ ] Configure connection
- [ ] Cache session data
- [ ] Cache user counts
- [ ] Add cache invalidation

---

## 🔐 SECURITY

### #31 Add Input Sanitization

**Package:** `@chatroom/api`  
**Labels:** `security`, `high-priority`  
**Time:** 1 hour

**Tasks:**

- [ ] Install validator.js
- [ ] Sanitize all user inputs
- [ ] Add XSS protection
- [ ] Validate phone numbers
- [ ] Escape HTML in messages

---

### #32 Implement Rate Limiting Per Route

**Package:** `@chatroom/api`  
**Labels:** `security`, `high-priority`  
**Time:** 45 minutes

**Tasks:**

- [ ] Apply rate limiter to all endpoints
- [ ] Configure different limits per route
- [ ] Add rate limit headers
- [ ] Return 429 status on limit
- [ ] Log rate limit violations

---

### #33 Set Up HTTPS in Production

**Package:** Infrastructure  
**Labels:** `security`, `devops`  
**Time:** 1 hour

**Tasks:**

- [ ] Obtain SSL certificate
- [ ] Configure HTTPS server
- [ ] Add redirect from HTTP
- [ ] Update environment URLs
- [ ] Test secure connections

---

## 📊 MONITORING

### #34 Integrate Error Tracking (Sentry)

**Package:** All  
**Labels:** `monitoring`, `infrastructure`  
**Time:** 1 hour

**Tasks:**

- [ ] Create Sentry account
- [ ] Install Sentry SDK
- [ ] Configure error reporting
- [ ] Add source maps
- [ ] Test error capture

---

### #35 Add Performance Monitoring

**Package:** `@chatroom/web`  
**Labels:** `monitoring`, `performance`  
**Time:** 45 minutes

**Tasks:**

- [ ] Track Web Vitals (LCP, FID, CLS)
- [ ] Log to analytics service
- [ ] Set performance budgets
- [ ] Monitor bundle size
- [ ] Track API response times

---

## 🎨 UI/UX

### #36 Add Emoji Picker

**Package:** `@chatroom/web`  
**Labels:** `enhancement`, `ui`, `chat`  
**Time:** 1 hour

**Tasks:**

- [ ] Install emoji picker library
- [ ] Add emoji button to chat input
- [ ] Show picker on click
- [ ] Insert emoji at cursor position
- [ ] Add recent emojis

---

### #37 Implement Typing Indicators

**Package:** `@chatroom/web`, `@chatroom/socket`  
**Labels:** `enhancement`, `chat`  
**Time:** 45 minutes

**Tasks:**

- [ ] Emit typing event from input
- [ ] Broadcast to room members
- [ ] Show "User is typing..." message
- [ ] Clear after 3 seconds
- [ ] Limit to 3 users shown

---

### #38 Add Message Reactions

**Package:** `@chatroom/web`, `@chatroom/api`  
**Labels:** `enhancement`, `chat`  
**Time:** 2 hours

**Tasks:**

- [ ] Add reaction buttons to messages
- [ ] Store reactions in database
- [ ] Broadcast reaction events
- [ ] Show reaction counts
- [ ] Animate reaction changes

---

---

## 📝 How to Use This Task List

### Option 1: Create GitHub Issues Manually

1. Go to [Issues](https://github.com/telleriacarolina/The-Chatroom/issues/new/choose)
2. Choose appropriate template (Bug/Feature/Task)
3. Copy task content from above
4. Add labels and assignees
5. Submit issue

### Option 2: Use GitHub CLI

```bash
# Create issue from command line
gh issue create --title "Fix TypeScript Errors in Block.tsx" --body "See TASKS.md #1" --label "bug,typescript,high-priority"
```

### Option 3: Create GitHub Project Board

1. Go to [Projects](https://github.com/telleriacarolina/The-Chatroom/projects)
2. Create new project
3. Add columns: Backlog, To Do, In Progress, Done
4. Convert tasks to issues and add to project

### Option 4: Use Automated Tools

- [GitHub CLI](https://cli.github.com/) for bulk issue creation
- [GitHub Actions](https://github.com/features/actions) for automation
- [Project boards](https://docs.github.com/en/issues/planning-and-tracking-with-projects) for visual tracking

---

**Last Updated:** December 29, 2025
