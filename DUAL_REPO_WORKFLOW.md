# Dual Repository Workflow
## Working on The-Chatroom with LEAVINGROOM4XFACTOR as Reference

This document explains how to efficiently work on both repositories together.

---

## 📋 Repository Roles

### Primary: The-Chatroom
- **Purpose:** Main application development
- **Location:** `/workspaces/The-Chatroom`
- **What we do:** 
  - Implement features
  - Fix bugs
  - Run tests
  - Deploy updates

### Reference: LEAVINGROOM4XFACTOR
- **Purpose:** Source of ideas, patterns, and pre-built components
- **Location:** `/workspaces/LEAVINGROOM4XFACTOR` (or clone as needed)
- **What we use:**
  - Code patterns and architecture
  - Pre-implemented features
  - Type definitions and schemas
  - UI components
  - Security implementations

---

## 🚀 Quick Setup

### 1. Clone Both Repos (if not already done)
```bash
cd /workspaces

# Primary development repo
git clone https://github.com/telleriacarolina/The-Chatroom.git

# Reference repo
git clone https://github.com/telleriacarolina/LEAVINGROOM4XFACTOR.git leavingroom-ref
```

### 2. Initialize Working Directories
```bash
# Go to primary project
cd The-Chatroom

# Install dependencies
npm install

# Copy env template
cp .env.example .env
```

### 3. Set Up Reference Branch
```bash
# Open reference repo in another terminal or VS Code workspace
cd ../leavingroom-ref
git log --oneline | head -20  # See latest commits
```

---

## 📂 File Structure for Dual Workflow

```
/workspaces/
├── The-Chatroom/          (PRIMARY - Development)
│   ├── api/               (Implement here)
│   ├── socket/
│   ├── web/
│   ├── shared/
│   └── package.json
│
└── leavingroom-ref/       (REFERENCE - Copy from)
    ├── src/
    ├── lib/
    ├── components/
    └── docs/
```

---

## 🔄 Workflow: Copy Patterns from Reference to Primary

### Step 1: Identify What to Copy
Look in LEAVINGROOM4XFACTOR for:
- ✅ Database models and schemas
- ✅ Authentication patterns
- ✅ API route structures
- ✅ React components
- ✅ Type definitions
- ✅ Utility functions
- ✅ Middleware patterns
- ✅ Error handling

### Step 2: Review the Code
```bash
# Compare file structures
diff -r The-Chatroom/api leavingroom-ref/src/api

# View specific implementation
cat leavingroom-ref/src/routes/auth.js
```

### Step 3: Adapt and Integrate
```bash
# Copy file structure
cp -r leavingroom-ref/src/lib/jwt.js The-Chatroom/api/lib/

# Edit to match your needs
# Update imports, paths, and configurations
```

### Step 4: Test in Primary Project
```bash
cd The-Chatroom
npm run dev:api
# Verify your new code works
```

### Step 5: Commit to Primary
```bash
git add api/lib/jwt.js
git commit -m "feat: add JWT utilities from reference implementation"
```

---

## 📝 Key Things to Copy

### From LEAVINGROOM4XFACTOR to The-Chatroom

| Component | Location | Purpose |
|-----------|----------|---------|
| **Types** | `src/types/` | TypeScript interfaces |
| **Schemas** | `src/schemas/` | Validation & API contracts |
| **Auth** | `src/routes/auth.js` | Authentication logic |
| **Middleware** | `src/middleware/` | Express/security middleware |
| **Services** | `src/services/` | Background jobs, utils |
| **Components** | `src/components/` | React UI components |
| **Database** | `prisma/` | Schema and migrations |
| **Utils** | `src/lib/` | Crypto, JWT, helpers |

---

## 🛠️ Common Tasks

### Task: Copy Authentication Pattern
```bash
# 1. View reference implementation
cat leavingroom-ref/src/routes/auth.js

# 2. Copy file
cp leavingroom-ref/src/routes/auth.js The-Chatroom/api/routes/auth.js

# 3. Update imports/paths as needed
# Edit The-Chatroom/api/routes/auth.js

# 4. Test it
cd The-Chatroom && npm run dev:api

# 5. Commit
git commit -m "feat: integrate authentication from reference"
```

### Task: Merge Database Schema
```bash
# 1. Compare schemas
diff leavingroom-ref/prisma/schema.prisma \
     The-Chatroom/prisma/schema.prisma

# 2. Copy useful models
cp leavingroom-ref/prisma/schema.prisma temp.prisma
# Merge into The-Chatroom/prisma/schema.prisma manually

# 3. Run migrations
cd The-Chatroom
npm run prisma:generate
npm run prisma:migrate
```

### Task: Add UI Components
```bash
# 1. Copy component
cp leavingroom-ref/src/components/Button.tsx \
   The-Chatroom/components/ui/button.tsx

# 2. Update imports
# Make sure it imports from correct paths

# 3. Test in app
cd The-Chatroom && npm run dev:web
```

---

## 🚨 Important Tips

### ✅ DO
- ✅ Read the reference code carefully before copying
- ✅ Adapt paths and imports to match The-Chatroom structure
- ✅ Test copied code thoroughly before committing
- ✅ Update types and schemas consistently
- ✅ Document changes in commit messages
- ✅ Keep both repos in sync conceptually

### ❌ DON'T
- ❌ Copy entire files without understanding them
- ❌ Leave broken imports or references
- ❌ Ignore security implementations
- ❌ Skip testing new integrated code
- ❌ Copy config files without review
- ❌ Forget to update documentation

---

## 📊 Three-Server Testing (After Integration)

After copying and integrating code:

```bash
# Terminal 1: API server
npm run dev:api

# Terminal 2: Socket.IO server
npm run dev:socket

# Terminal 3: Next.js frontend
npm run dev:web

# Test health
curl http://localhost:3001/health
```

---

## 🔗 Useful Git Commands

### Compare both repos
```bash
# Side-by-side file comparison
diff <(git -C The-Chatroom log --oneline | head -10) \
     <(git -C leavingroom-ref log --oneline | head -10)
```

### List files in reference repo
```bash
find leavingroom-ref -type f -name "*.ts" -o -name "*.js" | head -20
```

### Check git history for ideas
```bash
cd leavingroom-ref
git log --oneline --grep="auth\|database\|socket" | head -20
```

---

## 📈 Development Phases

### Phase 1: Setup (Current)
- [x] Clone both repos
- [x] Install The-Chatroom dependencies
- [ ] Review LEAVINGROOM4XFACTOR structure

### Phase 2: Copy Core Patterns
- [ ] Copy type definitions
- [ ] Copy database schema
- [ ] Copy authentication routes
- [ ] Copy middleware

### Phase 3: Integrate & Test
- [ ] Merge code into The-Chatroom
- [ ] Run all three servers
- [ ] Test health endpoints
- [ ] Verify features work

### Phase 4: Expand Features
- [ ] Add marketplace functionality
- [ ] Add moderation system
- [ ] Add verification flows
- [ ] Add Socket.IO chat features

### Phase 5: Polish & Deploy
- [ ] Write tests
- [ ] Update documentation
- [ ] Optimize performance
- [ ] Prepare for production

---

## 📞 Need Help?

Use this workflow whenever you need to:
1. Find an implementation pattern → Check LEAVINGROOM4XFACTOR
2. Understand how something works → Read reference code
3. Get a head start on a feature → Copy & adapt
4. Verify your approach is correct → Compare with reference

---

**Last Updated:** December 29, 2025
**Status:** Ready to use for dual-repo development
