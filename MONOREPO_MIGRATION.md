# Monorepo Migration Guide

This guide will help you reorganize The Chatroom into a monorepo structure with npm workspaces.

## Structure Overview

```
The-Chatroom/
├── packages/
│   ├── api/              # Backend REST API
│   ├── socket/           # WebSocket server
│   ├── web/              # Next.js frontend
│   └── shared/           # Shared types and utilities
├── docs/                 # Documentation (kept at root)
├── package.json          # Root workspace configuration
└── README.md
```

## Step-by-Step Migration

### 1. Move API Files (packages/api)

```bash
# Create directory structure
mkdir -p packages/api/src/{routes,middleware,services,utils,lib}

# Move server files
cp server/server.js packages/api/src/server.js

# Move API-related directories
cp -r routes packages/api/src/
cp -r middleware packages/api/src/
cp -r services packages/api/src/
cp -r utils packages/api/src/

# Move API lib files
cp lib/jwt.ts packages/api/src/lib/
cp lib/crypto.js packages/api/src/lib/
cp lib/twilio.ts packages/api/src/lib/
cp lib/prisma.ts packages/api/src/lib/

# Move database files
cp -r prisma packages/api/
cp -r migrations packages/api/

# Copy environment example
cp .env.example packages/api/.env.example
```

### 2. Move Socket.IO Files (packages/socket)

```bash
# Create directory structure
mkdir -p packages/socket/src/lib

# Move socket server
cp server/socket-server.js packages/socket/src/socket-server.js

# Move logger utility
cp utils/logger.js packages/socket/src/lib/

# Move client test files
cp -r public packages/socket/

# Copy environment example
cp .env.example packages/socket/.env.example
```

### 3. Move Frontend Files (packages/web)

```bash
# Move Next.js directories
cp -r components packages/web/src/
cp -r pages packages/web/src/
cp -r app packages/web/src/
cp -r styles packages/web/src/
cp -r public packages/web/

# Move Next.js config files
cp next.config.js packages/web/ 2>/dev/null || true
cp tailwind.config.js packages/web/ 2>/dev/null || true
cp postcss.config.js packages/web/ 2>/dev/null || true
cp tsconfig.json packages/web/
cp jsconfig.json packages/web/

# Copy environment example
cp .env.example packages/web/.env.local.example
```

### 4. Move Shared Files (packages/shared)

```bash
# Create directory structure
mkdir -p packages/shared/src/{types,schemas,utils}

# Move shared types
cp -r types/* packages/shared/src/types/

# Move JSON schemas
cp -r schemas/* packages/shared/src/schemas/

# Move shared utilities
cp lib/utils.ts packages/shared/src/utils/
cp lib/middleware.js packages/shared/src/utils/

# Create index file for exports
cat > packages/shared/src/index.ts << 'EOF'
export * from './types';
export * from './schemas';
export * from './utils';
EOF
```

### 5. Install Dependencies

```bash
# Remove old node_modules
rm -rf node_modules

# Install all workspace dependencies
npm install
```

### 6. Update Import Paths

**In packages/api files:**
- Change `@/lib/*` to `./lib/*` or `../lib/*`
- Change `@/utils/*` to `./utils/*`
- Shared types: `import { User } from '@chatroom/shared/types'`

**In packages/web files:**
- Keep `@/components/*` pattern
- Update Next.js path aliases in tsconfig.json/jsconfig.json
- Shared types: `import { User } from '@chatroom/shared/types'`

**Example updates needed in packages/api/src/server.js:**
```javascript
// Old
const authRoutes = require('../routes/auth');
const { startBackgroundJobs } = require('../services/backgroundJobs');

// New
const authRoutes = require('./routes/auth');
const { startBackgroundJobs } = require('./services/backgroundJobs');
```

**Example updates in packages/web/src/components/chat/Block.tsx:**
```typescript
// Paths stay the same due to tsconfig/jsconfig configuration
import { Button } from "@/components/ui/button";
import { User } from "@chatroom/shared/types";
```

### 7. Update Configuration Files

**packages/web/tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"]
    }
  }
}
```

**packages/api/.env.example:**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/chatroom"

# JWT Secrets
ACCESS_TOKEN_SECRET="your-access-secret"
REFRESH_TOKEN_SECRET="your-refresh-secret"

# Server
PORT=3001
NODE_ENV="development"
```

**packages/socket/.env.example:**
```bash
SOCKET_PORT=3002
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

**packages/web/.env.local.example:**
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3002"
```

## Running the Monorepo

### Development Mode

```bash
# Run all services
npm run dev

# Or run individually
npm run dev:api      # API server on :3001
npm run dev:socket   # Socket.IO on :3002
npm run dev:web      # Next.js on :3000
```

### Production Build

```bash
# Build all packages
npm run build

# Build web only
npm run build:web
```

### Starting Production

```bash
# Start all services
npm run start

# Or start individually
npm run start:api
npm run start:socket
npm run start:web
```

## Database Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

## Clean Up Old Structure (AFTER MIGRATION IS COMPLETE AND TESTED)

```bash
# CAREFUL: Only run this after confirming everything works!
rm -rf server routes middleware services utils/logger.js utils/security.js
rm -rf components pages app styles lib
rm -rf prisma migrations schemas types
rm server.js socket-server.js
```

## Verification Checklist

- [ ] All packages install successfully: `npm install`
- [ ] API server starts: `npm run dev:api`
- [ ] Socket.IO server starts: `npm run dev:socket`
- [ ] Next.js builds: `npm run dev:web`
- [ ] Database migrations work: `npm run prisma:migrate`
- [ ] No import errors in any package
- [ ] All tests pass (if any exist)
- [ ] Environment variables are correctly split across packages

## Troubleshooting

**Error: Cannot find module '@chatroom/shared'**
- Run `npm install` from the root
- Ensure `packages/shared/package.json` exists
- Check that root `package.json` has `"workspaces": ["packages/*"]`

**Error: Prisma client not generated**
- Run `npm run prisma:generate` from root
- Check that `packages/api/prisma/schema.prisma` exists

**Error: Module not found (Next.js)**
- Check `packages/web/tsconfig.json` or `jsconfig.json` for correct path aliases
- Ensure `baseUrl` is set to `"./src"`

**CORS errors between frontend/backend**
- Update `packages/api/src/server.js` CORS configuration
- Check `FRONTEND_URL` in socket server environment

## Benefits of This Structure

✅ **Clear separation of concerns** - Frontend, backend, and socket services are independent
✅ **Shared code** - Types and utilities in one place, no duplication
✅ **Independent deployments** - Each package can be deployed separately
✅ **Better dependency management** - Only install what each package needs
✅ **Scalable** - Easy to add new packages (admin panel, mobile API, etc.)

## Next Steps

1. Follow the migration steps above
2. Test each service independently
3. Update CI/CD pipelines to build/deploy from packages
4. Consider containerizing each package with Docker
5. Update deployment documentation

---

**Need help?** Check the workspace-specific README files in each package directory.
