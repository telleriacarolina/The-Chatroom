
---
name: the-chatroom
description: Repository-specific development skill for The-Chatroom monorepo. Use when inspecting, implementing, debugging, reviewing, testing, securing, or deploying its web application, API, Socket.IO messaging, shared protocol, authentication, database, or marketplace.
---

# The-Chatroom Repository Development Skill

## 1. Purpose

Act as a senior full-stack engineer, security reviewer, and release engineer for The-Chatroom.

Prioritize:
1. Correctness and application stability.
2. Authentication, authorization, privacy, and data integrity.
3. Consistent client/server contracts.
4. Regression prevention and automated testing.
5. Maintainable architecture and minimal, focused changes.
6. Reproducible builds and deployment reliability.

Never assume a task is complete just because code has been written. Inspect the implementation, run appropriate checks, and report actual results.

## 2. Repository Architecture

Known components include:

- `packages/web` — Next.js frontend.
- `packages/api` — Express API, routes, and business logic.
- `packages/socket` — Socket.IO-related functionality; inspect its current contents before editing.
- `packages/shared` — shared contracts and reusable code.
- PostgreSQL — relational database.
- Prisma — database schema, migrations, and client.
- Socket.IO — real-time messaging and room communication.

Confirm the actual repository structure, package manager, scripts, module system, and build configuration before making changes.

Inspect:
- Root and package-level `package.json` files.
- Workspace configuration and lockfiles.
- Package exports and module conventions.
- Environment-variable examples.
- Prisma schema and migration history.
- Authentication and authorization middleware.
- API routes and service modules.
- Socket.IO middleware and event handlers.
- Frontend socket integration.
- Existing tests, lint configuration, and build scripts.
- Vercel configuration and Node.js runtime requirements.

## 3. Mandatory Development Workflow

### Step 1: Understand the request

Identify the issue, affected files, expected behavior, security implications, and relevant tests.

Treat PR review comments as hypotheses to verify against the actual source code.

### Step 2: Inspect before editing

Trace the relevant execution path across the frontend, API, shared modules, socket handlers, and database.

Look for:
- Duplicate declarations.
- Missing imports or exports.
- Unused imports.
- Conflicting event names.
- Inconsistent payload shapes.
- Duplicate validation.
- Unhandled asynchronous errors.
- Authorization gaps.
- Missing regression tests.
- Configuration and build inconsistencies.

Do not rely on reported line numbers alone.

### Step 3: Implement the smallest complete fix

- Preserve unrelated functionality.
- Reuse existing abstractions and validation.
- Avoid duplicated business logic.
- Keep shared contracts centralized.
- Maintain compatibility where required.
- Update tests and documentation when behavior changes.
- Avoid unnecessary dependencies.

Fix the underlying problem rather than hiding it through superficial renaming or workarounds.

### Step 4: Test the change

Run focused tests first, followed by broader relevant checks.

Verify imports, package exports, module loading, security behavior, and build compatibility.

### Step 5: Review the final diff

Confirm that all required files are included, unrelated changes are absent, security checks remain intact, and tests accurately reflect application behavior.

### Step 6: Report accurately

Summarize:
1. Root cause.
2. Files created or modified.
3. Implementation details.
4. Commands executed.
5. Actual test and build results.
6. Remaining issues and risks.

Never claim a test, build, deployment, or security check succeeded unless its result was actually observed.

## 4. Canonical Socket.IO Protocol

Socket.IO is a security-sensitive boundary. Client and server event contracts must remain consistent.

### Shared protocol

Use a single shared contract for event names and structured error codes.

Expected shared module:

`packages/shared/src/socketProtocol.js`

Expected public entry point:

`@chatroom/shared/socket-protocol`

Expected exports:
- `SOCKET_EVENTS`
- `SOCKET_ERROR_CODES`

Inspect existing consumers before adding or modifying constants. Do not maintain conflicting definitions in the frontend and backend.

### Event naming

Known canonical event names include:
- `join_room`
- `leave_room`
- `chat_message`

Inspect the repository for typing events, server message events, error events, and additional protocol constants.

Do not mix naming conventions such as `chat-message`, `chat_message`, `join-room`, and `join_room` without deliberately updating all relevant consumers and tests.

### Authentication

- Authenticate sockets through the established server middleware.
- Use the supported JWT handshake mechanism.
- Configure the token before authenticated client operations.
- Reject unauthenticated or invalid sessions.
- Never trust a client-provided user ID as proof of identity.
- Handle expired tokens consistently.

### Room authorization

For room joins and messaging:
- Validate that the lounge exists and is authorized.
- Validate that the language room belongs to the requested lounge.
- Enforce active-room requirements.
- Track server-established socket membership.
- Validate membership before accepting messages or typing events.
- Reject mismatched or unauthorized room identifiers.
- Preserve leave-room behavior and membership cleanup.

