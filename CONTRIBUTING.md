# Contributing to The Chatroom

Thanks for your interest in contributing! This project welcomes pull requests.

## How to Propose Changes
- Open an issue for discussion if the change is substantial or breaking.
- Fork the repo and create a feature branch from `main`.

## Branch Naming
- Use short, descriptive names: `feat/lounges-filter`, `fix/auth-refresh`, `docs/readme-updates`.

## Commit Style
- Follow Conventional Commits:
  - `feat: add lounge filter`
  - `fix: correct refresh token expiry`
  - `docs: update README links`
  - `refactor: move server files`

## Code Style & Tooling
- Use Prettier and ESLint (keep TypeScript `strict: false` as configured).
- Respect path aliases: `@/*`, `@/components/*`, `@/lib/*`, `@/utils/*`.

## Tests & Validation
- Add or update minimal tests as applicable.
- Ensure `npm run next:build` and server scripts run locally.

## PR Checklist
- Purpose and context explained.
- Small, focused changes; avoid drive-by refactors.
- Updated docs if needed (README or `docs/*`).

## Development Commands
```bash
npm install
npm run dev           # API server
npm run socket:dev    # Socket.IO server
npm run next:dev      # Next.js frontend
npm run prisma:migrate && npm run prisma:generate
```

Thank you for contributing!
