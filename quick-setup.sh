#!/bin/bash

# Quick Setup - Create GitHub Issues for The Chatroom
# Run this script: ./quick-setup.sh

echo "🚀 Creating GitHub Issues for The Chatroom..."
echo ""

# Create labels
echo "🏷️  Creating labels..."
gh label create "high-priority" --color "d73a4a" --description "High priority task" --force 2>/dev/null || echo "  ⚠️  Label may already exist"
gh label create "medium-priority" --color "fbca04" --description "Medium priority" --force 2>/dev/null || true
gh label create "low-priority" --color "0e8a16" --description "Low priority" --force 2>/dev/null || true
gh label create "frontend" --color "e99695" --description "@chatroom/web" --force 2>/dev/null || true
gh label create "backend" --color "5319e7" --description "@chatroom/api" --force 2>/dev/null || true
gh label create "websocket" --color "0052cc" --description "@chatroom/socket" --force 2>/dev/null || true
gh label create "infrastructure" --color "fef2c0" --description "DevOps" --force 2>/dev/null || true
gh label create "quick-win" --color "bfdadc" --description "Quick win" --force 2>/dev/null || true
gh label create "typescript" --color "3178c6" --description "TypeScript" --force 2>/dev/null || true
gh label create "database" --color "4078c0" --description "Database" --force 2>/dev/null || true
gh label create "auth" --color "7057ff" --description "Auth" --force 2>/dev/null || true
gh label create "chat" --color "d876e3" --description "Chat" --force 2>/dev/null || true
gh label create "ui" --color "bfd4f2" --description "UI" --force 2>/dev/null || true
echo "✅ Labels created"
echo ""

# Issue #1
echo "📝 Creating Issue #1: Fix TypeScript Errors..."
gh issue create \
  --title "Fix TypeScript Errors in Block.tsx" \
  --body "**Priority:** 🔴 High
**Time:** 5 minutes
**Package:** @chatroom/web

