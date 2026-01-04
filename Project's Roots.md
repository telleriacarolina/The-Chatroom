# Project's Roots

## Overview

A standalone harness for error-routing, scenario-testing, and user enforcement policies. All scenarios, policies, and test runners consolidated here.

### Philosophy: Self-Contained Architecture

This file maintains a **self-contained project** approach that can run without splitting into multiple files. The goal is to enable:

- **Rapid Prototyping** — Start coding immediately without complex setup
- **Easy Review** — All logic visible in one place for auditing and understanding
- **Minimal Dependencies** — Reduce external file coordination and import chains
- **Quick Deployment** — Single-file deployment without build systems
- **Educational Clarity** — New developers can see the entire system at once
- **Zero Configuration** — No webpack, no bundlers, no complex toolchains

**When to use self-contained approach:**

- Early-stage prototyping and MVP development
- Demo applications and proof-of-concepts
- Learning/teaching projects
- Quick experiments and tests
- Simple microservices with limited scope

**When to split into multiple files:**

- Production applications with complex business logic
- Team collaboration requiring clear module boundaries
- Code reuse across multiple projects
- Large codebases (>1000 lines per domain)
- Need for comprehensive test coverage

This documentation bridges both approaches: start self-contained, evolve to production-ready structure as needed.

---

## Scenario Test Harness

This is a minimal harness to exercise all listed scenarios, including handling unknown options that result in a "Nothing happened" path and error popups for users. Errors do not sign users off unless a creator explicitly opts to kick/ban/remove.

### Files (Included in Run-Tests Logic)

- `scenarios.json` — Declarative list of scenarios, options, and expected outcomes.
- `run-tests.js` — Executes every scenario/option and prints a table of results, flagging the unknown path as an expected error that should surface a popup.
- `policy.json` — Defines allowed enforcement actions and sets the default `stay` action so errors/popup paths do not sign users off unless a creator explicitly chooses kick/ban/remove.

### How to Run

```bash
node "Project's Roots.md"  # Review this file for integration
```

- Success paths are marked as `passed`.
- Known negative paths are marked as `failed`.
- Unknown options are marked as `expected-error` with the message "Nothing happened" and `popup: true` so the UI can surface an error popup.
- Any unclassified option is marked `unhandled-error` and will set a non-zero exit code.

### User Action Policy

- Default: `stay` (errors and popups do not sign the user off).
- Creator-controlled overrides: `kick`, `temp-ban`, `perm-ban`, `remove` (set via meta.enforcementAction when routing a problem).

Update scenarios.json to mirror the real cases you need to cover; the runner picks up changes automatically.

---

## Standalone Setup

This is the standalone version of the error-routing and scenario-testing harness.

### Quick Start

```bash
# Clone the repo
git clone https://github.com/telleriacarolina/leaving-room-x-factor.git
cd leaving-room-x-factor

# Run scenario tests
npm test

# View error logs (requires jq)
npm run logs
```

---

## Integration into Your App

### 1. Use the Error Router in Your Backend

```javascript
const { routeProblem, routeUnknownOption } = require('path/to/error-router');

// Log a warning or error through the router
routeProblem({
  source: 'auth',
  severity: 'error',
  message: 'Invalid credentials',
  meta: { userId: '123' },
  userAction: 'stay', // or 'kick', 'temp-ban', 'perm-ban', 'remove'
});

// Log an unknown option (will default to stay)
routeUnknownOption({ scenario: 'auth', optionKey: 'unknownMethod' });
```

### 2. Wire into Your Logger

Replace your existing logger with this one, or call `routeProblem` from your current logging layer:

```javascript
const logger = require('path/to/error-router');

logger.error('User login failed', error);
// Automatically routes to error-log.jsonl with default stay action
```

### 3. Read Error Logs on the Backend

```javascript
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('error-log.jsonl'),
});

rl.on('line', (line) => {
  const entry = JSON.parse(line);
  console.log(entry); // { timestamp, source, severity, message, userAction, ... }
});
```

### 4. Enforcement Actions on Frontend

When displaying errors to users, check the `userAction` field from the logged entry:

```javascript
// If userAction === 'stay': Show popup, keep user signed in
// If userAction === 'kick': Show popup, sign user out
// If userAction === 'temp-ban': Show popup, block access for X hours
// If userAction === 'perm-ban': Show popup, permanently block user
// If userAction === 'remove': Show popup, delete account
```

---

## Policy Configuration

Edit `policy.json` to customize enforcement actions:

