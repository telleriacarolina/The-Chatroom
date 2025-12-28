# The Chatroom - Application Structure

Complete monorepo setup with all applications configured and ready to run.

## 📦 Packages Overview

### 1. **@chatroom/web** - Frontend Application
**Location:** `packages/web/`
**Tech:** Next.js 14, React 18, TypeScript, Tailwind CSS

#### Structure:
```
packages/web/src/
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   └── page.tsx         # Homepage
├── components/
│   ├── chat/
│   │   └── Block.tsx    # Main chat flow (462 lines)
│   └── ui/              # shadcn/ui components
│       ├── button.jsx
│       ├── input.jsx
│       ├── card.jsx
│       ├── badge.tsx
│       ├── label.jsx
│       ├── dialog.tsx
│       ├── radio-group.tsx
│       ├── tabs.tsx
│       ├── alert.jsx
│       ├── checkbox.jsx
│       └── progress.tsx
├── lib/
│   └── utils.ts         # Utility functions
└── styles/
    └── globals.css      # Global styles
```

#### Features:
- **Username Entry Screen**: 4-10 character validation
- **Language Selection**: 8 categories (English, Spanish, French, German, Japanese, Chinese, Portuguese, Arabic)
- **Lounge Selection**: All Users Lounge + country-specific rooms
- **Upgrade Prompts**: Creator/Viewer/Guest comparison cards

#### Run:
```bash
npm run dev:web
```

---

### 2. **@chatroom/api** - Backend API
**Location:** `packages/api/`
**Tech:** Express.js, Prisma, PostgreSQL

#### Structure:
```
packages/api/src/
├── server.js            # Express API server
├── routes/
│   └── auth.js          # Authentication routes
├── lib/
│   ├── jwt.ts           # JWT utilities
│   ├── crypto.js        # Phone encryption
│   ├── prisma.ts        # Database client
│   └── twilio.ts        # SMS integration
├── middleware/
│   ├── rateLimiter.js   # Rate limiting
│   └── csrf.js          # CSRF protection
├── services/
│   └── backgroundJobs.js # Session cleanup
└── utils/
    ├── logger.js        # Logging
    └── security.js      # Security helpers
```

#### API Endpoints:
- `POST /api/auth/csrf` - Get CSRF token
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login
- `POST /api/auth/guest` - Create guest session
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password
- `GET /health` - Health check

#### Run:
```bash
npm run dev:api
```

---

### 3. **@chatroom/socket** - WebSocket Server
**Location:** `packages/socket/`
**Tech:** Socket.IO, Express.js

#### Structure:
```
packages/socket/src/
├── socket-server.js     # Socket.IO server
├── lib/                 # Socket utilities
└── public/              # Static files
```

#### Features:
- Real-time messaging
- Room management
- Presence tracking
- Connection handling

#### Run:
```bash
npm run dev:socket
```

---

### 4. **@chatroom/shared** - Shared Code
**Location:** `packages/shared/`
**Tech:** TypeScript

Shared types, schemas, and utilities used across all packages.

---

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Set Up Environment
Create `.env` files in each package:

**packages/api/.env:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/chatroom"
ACCESS_TOKEN_SECRET="your-access-secret"
REFRESH_TOKEN_SECRET="your-refresh-secret"
PHONE_ENC_KEY="32-byte-encryption-key"
PORT=3001
```

**packages/socket/.env:**
```env
SOCKET_PORT=3002
FRONTEND_URL="http://localhost:3000"
```

**packages/web/.env.local:**
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3002"
```

### Initialize Database
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Run All Applications
```bash
# Run all services simultaneously
npm run dev

# Or run individually:
npm run dev:api      # API server (http://localhost:3001)
npm run dev:socket   # Socket.IO (http://localhost:3002)
npm run dev:web      # Next.js (http://localhost:3000)
```

---

## 📊 Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser Client                       │
│                  (http://localhost:3000)                 │
└───────────────┬─────────────────────┬───────────────────┘
                │                     │
                │ HTTP/REST           │ WebSocket
                │                     │
         ┌──────▼──────┐       ┌─────▼─────┐
         │   API       │       │  Socket   │
         │   Server    │       │  Server   │
         │  :3001      │       │  :3002    │
         └──────┬──────┘       └───────────┘
                │
                │
         ┌──────▼──────┐
         │ PostgreSQL  │
         │  Database   │
         └─────────────┘
```

---

## 🎯 Current Implementation Status

### ✅ Completed
- [x] Monorepo structure with npm workspaces
- [x] Next.js App Router setup
- [x] Guest-only chat flow (username → language → lounge)
- [x] 8 language categories with country lounges
- [x] Upgrade feature cards (Creator/Viewer/Guest)
- [x] shadcn/ui component library
- [x] Express API with authentication routes
- [x] Socket.IO real-time server
- [x] Prisma database schema
- [x] JWT authentication
- [x] Rate limiting & CSRF protection
- [x] Phone number encryption
- [x] Background job services

### 🚧 In Progress
- [ ] Connect frontend to API/Socket servers
- [ ] Implement actual authentication flows
- [ ] Add real-time messaging
- [ ] Marketplace functionality
- [ ] Moderation system

### 📋 Planned
- [ ] Creator account features
- [ ] Viewer account features  
- [ ] Payment integration
- [ ] Video streaming
- [ ] Content monetization

---

## 📝 Development Commands

```bash
# Development
npm run dev              # Run all services
npm run dev:api          # API server only
npm run dev:socket       # Socket.IO only
npm run dev:web          # Frontend only

# Production
npm run build            # Build all packages
npm run build:web        # Build web only
npm run start            # Start all services
npm run start:api        # Start API only
npm run start:socket     # Start Socket.IO only
npm run start:web        # Start Next.js only

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations

# Utilities
npm run clean            # Clean all build artifacts
```

---

## 🔧 Troubleshooting

### Port Already in Use
If ports are in use, change them in the `.env` files:
- API: `PORT=3001`
- Socket: `SOCKET_PORT=3002`
- Web: Automatically uses `3000`, or next available

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `packages/api/.env`
3. Run `npm run prisma:generate`

### Module Not Found
Run `npm install` from the root directory to install all workspace dependencies.

---

## 📚 Documentation

- [API Documentation](packages/api/README.md)
- [Socket Server Documentation](packages/socket/README.md)
- [Web App Documentation](packages/web/README.md)
- [Shared Library Documentation](packages/shared/README.md)
- [Main README](README.md)

---

**Last Updated:** December 28, 2025
