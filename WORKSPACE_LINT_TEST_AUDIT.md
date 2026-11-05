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

## Direct-Coverage Follow-Up Disposition
The audit does not treat the remaining direct-workspace gaps as complete coverage. Instead, they are tracked as explicit follow-up issues with the following scope and acceptance criteria.

### 1) API auth/session coverage
- Scope: direct tests for authentication, guest session issuance, token validation, and session recovery in `@chatroom/api`.
- Acceptance criteria: create/restore/expire guest sessions and validate CSRF/auth middleware boundaries without reliance on web-layer helpers.
- Security/regression risks: stale session reuse, token leakage, invalid session acceptance, and CSRF bypass.
- Dependencies: API route execution, Prisma or test DB, auth middleware fixtures.
- Priority: P1, because auth/session flows are critical to the app.

### 2) Socket real-time transport coverage
- Scope: direct tests for connection lifecycle, room membership, auth handshake, and protocol validation in `@chatroom/socket`.
- Acceptance criteria: verify socket authentication and message handling under valid/invalid session tokens and protocol mismatches.
- Security/regression risks: unauthorized room access, stale socket auth, message spoofing, and protocol drift.
- Dependencies: socket server harness, auth token fixtures, protocol contract checks.
- Priority: P1, because live chat and presence depend on this layer.

### 3) Mobile auth/session transport coverage
- Scope: direct tests for session persistence and auth state transitions in `@chatroom/mobile`.
- Acceptance criteria: verify persistent login state, guest restoration, and transport errors across app lifecycle events.
- Security/regression risks: stale auth cache, session restoration from compromised storage, and duplicate guest sessions.
- Dependencies: mobile test runner, local storage/session mocks, auth state fixtures.
- Priority: P2, because the mobile path is important but less central than API/socket core flows.

These follow-ups are intentionally documented as queued work rather than hidden gaps, so the current validation remains accurate while future direct coverage is clearly scoped.
