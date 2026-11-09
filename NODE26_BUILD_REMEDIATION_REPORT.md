# NODE 26 Build Remediation Report

## Objective

Resolve Node 26 compatibility failures that blocked reproducible builds across root, web, and socket paths.

## Root Causes Identified

1. **`packages/web/src/components/chat/Block.tsx` partial refactor**
   - Missing imports/state/functions (`ConnectionStatus`, guest token setter, API call integration).
   - Simulated guest session logic still present instead of real `/api/auth/guest` call.
2. **`packages/web/src/components/ui/button.jsx` runtime defect**
   - `disabled` was referenced without declaration, causing Next prerender `ReferenceError`.
3. **`packages/web/vite.config.ts` typing mismatch**
   - `defineConfig` imported from `vite` while using `test` block intended for Vitest typing.
4. **Workspace lint strategy was non-portable/noninteractive-incomplete**
   - Missing baseline ESLint config for several workspaces.
   - Web lint setup needed explicit Next-compatible config.

## Changes Applied

- `packages/web/src/components/chat/Block.tsx`
  - Wired guest flow to `createGuestSession("PLUS_18")`.
  - Persisted/restored `guestUsername` + `guestToken`.
  - Synced socket auth token via `setAuthToken(...)`.
  - Removed incomplete real-time count wiring that referenced undefined state/symbols.
- `packages/web/src/components/ui/button.jsx`
  - Added `disabled = false` prop default and passed through explicitly.
- `packages/web/vite.config.ts`
  - Switched to `import { defineConfig } from "vitest/config"`.
- `packages/web/tsconfig.json`
  - Removed duplicate `types` keys that could produce ambiguous TS behavior.
- `packages/web/src/components/auth/LoginForm.tsx`
  - Fixed unescaped apostrophe for Next lint error (`Don&apos;t`).
- Workspace lint/test/script stabilization
  - Added root ESLint config: `.eslintrc.cjs`.
  - Added `scripts/run-workspace-jest.js` for explicit skip-or-run behavior.
  - Added/updated workspace scripts in package manifests for lint/test consistency.
  - Added Next ESLint support dependency in `packages/web`: `eslint-config-next@14.2.35`.

## Files Changed (Build-Relevant)

- `package.json`
- `package-lock.json`
- `.eslintrc.cjs`
- `packages/web/package.json`
- `packages/web/.eslintrc.json`
- `packages/web/vite.config.ts`
- `packages/web/tsconfig.json`
- `packages/web/src/components/chat/Block.tsx`
- `packages/web/src/components/ui/button.jsx`
- `packages/web/src/components/auth/LoginForm.tsx`
- `packages/web/src/components/auth/SignupForm.tsx`
- `packages/web/src/hooks/useAsync.ts`
- `packages/web/src/hooks/useSocket.ts`
- `packages/web/src/lib/socket.ts`
- `scripts/run-workspace-jest.js`

## Security Implications

- **Improved**: guest auth now uses actual backend endpoint (`/api/auth/guest`) instead of simulated local success.
- **No security downgrades introduced**: no token bypasses, no auth middleware removal, no weakened checks.

## Regression Risks

- `Block.tsx` now depends on backend guest endpoint availability; if API is unavailable, guest flow surfaces explicit error.
- Web lint now uses Next rules; no remaining lint warnings were observed in the final validation run.

## Validation Executed

- `npm ci` ✅
- `npm run build` ✅
- `npm run build -w @chatroom/api` ✅
- `npm run build -w @chatroom/web` ✅
- `npm run build -w @chatroom/socket` ✅
- `npm run typecheck:web` ✅

## Deployment / Preview Validation Status

- No successful Vercel preview deployment was produced or verified in this execution environment.
- This project requires external Vercel access and deployment credentials to validate a preview deployment; local Node 26 build success does not prove preview health.
- The repo therefore documents deployment status as externally unverified rather than claiming a successful Vercel preview.

## Remaining Build-Adjacent Issues

- No remaining web lint warnings after hook dependency and default-export cleanup in:
  - `packages/web/src/components/auth/SignupForm.tsx`
  - `packages/web/src/hooks/useAsync.ts`
  - `packages/web/src/hooks/useSocket.ts`
  - `packages/web/src/lib/socket.ts`