```json
{
  "defaultUserAction": "stay",
  "enforcementActions": ["stay", "kick", "temp-ban", "perm-ban", "remove"],
  "notes": "..."
}
```

Default behavior: **Errors do not sign users off.** Creator/admin can explicitly override via `userAction` or `meta.enforcementAction`.

---

## Scenario Definition

Add test cases to `scenarios.json`:

```json
{
  "scenarios": [
    {
      "name": "authentication",
      "description": "Sign in and session flows",
      "options": [
        { "key": "validCredentials", "type": "success", "expected": "User authenticates and session is created." },
        { "key": "invalidPassword", "type": "error", "expected": "Reject invalid password and return 401." },
        { "key": "lockedAccount", "type": "error", "expected": "Reject locked accounts and prompt contact support." },
        { "key": "unknownOption", "type": "unknown", "expected": "Nothing happened; show error popup to user." }
      ]
    },
    {
      "name": "messaging",
      "description": "Chat message delivery",
      "options": [
        { "key": "sendMessage", "type": "success", "expected": "Message is delivered and acknowledged." },
        { "key": "rateLimited", "type": "error", "expected": "Server throttles and informs user." },
        { "key": "blockedByRecipient", "type": "error", "expected": "Delivery refused when recipient blocks sender." },
        { "key": "unknownOption", "type": "unknown", "expected": "Nothing happened; show error popup to user." }
      ]
    },
    {
      "name": "marketplace",
      "description": "Content purchase flow",
      "options": [
        { "key": "purchaseSuccess", "type": "success", "expected": "Transaction completes and receipt issued." },
        { "key": "insufficientFunds", "type": "error", "expected": "Payment rejected with insufficient balance notice." },
        { "key": "itemUnavailable", "type": "error", "expected": "Purchase blocked when item is unavailable." },
        { "key": "unknownOption", "type": "unknown", "expected": "Nothing happened; show error popup to user." }
      ]
    }
  ]
}
```

---

## Key Takeaways

- **Defaults to stay**: Users are not signed off unless explicitly enforced.
- **Declarative scenarios**: All test cases live in `scenarios.json` for easy updates.
- **Error routing**: Central error handler logs all problems and routes user actions.
- **Frontend integration**: Check `userAction` field to decide UI behavior (popup, signout, ban, etc.).
- **Easy extension**: Add new scenarios and enforcement actions without touching the core logic.

---

## Standalone Application

### app-standalone.js

A single-file Express + Socket.IO chatroom application for rapid prototyping and testing. Contains all backend and frontend code in one executable file.

**Features:**

- Guest and registered user authentication
- Real-time messaging with Socket.IO
- Multi-language room support (8 languages)
- JWT token-based sessions
- In-memory data store (users, rooms, messages)
- Embedded HTML/CSS/JavaScript frontend
- Health check endpoint

**Usage:**

```bash
node app-standalone.js
# Then open: http://localhost:3000
```

**API Endpoints:**

- `GET /health` — Server health and statistics
- `POST /api/auth/guest` — Create guest session
- `POST /api/auth/signup` — Register new user
- `POST /api/auth/signin` — Authenticate user
- `GET /api/auth/me` — Get current user
- `GET /api/rooms` — List all rooms
- `GET /api/rooms/:room/messages` — Get room message history

**Socket.IO Events:**

- `join-room` — Join a language room
- `chat-message` — Send message to current room
- `typing` / `stop-typing` — Typing indicators
- `user-joined` / `user-left` — Room presence notifications

**Configuration:**

- `PORT` — Server port (default: 3000)
- `JWT_SECRET` — Token signing key (default: dev key)

**Production Notes:**

- Replace in-memory storage with database (PostgreSQL/MongoDB)
- Set proper JWT_SECRET environment variable
- Add rate limiting and CSRF protection
- Implement proper session management
- Add logging and monitoring
- Use HTTPS in production

---

## Standard Project Folders

Missing standard folders for maintainable projects that should be added for production-ready structure:

### Core Folders