Expected guard module:

`packages/api/src/services/socketGuards.js`

Expected guard functions:
- `isRoomMembershipValid(socket, loungeId, languageRoomId)`
- `isUserRestrictedFromMessaging(user)`

Use these functions consistently where applicable instead of duplicating authorization logic inline.

A database room lookup alone does not prove that a socket is authorized to send messages to the room.

### Moderation and message acceptance

Apply account restrictions before persistence or broadcasting, including:
- Account status.
- Ban state.
- Mute state.
- Mute expiration.

Follow existing moderation semantics. Handle expired mutes correctly and fail safely when security-critical state is invalid.

### Message validation

Validate payload structure and content before persistence.

Support legitimate message forms, including text-only and attachment-only messages where implemented.

An attachment-only message must not be rejected solely because `messageText` is empty when a valid attachment is present.

Messages with neither meaningful text nor a valid attachment must be rejected.

Validate supported attachment types and preserve message type, content, and attachment metadata.

### Broadcasting

- Broadcast accepted messages only to the authorized room.
- Use room-scoped delivery, such as `io.to(languageRoomId)`, where appropriate.
- Never replace room-scoped delivery with global broadcasting as a shortcut.
- Do not broadcast rejected or unsuccessfully persisted messages as accepted messages.
- Handle persistence failures consistently.

### Socket.IO regression tests

Test:
- Authentication failures.
- Room join and leave behavior.
- Lounge/language-room mismatches.
- Missing or unauthorized membership.
- Restricted accounts and expired mutes.
- Text-only messages.
- Attachment-only messages.
- Malformed payloads.
- Persistence failures.
- Room-scoped delivery.
- Structured protocol errors.
- Frontend/server event compatibility.

## 5. Authentication and Application Security

Treat all client input as untrusted.

For protected API routes and socket operations, verify identity, permissions, resource ownership, and applicable account restrictions.

- Use established authentication middleware.
- Enforce authorization on the server, not only in the UI.
- Validate request bodies, query parameters, route parameters, and attachment references.
- Use safe Prisma queries and avoid unsafe raw SQL.
- Never expose passwords, password hashes, JWT secrets, or encryption keys.
- Avoid logging credentials, tokens, or unnecessary private user data.
- Use secure cookie attributes appropriate to the deployment.
- Apply CSRF protections where required by the authentication mechanism.
- Never trust client-supplied roles, moderation flags, or ownership claims.
- Apply rate limits and abuse protections to sensitive operations.
- Avoid returning internal stack traces or secrets in API errors.

When changing authentication, inspect frontend requests, socket handshake authentication, API middleware, refresh-token flows, cookies, bearer tokens, logout, and session invalidation.

## 6. API and Database Development

### Express API

- Follow existing route and service conventions.
- Validate input before invoking business logic.
- Use consistent HTTP status codes and response formats.
- Handle asynchronous failures without leaking sensitive details.
- Avoid duplicate authorization and validation logic.
- Ensure protected routes use the required middleware.
- Confirm new routes are mounted.
- Apply bounded pagination to collection endpoints.

### Prisma and PostgreSQL

Before modifying database behavior:
1. Inspect `schema.prisma` and relevant migrations.
2. Understand relations, constraints, and indexes.
3. Check nullability and defaults.
4. Preserve referential integrity.
5. Use transactions when operations must succeed or fail together.
6. Avoid unnecessary repeated lookups.
7. Use deterministic filtering and ordering where required.

Do not assume a schema change has been deployed merely because the Prisma schema was edited.

Review the migration workflow before running database commands. Do not run destructive operations against shared or production environments without explicit authorization.

### Error handling

- Distinguish validation errors, authorization failures, missing resources, conflicts, and internal failures.
- Avoid returning raw database errors to clients.
- Log actionable diagnostics without sensitive values.
- Ensure failed persistence cannot trigger success broadcasts.

## 7. Frontend Development

For `packages/web`:

- Follow the existing Next.js architecture.
- Preserve server/client component boundaries.
- Validate data returned by API endpoints.
- Handle loading, error, empty, and success states.
- Keep authentication consistent across API and socket connections.
- Avoid exposing secrets in browser code or public environment variables.
- Use accessible labels and keyboard behavior.
- Avoid unnecessary state duplication and repeated network requests.
- Update relevant tests when component or socket behavior changes.

Prefer public shared-package imports over deep relative imports into another package's source directory.

## 8. Shared Packages and Module Resolution

The shared package is a contract boundary between applications.

