# Architecture: Combined Approach

## Overview

The Chatroom uses a **combined architecture** where development happens at the root level, with optional package exports for distribution.

## Structure

```
The-Chatroom/
├── api/                    # Primary API implementation
│   ├── server.js          # Express app entry point
│   ├── lib/               # Core libraries (JWT, crypto, Prisma)
│   ├── middleware/        # Express middleware
│   ├── routes/            # API route handlers
│   ├── services/          # Background jobs
│   └── utils/             # Utilities & logging
│
├── socket/                # Primary WebSocket implementation
│   ├── socket-server.js   # Socket.IO entry point
│   └── lib/               # Socket utilities
│
├── web/                   # Primary Frontend (Next.js)
│   ├── app/               # App Router
│   ├── components/        # React components
│   ├── lib/               # Frontend utilities
│   └── styles/            # CSS & Tailwind
│
├── shared/                # Shared types & utilities
│   ├── schemas/           # JSON schemas
│   ├── types/             # TypeScript types
│   └── utils/             # Shared functions
│
├── packages/              # Optional workspace packages (secondary)
│   ├── api/               # References root/api/
│   ├── socket/            # References root/socket/
│   ├── web/               # References root/web/
│   └── shared/            # References root/shared/
│
└── package.json           # Root workspace config
```

## Development

**Primary approach:** Work directly in root-level folders

```bash
# Develop locally
npm run dev:api       # root/api/server.js
npm run dev:socket    # root/socket/socket-server.js
npm run dev:web       # root/web/ (Next.js)
```

## Deployment

**Optional package exports:** Use `packages/` for distribution

```bash
# Publish individual packages
npm publish -w @chatroom/api
npm publish -w @chatroom/socket
npm publish -w @chatroom/web
npm publish -w @chatroom/shared
```

## Key Rules

1. **Source of Truth:** Root-level folders (`api/`, `socket/`, `web/`, `shared/`)
2. **No Duplication:** `packages/` references root code, not copies
3. **Single Entry Points:** One `server.js` per service
4. **Shared Code:** `shared/` folder for types and utilities used across all services

## Git Strategy

- **Track root code:** Commit changes in `api/`, `socket/`, `web/`, `shared/`
- **Track packages config:** Commit `packages/*/package.json`, `packages/*/README.md`
- **Ignore node_modules:** Both root and packages have .gitignore

## Evolution

- **MVP Phase:** Use root structure only (self-contained)
- **Growth Phase:** Mirror code to `packages/` for distribution
- **Scale Phase:** Consider monorepo managers (yarn workspaces, pnpm, nx)

---

**Last Updated:** December 29, 2025