- **src/** — All core logic (ErrorRouter, PolicyEngine, ScenarioTester) should live here
  - Centralizes business logic and domain code
  - Makes imports predictable and testable
  - Separates implementation from configuration

- **tests/** — Unit and integration tests
  - Unit tests for individual functions/classes
  - Integration tests for multi-component workflows
  - End-to-end scenario tests
  - Test fixtures and mocks

- **scripts/** — Utility scripts (build, seed data, run tests)
  - Build automation
  - Database seeding
  - Test runners
  - Deployment helpers

- **config/** — Configuration files separate from policy.json
  - Environment-specific configs (dev, staging, prod)
  - Service configuration (database, APIs, external services)
  - Feature flags
  - Separate from runtime policy

### Supporting Folders

- **logs/** — Centralized logging folder
  - Application logs (app.log, error.log)
  - Service-specific logs (api.log, socket.log)
  - Audit trails
  - Structured logging output (JSONL format)

- **docs/** — Detailed documentation beyond the README
  - Architecture decisions (ADRs)
  - API documentation
  - Integration guides
  - Developer onboarding
  - Workflow diagrams

- **public/** — Static assets for frontend (if frontend grows beyond embedded HTML)
  - CSS stylesheets
  - JavaScript bundles
  - Images and icons
  - Fonts
  - Service worker and manifest files

- **packages/** — Shared modules if this project evolves into multi-app or multi-package setup
  - Monorepo structure support
  - Shared types and utilities
  - Reusable components
  - Cross-package dependencies

### Implementation Priority

1. **Immediate** (Essential for maintainability):
   - src/ — Move all core logic here
   - tests/ — Add test coverage
   - logs/ — Centralize log output

2. **Short-term** (Within 1-2 sprints):
   - scripts/ — Automation and tooling
   - config/ — Environment management
   - docs/ — Developer documentation

3. **Long-term** (As project scales):
   - public/ — When frontend becomes standalone
   - packages/ — For multi-package architecture

---

## Production-Ready Infrastructure

### Dependency & Environment Files

**Package Management:**

- `package.json` — Main dependencies and scripts
- `package-lock.json` — Locked dependency versions
- `.nvmrc` — Node.js version specification
- `pnpm-workspace.yaml` — Monorepo workspace configuration (if using pnpm)

**Environment Configuration:**

- `.env` — Local development environment variables (git-ignored)
- `.env.example` — Template for required environment variables
- `.env.production` — Production-specific overrides
- `.env.test` — Test environment configuration
- `config/default.json` — Default configuration values
- `config/production.json` — Production overrides

**Required Environment Variables:**

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chatroom"

# Authentication
ACCESS_TOKEN_SECRET="32-char-minimum-secret-key"
REFRESH_TOKEN_SECRET="32-char-minimum-secret-key"
JWT_EXPIRY="15m"
REFRESH_EXPIRY="30d"

# Encryption
ENCRYPTION_KEY="32-byte-encryption-key"
PHONE_ENC_KEY="32-byte-phone-encryption-key"

# Services
TWILIO_ACCOUNT_SID="optional"
TWILIO_AUTH_TOKEN="optional"
TWILIO_FROM_NUMBER="+1234567890"

# Server
PORT=3001
SOCKET_PORT=3002
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development|production|test"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Monitoring
SENTRY_DSN="optional"
LOG_LEVEL="info|debug|warn|error"
```

---

### CI/CD Pipeline

**GitHub Actions Workflow (.github/workflows/):**

**1. Continuous Integration (.github/workflows/ci.yml):**

```yaml
name: CI Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

**2. Continuous Deployment (.github/workflows/deploy.yml):**

```yaml

name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_KEY }}
        run: |
          # Deployment commands
```

**Pre-commit Hooks (.husky/):**

- Format check (Prettier)
- Lint check (ESLint)
- Type check (TypeScript)
- Run unit tests
- Commit message validation (Conventional Commits)

**Deployment Targets:**

- Vercel (Next.js frontend)
- Railway/Render (API + Socket.IO)
- AWS EC2/ECS (Full stack)
- Docker containers

---

### Security Measures

**Authentication & Authorization:**

- JWT token rotation (access + refresh)
- bcrypt password hashing (12 rounds minimum)
- Rate limiting on all endpoints
- CSRF protection (double-submit pattern)
- Session timeout and cleanup

**Data Protection:**

- AES-256-GCM encryption for PII (phone numbers)
- HTTPS/TLS in production
- Secure cookie settings (httpOnly, secure, sameSite)
- SQL injection prevention (parameterized queries via Prisma)
- XSS protection (input sanitization)

**Infrastructure Security:**

```javascript
// Helmet.js security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
```

**Secrets Management:**

- Never commit secrets to git
- Use environment variables
- Rotate secrets regularly
- Use secret management services (AWS Secrets Manager, HashiCorp Vault)
- Separate secrets per environment

**Dependency Security:**

```bash

npm audit              # Check for vulnerabilities
npm audit fix          # Auto-fix vulnerabilities
npx snyk test          # Advanced security scanning
npm outdated           # Check for outdated packages
```

---

### Frontend Separation

**Move from Embedded to Standalone Frontend:**

**1. Extract HTML/CSS/JS from app-standalone.js:**

```bash

packages/web/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── LoginForm.tsx
│   │   └── RoomList.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── socket.ts
│   ├── pages/
│   │   ├── index.tsx
│   │   └── room/[id].tsx
│   └── App.tsx
├── package.json
└── tsconfig.json
```

**2. API Client Library:**

```typescript

// packages/web/src/lib/api.ts
export class ChatroomAPI {
  private baseURL: string;
  
  constructor(baseURL = process.env.NEXT_PUBLIC_API_URL) {
    this.baseURL = baseURL;
  }
  
  async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    return response.json();
  }
  
  async guest(username: string) {
    return this.post('/api/auth/guest', { username });
  }
  
  async signup(username: string, password: string) {
    return this.post('/api/auth/signup', { username, password });
  }
}
```

**3. Socket.IO Client Wrapper:**

```typescript

// packages/web/src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

export class ChatSocket {
  private socket: Socket;
  
  constructor(url = process.env.NEXT_PUBLIC_SOCKET_URL) {
    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: false
    });
  }
  
  connect() { this.socket.connect(); }
  disconnect() { this.socket.disconnect(); }
  
  joinRoom(room: string, username: string, token: string) {
    this.socket.emit('join-room', { room, username, token });
  }
  
  sendMessage(room: string, message: string, token: string) {
    this.socket.emit('chat-message', { room, message, token });
  }
  
  onMessage(callback: (data: any) => void) {
    this.socket.on('chat-message', callback);
  }
}
```

---

### Proper Logging

**Structured Logging with Winston:**

```javascript

// packages/api/src/lib/logger.ts
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'chatroom-api' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log') 
    })
  ]
});

// Log rotation with winston-daily-rotate-file
if (process.env.NODE_ENV === 'production') {
  const DailyRotateFile = require('winston-daily-rotate-file');
  logger.add(new DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d'
  }));
}

module.exports = logger;
```

**Usage in Application:**

```javascript

const logger = require('./lib/logger');

// Different log levels
logger.error('Authentication failed', { userId, reason: 'invalid_credentials' });
logger.warn('Rate limit exceeded', { ip: req.ip, endpoint: req.path });
logger.info('User logged in', { userId, sessionId });
logger.debug('Database query executed', { query, duration: 45 });

// Audit logging for sensitive operations
logger.info('User data accessed', {
  action: 'view_profile',
  actor: adminUserId,
  target: userId,
  timestamp: new Date(),
  ipAddress: req.ip
});
```

---

### Database Persistence

**Replace In-Memory Storage with PostgreSQL:**

**1. Prisma Schema (prisma/schema.prisma):**

```prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  username     String   @unique
  email        String?  @unique
  passwordHash String?
  type         AccountType
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  sessions     Session[]
  messages     ChatMessage[]
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  sessionToken String   @unique
  expiresAt    DateTime
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ChatMessage {
  id        String   @id @default(uuid())
  userId    String
  roomName  String
  message   String
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([roomName, createdAt])
}

enum AccountType {
  GUEST
  REGISTERED
  CREATOR
  VIEWER
}
```

**2. Database Migration:**

```bash
npx prisma migrate dev --name initial_schema
npx prisma generate
```

**3. Prisma Client Usage:**

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Replace in-memory users Map
async function createUser(username, passwordHash, type) {
  return await prisma.user.create({
    data: { username, passwordHash, type }
  });
}

async function findUserByUsername(username) {
  return await prisma.user.findUnique({
    where: { username }
  });
}

// Replace in-memory messages array
async function saveMessage(userId, roomName, message) {
  return await prisma.chatMessage.create({
    data: { userId, roomName, message }
  });
}

async function getRoomMessages(roomName, limit = 50) {
  return await prisma.chatMessage.findMany({
    where: { roomName },
    include: { user: { select: { username: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}
```

**4. Connection Pooling:**

```javascript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error']
});
```

---

### Automated Tests

**Test Structure:**

```wt.test.js
├── integration/
│   ├── api/
│   │   ├── auth.test.js
│   │   └── rooms.test.js
│   └── socket/
│       └── messaging.test.js
├── e2e/
│   ├── user-journey.test.js
│   └── chat-flow.test.js
└── fixtures/
    ├── users.json
    └── messages.json
```

**Jest Configuration (jest.config.js):**

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'packages/*/src/**/*.{js,ts}',
    '!**/*.test.{js,ts}',
    '!**/node_modules/**'
  ],
  testMatch: [
    '**/tests/**/*.test.{js,ts}'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

**Unit Test Example:**

```javascript
// tests/unit/auth.test.js
const { signAccess, verifyAccess } = require('../../packages/api/src/lib/jwt');

describe('JWT Token Management', () => {
  test('should sign and verify access token', () => {
    const payload = { userId: '123', type: 'REGISTERED' };
    const token = signAccess(payload);
    const decoded = verifyAccess(token);
    
    expect(decoded.userId).toBe('123');
    expect(decoded.type).toBe('REGISTERED');
  });
  
  test('should reject invalid token', () => {
    expect(() => verifyAccess('invalid-token')).toThrow();
  });
});
```

**Integration Test Example:**

```javascript
// tests/integration/api/auth.test.js
const request = require('supertest');
const app = require('../../packages/api/src/server');

describe('POST /api/auth/guest', () => {
  test('should create guest session', async () => {
    const response = await request(app)
      .post('/api/auth/guest')
      .send({ username: 'TestGuest', ageCategory: '18PLUS' });
    
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.user).toHaveProperty('id');
    expect(response.body).toHaveProperty('token');
  });
});
```

**E2E Test with Playwright:**

```javascript
// tests/e2e/chat-flow.test.js
const { test, expect } = require('@playwright/test');

test('complete chat flow', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3000');
  
  // Join as guest
  await page.fill('#usernameInput', 'E2ETestUser');
  await page.click('button:has-text("Join as Guest")');
  
  // Wait for main interface
  await expect(page.locator('#mainContainer')).toBeVisible();
  
  // Join a room
  await page.click('button:has-text("English")');
  
  // Send a message
  await page.fill('#messageInput', 'Hello from E2E test!');
  await page.click('#sendBtn');
  
  // Verify message appears
  await expect(page.locator('.message:has-text("Hello from E2E test!")')).toBeVisible();
});
```

**Test Scripts (package.json):**

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "playwright test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## Evolution Path: From Self-Contained to Production

This document is structured to support **progressive enhancement**:

### Stage 1: Self-Contained (Current)

✅ **Keep everything in one file** for as long as possible:

- `app-standalone.js` — Complete application in 785 lines
- Zero configuration, runs immediately with `node app-standalone.js`
- Perfect for prototyping, learning, and MVP deployment
- All logic visible and auditable in one place

**When Stage 1 is sufficient:**

- Project under 1000 lines
- Single developer or small team
- Rapid iteration needed
- Demo or proof-of-concept
- Educational purpose

### Stage 2: Modular Structure (Optional)

Consider splitting only when **truly necessary**:

- Team grows beyond 3 developers
- Codebase exceeds 1500 lines
- Need for isolated testing
- Code reuse across multiple projects

**Minimal split approach:**

```app-standalone.js

(keep as working reference)
├── lib/auth.js    (only if reused elsewhere)
├── lib/socket.js  (only if complex logic)
└── config.js      (only if multi-environment)
```

### Stage 3: Production Infrastructure (As Needed)

The sections on CI/CD, security, logging, database, and tests are **reference material**, not requirements. Implement only what you need:

- **Most projects need:** Environment variables, basic logging
- **Growing projects need:** Database persistence, authentication security
- **Team projects need:** CI/CD, automated tests
- **Enterprise projects need:** Full separation, monitoring, scaling infrastructure

### Golden Rule: Resist Premature Optimization

> "The best code is no code. The second best is self-contained code. Split only when the pain of maintaining a single file exceeds the pain of managing multiple files."

**Signs you should stay self-contained:**

- ✅ Development is fast and productive
- ✅ You understand the entire codebase
- ✅ Changes are easy to make
- ✅ Deployment works reliably
- ✅ No merge conflicts

**Signs you should consider splitting:**

- ❌ Multiple developers editing same file constantly
- ❌ Test suite is too slow or non-existent
- ❌ Can't find code you need to modify
- ❌ Deployment failures are common
- ❌ Security vulnerabilities from outdated patterns

---

## Final Notes

**This file is your roadmap, not your prison.** Use the self-contained approach for as long as it serves you. The production patterns documented here are available when needed, but they're optional evolution paths, not mandatory milestones.

**Start simple. Evolve when necessary. Never split prematurely.**