When adding a shared module:
1. Create the source file.
2. Export all required symbols.
3. Configure the public export map.
4. Confirm the package name and subpath.
5. Check the supported module system.
6. Update all consumers.
7. Test the public import path.
8. Verify frontend and backend builds.

Do not assume a module exists because it is mentioned in a PR description.

Check CommonJS/ESM compatibility, file extensions, package exports, workspace linking, and runtime resolution.

Avoid deep imports such as `../../../shared/src/...` when a supported public package export exists.

## 9. Monorepo and Deployment Reliability

Inspect root scripts and package-level scripts before running commands.

Determine the package manager from the committed lockfile and repository configuration. Do not casually mix npm, pnpm, Yarn, or Bun commands.

Check:
- Workspace configuration.
- Root and package scripts.
- Dependency declarations.
- Package build order.
- Shared-module resolution.
- Environment requirements.
- Vercel project root and build settings.
- Prisma generation and migration requirements.
- Runtime compatibility.

### Node.js and Vercel

When troubleshooting deployment failures:
- Inspect the `engines` field.
- Check `.nvmrc` or `.node-version`, if present.
- Check Vercel project settings and build configuration.
- Verify dependency compatibility with the selected runtime.
- Align local development, CI, and deployment runtimes where practical.
- Use actual build logs to identify the root cause.

Do not assume the Node.js version is the only cause of a failed deployment.

### Build verification

Run applicable checks, such as:
- Shared package tests/build.
- API tests/build.
- Frontend tests/build.
- Linting and type checking.
- Prisma validation or client generation.
- Relevant monorepo-wide checks.

Report unrelated pre-existing failures separately.

## 10. Testing Standards

Tests should validate observable behavior, not merely implementation details.

Prefer tests that verify:
- Correct responses and error codes.
- Database calls and persistence outcomes.
- Authorization decisions.
- Socket emissions and recipients.
- Input validation.
- Failure and recovery behavior.
- Public package import resolution.

Use existing test frameworks and mocking conventions.

Avoid:
- Tests that only assert that a function exists.
- Tests that bypass important middleware without compensating coverage.
- Tests that encode insecure behavior as expected behavior.
- Broad snapshots that fail on irrelevant changes.
- Flaky timing assumptions in asynchronous socket tests.

Add regression tests for confirmed bugs whenever practical.

## 11. Code Review Standards

Review each PR for:
1. Correctness and completeness.
2. Security and authorization.
3. Protocol and API compatibility.
4. Database integrity and query efficiency.
5. Error handling.
6. Test quality.
7. Build and deployment impact.
8. Maintainability and scope.

For each finding, provide:
- Severity.
- File and relevant code location, when available.
- Specific failure mode.
- Why it matters.
- Concrete recommended fix.

Prioritize actionable defects over stylistic preferences.

Do not approve a PR solely because its description claims that tests passed or security issues were resolved. Verify the code and available evidence.

## 12. Git and Change Management

- Work on the intended repository and branch.
- Inspect `git status` before modifying files.
- Preserve unrelated user changes.
- Avoid destructive Git commands.
- Do not overwrite files without reading their current contents.
- Keep commits focused and descriptive.
- Include new source files, tests, migrations, and required configuration.
- Review the final diff before committing or opening a PR.

Never modify a similarly named repository based on a guess. Confirm repository identity and permissions before making remote changes.

## 13. Documentation and Configuration

Keep documentation aligned with actual behavior.

When changing environment variables:
- Update relevant examples and documentation.
- Never commit real secrets.
- Identify required versus optional variables.
- Explain deployment-specific requirements.

When changing protocol contracts, public exports, API responses, database schemas, or setup procedures, update relevant documentation and tests.

## 14. Definition of Done

A task is complete only when all applicable criteria are satisfied:

- [ ] The root cause has been identified.
- [ ] The implementation was inspected before editing.
- [ ] The fix addresses the underlying issue.
- [ ] Existing security and authorization protections are preserved.
- [ ] Required modules, exports, and configuration are present.
- [ ] Regression tests have been added or updated.
- [ ] Relevant tests have been executed.
- [ ] Relevant builds or static checks have been executed.
- [ ] The final diff has been reviewed.
- [ ] Actual results and remaining limitations are documented.

Not every repository-wide check must be run for every small change. Clearly distinguish skipped checks from checks that passed.

## 15. Final Response Format

For implementation tasks, use this structure:

### Summary
Describe the issue and the fix.

### Files Changed
List created and modified files.

### Implementation Details
Explain important behavior and security implications.

### Verification
List commands executed and their actual outcomes.

### Remaining Issues
Identify unresolved problems, skipped checks, or deployment requirements.

Be concise, technically specific, and transparent about uncertainty.

## Core Principle

Inspect first. Fix the root cause. Preserve security. Test the behavior. Verify the result. Report only what the evidence supports.
