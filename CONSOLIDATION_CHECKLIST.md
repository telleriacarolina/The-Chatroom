# Consolidation Checklist - Combined Approach

## Overview
This document tracks the consolidation from separated structures to a **combined approach** where:
- Root-level (`api/`, `socket/`, `web/`, `shared/`) = **Primary** development
- `packages/` = **Optional** workspace for distribution

---

## Phase 1: Documentation ✅
- [x] Created `ARCHITECTURE.md` explaining combined approach
- [x] Updated `package.json` scripts to support both root-level and package development
- [x] Clarified source-of-truth locations
- [x] Updated `README.md` features (implement vs. planned)

## Phase 2: Code Organization
- [ ] Verify root-level entry points exist:
  - [ ] `api/server.js` (Express API)
  - [ ] `socket/socket-server.js` (Socket.IO)
  - [ ] `web/` (Next.js structure)
  - [ ] `shared/` (shared types/utils)
- [ ] Copy missing implementations from `packages/*/src/` to root-level
- [ ] Ensure no code duplication between root and packages/

## Phase 3: Package Configuration
- [ ] Update `packages/api/package.json` to reference root code
- [ ] Update `packages/socket/package.json` to reference root code
- [ ] Update `packages/web/package.json` to reference root code
- [ ] Update `packages/shared/package.json` to reference root code
- [ ] All packages should have `"main": "../../<service>"` or similar references

## Phase 4: Git & Commit
- [ ] Remove duplicate code (if any)
- [ ] Ensure root-level `.gitignore` covers `node_modules/`, `.next/`, etc.
- [ ] Stage combined approach files:
  - `ARCHITECTURE.md`
  - `package.json` (updated scripts)
  - Root-level code updates
- [ ] Commit with message: `feat: consolidate to combined approach (root-level primary, packages optional)`

## Phase 5: Verification
- [ ] Test `npm run dev:api` (root-level)
- [ ] Test `npm run dev:socket` (root-level)
- [ ] Test `npm run dev:web` (root-level)
- [ ] Verify `npm run pkgs:dev` still works if packages configured
- [ ] Health check: `curl http://localhost:3001/health`

## Files to Commit

### Configuration Files
- ✅ `ARCHITECTURE.md` — Combined approach documentation
- ✅ `package.json` — Updated scripts for root-level primary
- ✅ `README.md` — Features updated (implement vs. planned)
- ✅ `CONSOLIDATION_CHECKLIST.md` — This file

### Existing Changes
- ✅ `scripts/generateTasks.js` — Task runner stub
- ✅ `scripts/start-all.js` — Development launcher
- ✅ `.gitkeep` files — Directory placeholders

### To Be Removed
- [ ] Empty `packages/` duplicate configs (if not needed)
- [ ] Old reference docs if conflicting

---

## Status

**Current Phase:** Phase 1 ✅ Documentation Complete

**Next Step:** Phase 2 - Verify root-level code organization

**Blocking Issues:** None identified

---

## Combined Approach Rules

1. **Development:** Always use root-level folders (`api/`, `socket/`, `web/`, `shared/`)
2. **Packages:** Point to root code, never duplicate
3. **Scripts:** Primary scripts work root-level, secondary scripts use workspaces
4. **Commits:** Track root code changes, not package mirrors

---

## Git Commands to Prepare Commit

```bash
# Stage the consolidation files
git add ARCHITECTURE.md package.json README.md CONSOLIDATION_CHECKLIST.md
git add scripts/generateTasks.js scripts/start-all.js
git add features/.gitkeep navigation/.gitkeep services/.gitkeep shared/.gitkeep state/.gitkeep ui/.gitkeep

# Review staged changes
git status

# Commit
git commit -m "feat: consolidate to combined approach

- Root-level api/, socket/, web/, shared/ as primary development
- Packages/ as optional workspace for distribution
- Updated package.json scripts for both approaches
- Created ARCHITECTURE.md with consolidated strategy
- Updated README.md with feature implementation status"
```

---

**Last Updated:** December 29, 2025
