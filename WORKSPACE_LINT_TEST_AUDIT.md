# Workspace Lint & Test Audit

## Objective
Establish a consistent, noninteractive lint/test strategy across workspaces under Node 26, without masking missing coverage using blanket `--passWithNoTests`.

## Lint Strategy (Implemented)
- Root baseline config added: `.eslintrc.cjs`.
- Web workspace uses Next-compatible lint config:
  - `packages/web/.eslintrc.json` with `next/core-web-vitals`.
  - `packages/web/package.json` lint script: `next lint --no-cache` (noninteractive).
- Non-web workspaces use explicit `eslint .` scripts where applicable.

## Test Strategy (Implemented)
- Added explicit workspace-test orchestrator:
  - `scripts/run-workspace-jest.js`
  - Behavior:
    - Runs workspace test script if test files exist.
    - Explicitly logs skip when no test files exist.
    - Avoids blanket global pass-through flags.
- Added shared unit coverage:
  - `packages/shared/src/utils/utils.test.ts`
- Added targeted security/behavior regressions:
  - `packages/web/src/components/chat/Block.test.tsx` (guest auth path + CSRF endpoint assertions)
  - `scripts/csrf-marketplace-regression.js`

## Workspace Classification (A/B/C/D)

| Workspace | Classification | Reason | Current Handling |
|---|---|---|---|
| `@chatroom/web` | **A** | Has tests and they execute | Vitest + targeted auth/CSRF coverage |
| `@chatroom/shared` | **A** | Has tests and they execute | Vitest utility tests |
| `@chatroom/api` | **B** | No local test files in package scope | Lint/build enforced; covered partially by root socket/CSRF scripts |
| `@chatroom/socket` | **B** | No local test files in package scope | Lint/build + root socket regression |
| `@chatroom/admin` | **B** | No local test files in package scope | Lint/build only |
| `@chatroom/analytics` | **B** | No local test files in package scope | Explicit skip via workspace test runner |
| `@chatroom/cli` | **B** | No local test files in package scope | Explicit skip via workspace test runner |
| `@chatroom/email` | **B** | No local test files in package scope | Explicit skip via workspace test runner |
| `@chatroom/mobile` | **B** | No local test files in package scope | Explicit skip via workspace test runner |

> No workspace was classified as **C** after remediation (no broken discovery remained).  
> No mandatory **D** suite was introduced in this iteration; critical auth/socket/CSRF/marketplace checks were added at root/web levels.

## Commands Used for Lint/Test Validation
- `npm run lint` ✅
- `npm run lint --workspaces --if-present` ✅
- `npm test --workspaces --if-present` ✅
- `npm run test:csrf-marketplace` ✅
- `npm run test:socket-regression` ✅

## Remaining Risks
- Several workspaces still have no direct package-local tests; coverage relies on integration/regression checks and neighboring layers.
- Workspace test priorities should focus next on `api` and `socket` (security/auth/chat-critical runtime code paths), followed by `mobile` (client auth/session transport).
