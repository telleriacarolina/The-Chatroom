# The Chatroom - Complete Codebase Documentation

This document contains all the source code from The Chatroom project organized by category.

## Table of Contents
- [Server Files](#server-files)
- [API Routes](#api-routes)
- [Library Utilities](#library-utilities)
- [Middleware](#middleware)
- [Services](#services)
- [Utilities](#utilities)
- [Frontend Components](#frontend-components)
- [Pages](#pages)
- [Database Schema](#database-schema)
- [Client Scripts](#client-scripts)
- [Configuration](#configuration)

---

## Server Files

### packages/api/src/server.js
Main Express API server (port 3001)

```javascript
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const { startBackgroundJobs } = require('../services/backgroundJobs');
const authRoutes = require('../routes/auth');
const logger = require('../utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
  startBackgroundJobs();
});

module.exports = app;
```

### packages/socket/src/socket-server.js
Socket.IO real-time messaging server (port 3002)

```javascript
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const logger = require('../utils/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

app.use(express.static(path.join(__dirname, '../public')));

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on('chat message', (msg) => {
    logger.debug(`Chat message: ${msg}`);
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.SOCKET_PORT || 3002;
server.listen(PORT, () => {
  logger.info(`Socket.IO server running on http://localhost:${PORT}`);
});

module.exports = server;
```

---

## API Routes

### packages/api/src/routes/auth.js
Authentication routes (signup, signin, guest, refresh, logout, change password)

```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { signAccess, signRefresh, verifyRefresh } = require('../lib/jwt');
const { prisma } = require('../lib/prisma');
const { encryptPhone } = require('../lib/crypto');
const { generateCSRFToken } = require('../utils/security');
const { authLimiter } = require('../middleware/rateLimiter');

function setCookie(res, name, value, opts = {}) {
  const options = { httpOnly: !!opts.httpOnly, path: '/', maxAge: opts.maxAge || 0 };
  if (!options.httpOnly) {
    res.cookie(name, value, { maxAge: options.maxAge });
  } else {
    res.cookie(name, value, { httpOnly: true, maxAge: options.maxAge });
  }
}

router.post('/csrf', (req, res) => {
  const token = generateCSRFToken();
  // double-submit: set cookie and return token
  res.cookie('csrfToken', token, { maxAge: 24 * 60 * 60 * 1000 });
  res.json({ csrfToken: token });
});

router.post('/signup', authLimiter, async (req, res) => {
  const { phoneNumber, firstName, lastName, birthYear } = req.body || {};
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber required' });
  try {
    const encryptedPhone = encryptPhone(phoneNumber);
    const existing = await prisma.user.findUnique({ where: { phoneNumber: encryptedPhone } });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const defaultPassword = `${(firstName||'User').slice(0,3)}${birthYear||'2000'}${(lastName||'').slice(0,3)}!`;
    const passwordHash = bcrypt.hashSync(defaultPassword, 12);

    const user = await prisma.user.create({ data: {
      phoneNumber: encryptedPhone,
      passwordHash,
      permanentUsername: encryptedPhone,
      accountType: 'REGISTERED'
    }});

    // Note: Twilio send handled elsewhere if configured
    res.json({ message: 'Default password sent via SMS', userId: user.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/signin', authLimiter, async (req, res) => {
  const { phoneNumber, password, staySignedIn } = req.body || {};
  if (!phoneNumber || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const encryptedPhone = encryptPhone(phoneNumber);
    const user = await prisma.user.findUnique({ where: { phoneNumber: encryptedPhone } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = signAccess({ userId: user.id });
    const refreshToken = signRefresh({ userId: user.id });

    await prisma.session.create({ data: {
      userId: user.id,
      sessionToken: refreshToken,
      expiresAt: new Date(Date.now() + (staySignedIn ? 30*24*60*60*1000 : 24*60*60*1000))
    }});

    setCookie(res, 'accessToken', accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    setCookie(res, 'refreshToken', refreshToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });

    res.json({ ok: true, user: { id: user.id, phoneNumber: user.phoneNumber } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/guest', async (req, res) => {
  const { ageCategory } = req.body || {};
  const temporaryUsername = `guest_${Math.random().toString(36).slice(2,8)}`;
  const token = require('uuid').v4();
  try {
    const temp = await prisma.tempSession.create({ data: {
      temporaryUsername,
      ageCategory: ageCategory === '18+RED' ? '_18PLUS_RED' : '_18PLUS',
      sessionToken: token,
      expiresAt: new Date(Date.now() + 24*60*60*1000)
    }});
    res.json({ tempSessionToken: token, guestId: temp.id, expiresAt: temp.expiresAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/change-password', authLimiter, async (req, res) => {
  const { phoneNumber, currentPassword, newPassword } = req.body || {};
  if (!phoneNumber || !currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });
  try {
    const encryptedPhone = encryptPhone(phoneNumber);
    const user = await prisma.user.findUnique({ where: { phoneNumber: encryptedPhone } });
    if (!user || !user.passwordHash) return res.status(404).json({ error: 'User not found' });
    const ok = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    const newHash = bcrypt.hashSync(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
    await prisma.session.updateMany({ where: { userId: user.id }, data: { isActive: false } }).catch(() => {});
    res.json({ ok: true, message: 'Password changed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refresh = req.cookies?.refreshToken;
    if (!refresh) return res.status(401).json({ error: 'No refresh token' });
    const payload = verifyRefresh(refresh);
    const userId = payload.userId;
    const session = await prisma.session.findUnique({ where: { sessionToken: refresh } });
    if (!session || !session.isActive) return res.status(401).json({ error: 'Invalid session' });
    const accessToken = signAccess({ userId });
    setCookie(res, 'accessToken', accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    res.json({ accessToken });
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const refresh = req.cookies?.refreshToken;
    if (refresh) await prisma.session.updateMany({ where: { sessionToken: refresh }, data: { isActive: false } }).catch(() => {});
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
```

---

## Library Utilities

### packages/api/src/lib/jwt.ts
JWT token generation and verification

```typescript
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret';

export function signAccess(payload: object) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

export function signRefresh(payload: object) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyAccess(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, REFRESH_SECRET);
}
```

### packages/api/src/lib/crypto.js
Phone number encryption using AES-256-GCM

```javascript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.PHONE_ENC_KEY || process.env.ENCRYPTION_KEY || 'dev_key_32_byte_length_needed_!';

function getKey() {
  // ensure 32 bytes
  return crypto.createHash('sha256').update(String(KEY)).digest();
}

export function encryptPhone(plaintext) {
  if (!plaintext) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptPhone(payload) {
  if (!payload) return null;
  const [ivB, tagB, dataB] = String(payload).split(':');
  if (!ivB || !tagB || !dataB) return null;
  const iv = Buffer.from(ivB, 'base64');
  const tag = Buffer.from(tagB, 'base64');
  const data = Buffer.from(dataB, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}
```

### packages/api/src/lib/prisma.ts
Prisma ORM client initialization

```typescript
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
```

### packages/api/src/lib/twilio.ts
Twilio SMS integration

```typescript
import Twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

let client: Twilio.Twilio | null = null;
if (accountSid && authToken) {
  client = Twilio(accountSid, authToken);
}

export async function sendSms(to: string, body: string) {
  if (!client || !fromNumber) {
    console.warn('Twilio not configured; SMS not sent', { to, body });
    return null;
  }

  return client.messages.create({ to, from: fromNumber, body });
}

export default sendSms;
```

### packages/web/src/lib/utils.ts
Utility functions for className merging

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Middleware

### packages/api/src/middleware/rateLimiter.js
Rate limiting middleware with Redis fallback

```javascript
const rateLimit = require('express-rate-limit');
let RedisStore;
try {
  RedisStore = require('rate-limit-redis');
} catch (e) {
  RedisStore = null;
}
let redisClient;
try {
  redisClient = require('../config/redis');
} catch (e) {
  redisClient = null;
}

function createStore(prefix) {
  if (RedisStore && redisClient) {
    return new RedisStore({ client: redisClient, prefix });
  }
  return undefined; // fallback to memory store
}

const authLimiter = rateLimit({
  store: createStore('rl:auth:'),
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  store: createStore('rl:api:'),
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Too many requests. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false
});

const heartbeatLimiter = rateLimit({
  store: createStore('rl:heartbeat:'),
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: 'Heartbeat rate exceeded.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  apiLimiter,
  heartbeatLimiter
};
```

### packages/api/src/middleware/csrf.js
CSRF protection middleware (double-submit pattern)

```javascript
const { validateCSRFToken } = require('../utils/security');

function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const token = req.headers['x-csrf-token'] || req.headers['x-csrf'] || req.body?.csrfToken;
  const sessionToken = req.cookies?.csrfToken || req.session?.csrfToken;

  if (!token || !sessionToken) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  try {
    if (!validateCSRFToken(token, sessionToken)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'CSRF validation failed' });
  }
}

module.exports = csrfProtection;
```

---

## Services

### packages/api/src/services/backgroundJobs.js
Background tasks for session cleanup and user presence management

```javascript
import { prisma } from '@/lib/prisma';
import logger from '@/utils/logger';

/** Transition users from Online -> Away after 5 minutes inactivity */
export async function transitionInactiveUsers() {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = await prisma.user.updateMany({
      where: { isOnline: true, lastSeenAt: { lt: fiveMinAgo } },
      data: { isOnline: false }
    });
    if (result.count > 0) logger.info(`Transitioned ${result.count} users to AWAY`);
  } catch (e) {
    logger.error('Error transitioning inactive users', e);
  }
}

/** Clean up expired sessions and temp sessions */
export async function cleanupExpiredSessions() {
  try {
    const refresh = await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const temp = await prisma.tempSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    logger.info(`Cleaned ${refresh.count} sessions and ${temp.count} temp sessions`);
  } catch (e) {
    logger.error('Error cleaning expired sessions', e);
  }
}

/** Transition users to OFFLINE if no heartbeat in 10 minutes */
export async function transitionOfflineUsers() {
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const result = await prisma.user.updateMany({
      where: { lastSeenAt: { lt: tenMinAgo } },
      data: { isOnline: false }
    });
    if (result.count > 0) logger.info(`Transitioned ${result.count} users to OFFLINE`);
  } catch (e) {
    logger.error('Error transitioning offline users', e);
  }
}

export function startBackgroundJobs() {
  logger.info('Starting background jobs...');
  setInterval(transitionInactiveUsers, 60 * 1000);
  setInterval(cleanupExpiredSessions, 15 * 60 * 1000);
  setInterval(transitionOfflineUsers, 5 * 60 * 1000);
  // run once
  transitionInactiveUsers();
  cleanupExpiredSessions();
  transitionOfflineUsers();
  logger.info('Background jobs started');
}

export default { startBackgroundJobs };
```

---

## Utilities

### packages/api/src/utils/logger.js
Simple console logger utility

```javascript
const isDev = process.env.NODE_ENV !== 'production';
export default {
  info: (...args) => console.log('[info]', ...args),
  warn: (...args) => console.warn('[warn]', ...args),
  error: (...args) => console.error('[error]', ...args)
};
```

### packages/api/src/utils/security.js
Security utilities (CSRF token generation/validation, encryption wrappers)

```javascript
const { encryptPhone, decryptPhone } = require('../lib/crypto');

const crypto = require('crypto');

function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

function validateCSRFToken(token, sessionToken) {
  if (!token || !sessionToken) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken)
    );
  } catch (e) {
    return false;
  }
}

module.exports = {
  encrypt: encryptPhone,
  decrypt: decryptPhone,
  generateCSRFToken,
  validateCSRFToken
};
```

---

## Frontend Components

### packages/web/src/pages/index.tsx
Next.js homepage (App Router)

```tsx
import Block from "@/components/chat/Block";

export default function Home() {
  return (
    <main>
      <Block />
    </main>
  );
}
```

### packages/web/src/components/chat/Block.tsx
Main chat UI component (username creation, language/lounge selection, waiting room)

*Note: This is a large component (662 lines). Below is the beginning section. The full file contains:*
- Username creation flow
- Language category selection (8 languages)
- Lounge selection with scrolling interface
- Guest waiting room with priority messaging
- Marketplace integration
- Member count display
- Form validation

```tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Crown, Eye, UserCircle, Users, MessageSquare, Globe, ChevronRight, ChevronLeft, Clock, Loader2, DollarSign, Lock, ShoppingCart, Zap, Package, Video, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Types for language and lounge
type Lounge = {
  id: string;
  name: string;
  members: number;
  isAll?: boolean;
};
type LanguageCategory = {
  name: string;
  flag: string;
  lounges: Lounge[];
};

export default function Block() {
  const [username, setUsername] = useState<string>("");
  const [tempUsername, setTempUsername] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedLounge, setSelectedLounge] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [waitProgress, setWaitProgress] = useState<number>(0);

  // ... (continues for 662 lines with full chat UI implementation)
}
```

---

## Client Scripts

### public/client.js
Simple Socket.IO client for testing

```javascript
const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

socket.on('chat message', (msg) => {
  const item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});
```

---

## Database Schema

### prisma/schema.prisma
Complete Prisma database schema (PostgreSQL)

**Enums:**
- AccountType (REGISTERED, GUEST)
- AccountStatus (ACTIVE, SUSPENDED, BANNED, DELETED)
- VerificationType (AGE_ONLY, ID_FULL)
- VerificationStatus (PENDING, APPROVED, REJECTED, EXPIRED)
- AgeCategory (_18PLUS, _18PLUS_RED)
- MessageType (TEXT, IMAGE, VIDEO, LINK, SYSTEM)
- ModerationStatus (APPROVED, PENDING, REMOVED)
- Currency (USD, EUR, GBP)
- ItemCategory (PHOTOS, VIDEOS, CUSTOM_CONTENT, SERVICES, OTHER)
- ContentType (SFW, NSFW)
- AccessLevel (MAIN_LOUNGE, RED_LOUNGE)
- TransactionPaymentMethod (STRIPE, PAYPAL, CRYPTO)
- TransactionPaymentStatus (PENDING, COMPLETED, FAILED, REFUNDED)
- ModerationActionType (WARNING, MUTE, KICK, BAN_TEMP, BAN_PERMANENT, MESSAGE_DELETE, ITEM_REMOVE)
- ReportReason (SPAM, HARASSMENT, INAPPROPRIATE_CONTENT, UNDERAGE, SCAM, OTHER)

**Models:**
- User (auth, profile, verification status)
- Session (JWT sessions with expiry)
- TempSession (guest sessions)
- IDVerification (age/ID verification records)
- Lounge (chat rooms)
- LanguageRoom (language-specific rooms)
- ChatMessage (messages with moderation)
- MarketplaceItem (user-generated content sales)
- Transaction (payment records)
- ModerationAction (mod actions log)
- UserReport (user reporting system)
- AuditLog (system events)

```prisma
// Full schema available in prisma/schema.prisma (see previous read_file output)
```

---

## Configuration

### package.json
Project dependencies and scripts

```json
{
  "name": "the-chatroom",
  "version": "0.1.0",
  "private": true,
  "main": "server/server.js",
  "scripts": {
    "start": "node server/server.js",
    "dev": "nodemon server/server.js",
    "dev:debug": "nodemon --inspect server/server.js",
    "socket:dev": "nodemon server/socket-server.js",
    "next:dev": "next dev",
    "next:build": "next build",
    "next:start": "next start",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name init"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.264.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "uuid": "^9.0.0",
    "cookie": "^0.6.1",
    "twilio": "^4.18.0",
    "prisma": "^5.11.0",
    "@prisma/client": "^5.11.0"
  },
  "optionalDependencies": {
    "@aws-sdk/client-s3": "^3.450.0",
    "@aws-sdk/s3-request-presigner": "^3.450.0",
    "@vladmandic/face-api": "^1.7.12",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.0",
    "tesseract.js": "^5.0.3",
    "node-cron": "^3.0.3"
  }
}
```

### tsconfig.json
TypeScript configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### jsconfig.json
JavaScript configuration for path aliases

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"],
      "@/utils/*": ["utils/*"]
    }
  }
}
```

---

## Architecture Overview

### Project Structure

**📦 Monorepo Organization:** This project uses npm workspaces with separate packages for API, Socket.IO, frontend, and shared code.

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

### Technology Stack
- **Backend:** Node.js, Express, Socket.IO
- **Frontend:** Next.js 14, React 18, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (access + refresh tokens)
- **Security:** bcrypt, AES-256-GCM encryption, CSRF protection, rate limiting
- **Real-time:** Socket.IO for WebSocket communication
- **SMS:** Twilio integration
- **UI:** Tailwind CSS, shadcn/ui components, Lucide icons
- **Monorepo:** npm workspaces with @chatroom/* scoped packages

### Key Features
1. **Multi-tier Authentication**
   - Guest sessions (temporary)
   - Phone number registration
   - Password management
   - JWT-based sessions

2. **Real-time Chat**
   - Language-based rooms (8 languages)
   - Country-specific lounges
   - WebSocket messaging
   - Presence tracking

3. **Marketplace**
   - User-generated content sales
   - Transaction management
   - Payment processing integration

4. **Moderation System**
   - User reporting
   - Moderation actions
   - Content flags
   - Audit logging

5. **Verification System**
   - Age verification
   - ID verification
   - Document upload
   - Retention policies

---

## Environment Variables

Required environment variables for running the application:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chatroom"

# JWT Secrets
ACCESS_TOKEN_SECRET="your-access-secret-here"
REFRESH_TOKEN_SECRET="your-refresh-secret-here"

# Encryption
PHONE_ENC_KEY="your-32-byte-encryption-key-here"
ENCRYPTION_KEY="fallback-encryption-key"

# Twilio (optional)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_FROM_NUMBER="+1234567890"

# Server Configuration
PORT=3001
SOCKET_PORT=3002
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Initialize database:**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. **Run development servers:**
   ```bash
   # Terminal 1: API server
   npm run dev:api

   # Terminal 2: Socket.IO server
   npm run dev:socket

   # Terminal 3: Next.js frontend
   npm run dev:web
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - WebSocket: http://localhost:3002
   - Database: postgresql://localhost:5432

---

*Last updated: December 28, 2025*
*This document was auto-generated and contains the complete codebase of The Chatroom project.*