## Tasks
- [ ] Change \`useState(null)\` to \`useState<string | null>(null)\` on line 14
- [ ] Run \`npm run build\` to verify
- [ ] Test component renders

## Files
- \`components/chat/Block.tsx\`

See [TASKS.md](https://github.com/telleriacarolina/The-Chatroom/blob/main/TASKS.md#1-fix-typescript-errors-in-blocktsx)" \
  --label "bug,typescript,high-priority,frontend" \
  --assignee @me

# Issue #2
echo "📝 Creating Issue #2: Environment Setup..."
gh issue create \
  --title "Set Up Environment Variables" \
  --body "**Priority:** 🔴 High
**Time:** 10 minutes
**Packages:** @chatroom/api, @chatroom/socket, @chatroom/web

## Tasks
- [ ] Copy \`packages/api/.env.example\` → \`packages/api/.env\`
- [ ] Set DATABASE_URL
- [ ] Set ACCESS_TOKEN_SECRET (32+ chars)
- [ ] Set REFRESH_TOKEN_SECRET (32+ chars)
- [ ] Set PHONE_ENC_KEY
- [ ] Copy \`packages/socket/.env.example\` → \`packages/socket/.env\`
- [ ] Create \`packages/web/.env.local\`

See [TASKS.md](https://github.com/telleriacarolina/The-Chatroom/blob/main/TASKS.md#2-set-up-environment-variables)" \
  --label "infrastructure,high-priority" \
  --assignee @me

# Issue #3
echo "📝 Creating Issue #3: Initialize Database..."
gh issue create \
  --title "Initialize Database" \
  --body "**Priority:** 🔴 High
**Time:** 5 minutes
**Package:** @chatroom/api

## Tasks
- [ ] Run \`cd packages/api && npm run prisma:generate\`
- [ ] Run \`npm run prisma:migrate\`
- [ ] Verify tables created
- [ ] Test connection

See [TASKS.md](https://github.com/telleriacarolina/The-Chatroom/blob/main/TASKS.md#3-initialize-database)" \
  --label "database,high-priority,backend" \
  --assignee @me

# Issue #4
echo "📝 Creating Issue #4: Test Startup..."
gh issue create \
  --title "Test Application Startup" \
  --body "**Priority:** 🔴 High
**Time:** 15 minutes
**Packages:** All

## Tasks
- [ ] Start API: \`npm run dev:api\` (port 3001)
- [ ] Start Socket: \`npm run dev:socket\` (port 3002)
- [ ] Start Web: \`npm run dev:web\` (port 3000)
- [ ] Test health: \`GET http://localhost:3001/health\`
- [ ] Test Socket.IO connection
- [ ] Verify Block component renders

See [TASKS.md](https://github.com/telleriacarolina/The-Chatroom/blob/main/TASKS.md#4-test-application-startup)" \
  --label "high-priority" \
  --assignee @me

# Issue #5
echo "📝 Creating Issue #5: API Client..."
gh issue create \
  --title "Create API Client Utilities" \
  --body "**Priority:** 🟡 Medium
**Time:** 30 minutes
**Package:** @chatroom/web
**Phase:** Phase 1

## Tasks
- [ ] Create \`packages/web/src/lib/api.ts\`
- [ ] Implement fetch wrapper with error handling
- [ ] Add baseURL from env
- [ ] Add TypeScript types
- [ ] Create helper functions

See [TASKS.md](https://github.com/telleriacarolina/The-Chatroom/blob/main/TASKS.md#5-create-api-client-utilities)" \
  --label "enhancement,frontend,medium-priority" \
  --assignee @me

# Issue #6
echo "📝 Creating Issue #6: Socket.IO Client..."
gh issue create \
  --title "Create Socket.IO Client Wrapper" \
  --body "**Priority:** 🟡 Medium
**Time:** 30 minutes
**Package:** @chatroom/web
**Phase:** Phase 1

## Tasks
- [ ] Create \`packages/web/src/lib/socket.ts\`
- [ ] Initialize socket.io-client
- [ ] Add connection handlers
- [ ] Implement reconnection logic
- [ ] Add TypeScript types
- [ ] Create useSocket hook

See [TASKS.md](https://github.com/telleriacarolina/The-Chatroom/blob/main/TASKS.md#6-create-socketio-client-wrapper)" \
  --label "enhancement,frontend,websocket,medium-priority" \
  --assignee @me

# Issue #7
echo "📝 Creating Issue #7: Dark Mode..."
gh issue create \
  --title "Add Dark Mode Toggle" \
  --body "**Priority:** 🟢 Low (Quick Win)
**Time:** 30 minutes
**Package:** @chatroom/web

## Tasks
- [ ] Add theme toggle button
- [ ] Use existing CSS variables
- [ ] Persist in localStorage
- [ ] Add transition animation

See [TASKS.md](https://github.com/telleriacarolina/The-Chatroom/blob/main/TASKS.md#21-add-dark-mode-toggle)" \
  --label "enhancement,ui,quick-win,low-priority" \
  --assignee @me

# Issue #8
echo "📝 Creating Issue #8: Error Boundary..."
gh issue create \
  --title "Create Error Boundary Component" \
  --body "**Priority:** 🟢 Low (Quick Win)
**Time:** 15 minutes
**Package:** @chatroom/web

## Tasks
- [ ] Create ErrorBoundary component
- [ ] Wrap app in layout.tsx
- [ ] Show friendly error message
- [ ] Add reload button
- [ ] Log errors

See [TASKS.md](https://github.com/telleriacarolina/The-Chatroom/blob/main/TASKS.md#22-create-error-boundary)" \
  --label "enhancement,ui,quick-win,low-priority" \
  --assignee @me

# Issue #9
echo "📝 Creating Issue #9: Loading States..."
gh issue create \
  --title "Add Loading Spinners to API Calls" \
  --body "**Priority:** 🟢 Low (Quick Win)
**Time:** 20 minutes
**Package:** @chatroom/web

## Tasks
- [ ] Add loading state to API calls
- [ ] Show Loader2 icon
- [ ] Disable buttons during loading
- [ ] Add skeleton loaders

See [TASKS.md](https://github.com/telleriacarolina/The-Chatroom/blob/main/TASKS.md#23-add-loading-spinners)" \
  --label "enhancement,ui,quick-win,low-priority" \
  --assignee @me

# Issue #10
echo "📝 Creating Issue #10: Auth Forms..."
gh issue create \
  --title "Create Login and Signup Forms" \
  --body "**Priority:** 🟡 Medium
**Time:** 1.5 hours
**Package:** @chatroom/web
**Phase:** Phase 2

## Tasks
- [ ] Create LoginForm.tsx
- [ ] Create SignupForm.tsx
- [ ] Add phone validation
- [ ] Connect to auth endpoints
- [ ] Handle JWT tokens
- [ ] Add error handling

See [TASKS.md](https://github.com/telleriacarolina/The-Chatroom/blob/main/TASKS.md#11-create-login-form-component)" \
  --label "enhancement,auth,frontend,medium-priority" \
  --assignee @me

echo ""
echo "🎉 Created 10 issues successfully!"
echo ""
echo "🔗 View at: https://github.com/telleriacarolina/The-Chatroom/issues"
echo ""
echo "💡 To add to your project board:"
echo "   1. Go to https://github.com/users/telleriacarolina/projects"
echo "   2. Open your 'the chat app project'"
echo "   3. Click '+ Add item' and select the issues"
echo ""
