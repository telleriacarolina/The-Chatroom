# Update & Add Code Workflow

A concise checklist to follow when updating existing code or adding new features.

## Steps

1) Clarify the change

- Define the goal and scope (feature, bug fix, refactor, doc).
- Identify impacted areas (routes, sockets, UI, DB, jobs, security).

1) Plan placement

- API: `routes/auth.js` (mounted via `server/server.js`).
- Sockets: `server/socket-server.js` (add events in `io.on('connection', ...)`).
- Jobs: `services/backgroundJobs.js` (register in `startBackgroundJobs`).
- DB: `prisma/schema.prisma` (then `prisma:generate` + `prisma:migrate`).
- UI: `components/chat/Block.tsx` and shared UI in `components/ui/*`.
- Utilities: `lib/*`, middleware in `middleware/*`.

1) Implement

- Reuse shared helpers: `lib/crypto.encryptPhone`, `lib/jwt.signAccess`, `lib/prisma.prisma` client, `middleware/rateLimiter`.
- Keep responses consistent (JSON, no secrets in errors).
- Apply security: CSRF (where relevant), rate limiting, helmet already global.

1) Validate

```bash
npm run dev            # API
npm run socket:dev     # WebSocket
npm run next:dev       # Frontend
npm run prisma:generate
npm run prisma:migrate
```

- Hit `/health`, auth endpoints, and socket events manually.

1) Document

- Update [README.md](../../README.md) if behavior or setup changes.
- Add notes to [docs/update-scenarios/README.md](./README.md) if patterns change.

1) Commit & PR

```bash
git add -A
git commit -m "feat: <short summary>"
git push origin <branch>
```

- Open PR; keep changes small and focused.

## Quick Replacement Patterns

- Inline crypto -> `lib/crypto.encryptPhone`
- Manual JWT -> `lib/jwt.signAccess`
- No rate limit -> `middleware/rateLimiter.authLimiter`
- New Prisma client -> shared `lib/prisma.prisma`

## Checklist

- [ ] Defined scope and placement
- [ ] Implemented with shared helpers
- [ ] Security applied (CSRF/rate limit/JWT/crypto as needed)
- [ ] Tests/commands run
- [ ] Docs updated
- [ ] Committed on a branch and pushed
