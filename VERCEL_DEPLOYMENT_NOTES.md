# Vercel Deployment Fixes

## Changes Made

### 1. Fixed TypeScript Build Errors

**Problem**: Analytics, CLI, and Email packages failed to build with "Cannot find type definition file for 'react-native'" error.

**Solution**: Created `tsconfig.json` files for each package with proper Node.js configuration and no react-native type references.

### 2. Fixed Lucide React Icon Type Errors

**Problem**: `X` icon in dialog.tsx and `Circle` icon in radio-group.tsx caused TypeScript errors due to React type version mismatches.

**Solution**: Used `React.createElement()` with type casting (`as any`) to work around the lucide-react ForwardRefExoticComponent type incompatibility.

### 3. Fixed Web Package Type Conflicts

**Problem**: Web package TypeScript compilation picked up react-native types from mobile package in the monorepo.

**Solution**: Added `"types": []` to packages/web/tsconfig.json to prevent automatic type inclusion from parent node_modules.

### 4. Removed Duplicate API Routes from Web Package

**Problem**: Next.js API routes in packages/web/src/pages/api/* tried to import from API package libraries that don't exist in the web package, causing module resolution failures.

**Solution**: Removed the API routes directory since:

- The API server (packages/api) handles all authentication and backend logic on port 3001
- These routes couldn't function as serverless functions without the API server's dependencies
- The web frontend should communicate with the API server via HTTP, not through Next.js API routes

### 5. Configured Vercel Build

**Problem**: Vercel's default build command tried to build all workspace packages, including optional support packages.

**Solution**: Created vercel.json with explicit buildCommand to only build the web package: `npm run build:web`

## Build Verification

 Web package builds successfully:

Route (pages)                             Size     First Load JS
┌ ○ /                                     5.51 kB        85.4 kB
├   /_app                                 0 B            79.9 kB
└ ○ /404                                  180 B          80.1 kB
```
Route (pages)                             Size     First Load JS
┌ ○ /                                     5.51 kB        85.4 kB
├   /_app                                 0 B            79.9 kB
└ ○ /404                                  180 B          80.1 kB
```

## Files Removed

- packages/web/src/pages/api/auth/* (7 files)
- packages/web/src/pages/api/presence/* (2 files)

These API routes are handled by the API server on port 3001.
