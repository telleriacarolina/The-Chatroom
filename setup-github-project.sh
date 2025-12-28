#!/bin/bash

# Setup GitHub Project and Issues for The Chatroom
# Run this script after authenticating with: gh auth login

echo "🚀 Setting up GitHub project management..."

# Get project number for existing project
echo "📋 Fetching existing project..."
PROJECT_NUMBER=$(gh project list --owner telleriacarolina --format json | jq -r '.projects[] | select(.title | contains("chat app")) | .number' | head -n 1)

if [ -z "$PROJECT_NUMBER" ]; then
  echo "❌ Project not found. Please provide the project number manually."
  echo "   Visit: https://github.com/users/telleriacarolina/projects"
  echo "   Or run: gh project list --owner telleriacarolina"
  exit 1
fi

echo "✅ Found project #${PROJECT_NUMBER}"

# Create labels
echo ""
echo "🏷️  Creating labels..."

gh label create "high-priority" --color "d73a4a" --description "High priority task" --force 2>/dev/null
gh label create "medium-priority" --color "fbca04" --description "Medium priority task" --force 2>/dev/null
gh label create "low-priority" --color "0e8a16" --description "Low priority task" --force 2>/dev/null
gh label create "bug" --color "d73a4a" --description "Something isn't working" --force 2>/dev/null
gh label create "enhancement" --color "a2eeef" --description "New feature or request" --force 2>/dev/null
gh label create "task" --color "1d76db" --description "Development task" --force 2>/dev/null
gh label create "frontend" --color "e99695" --description "@chatroom/web" --force 2>/dev/null
gh label create "backend" --color "5319e7" --description "@chatroom/api" --force 2>/dev/null
gh label create "websocket" --color "0052cc" --description "@chatroom/socket" --force 2>/dev/null
gh label create "infrastructure" --color "fef2c0" --description "DevOps/Infrastructure" --force 2>/dev/null
gh label create "quick-win" --color "bfdadc" --description "High impact, low effort" --force 2>/dev/null
gh label create "security" --color "ee0701" --description "Security related" --force 2>/dev/null
gh label create "performance" --color "006b75" --description "Performance improvement" --force 2>/dev/null
gh label create "testing" --color "c5def5" --description "Testing related" --force 2>/dev/null
gh label create "documentation" --color "0075ca" --description "Documentation" --force 2>/dev/null
gh label create "typescript" --color "3178c6" --description "TypeScript related" --force 2>/dev/null
gh label create "database" --color "4078c0" --description "Database related" --force 2>/dev/null
gh label create "auth" --color "7057ff" --description "Authentication/Authorization" --force 2>/dev/null
gh label create "chat" --color "d876e3" --description "Chat features" --force 2>/dev/null
gh label create "ui" --color "bfd4f2" --description "User interface" --force 2>/dev/null

echo "✅ Labels created"

# Create immediate priority issues
echo ""
echo "📝 Creating immediate priority issues..."

# Issue #1 - Fix TypeScript Errors
ISSUE_1=$(gh issue create \
  --title "Fix TypeScript Errors in Block.tsx" \
  --body "**Package:** \`@chatroom/web\`
**Priority:** 🔴 High
**Time Estimate:** 5 minutes
**Phase:** Immediate Actions

## Description
Fix type error on line 14 of \`components/chat/Block.tsx\`

## Tasks
- [ ] Change \`useState(null)\` to \`useState<string | null>(null)\`
- [ ] Verify no TypeScript errors with \`npm run build\`
- [ ] Test component renders correctly

## Files
- \`components/chat/Block.tsx\`

## Related
See [TASKS.md](../blob/main/TASKS.md) #1" \
  --label "bug,typescript,high-priority,frontend" \
  --assignee @me \
  --project "telleriacarolina/${PROJECT_NUMBER}")

echo "✅ Created: Fix TypeScript Errors (#${ISSUE_1})"

# Issue #2 - Environment Setup
ISSUE_2=$(gh issue create \
  --title "Set Up Environment Variables" \
  --body "**Packages:** \`@chatroom/api\`, \`@chatroom/socket\`, \`@chatroom/web\`
**Priority:** 🔴 High
**Time Estimate:** 10 minutes
**Phase:** Immediate Actions

## Description
Create environment configuration files for all packages

## Tasks
- [ ] Copy \`packages/api/.env.example\` to \`packages/api/.env\`
- [ ] Configure DATABASE_URL with PostgreSQL connection
- [ ] Set ACCESS_TOKEN_SECRET (32+ chars)
- [ ] Set REFRESH_TOKEN_SECRET (32+ chars)
- [ ] Set PHONE_ENC_KEY (32-byte encryption key)
- [ ] Copy \`packages/socket/.env.example\` to \`packages/socket/.env\`
- [ ] Create \`packages/web/.env.local\` with API/Socket URLs

## Files
- \`packages/api/.env\`
- \`packages/socket/.env\`
- \`packages/web/.env.local\`

## Related
See [TASKS.md](../blob/main/TASKS.md) #2" \
  --label "infrastructure,high-priority" \
  --assignee @me \
  --project "telleriacarolina/${PROJECT_NUMBER}")

echo "✅ Created: Set Up Environment Variables (#${ISSUE_2})"

# Issue #3 - Initialize Database
ISSUE_3=$(gh issue create \
  --title "Initialize Database" \
  --body "**Package:** \`@chatroom/api\`
**Priority:** 🔴 High
**Time Estimate:** 5 minutes
**Phase:** Immediate Actions

## Description
Generate Prisma client and run database migrations

## Tasks
- [ ] Run \`cd packages/api && npm run prisma:generate\`
- [ ] Run \`npm run prisma:migrate\`
- [ ] Verify database tables created
- [ ] Test database connection

## Commands
\`\`\`bash
cd packages/api
npm run prisma:generate
npm run prisma:migrate
\`\`\`

## Related
See [TASKS.md](../blob/main/TASKS.md) #3" \
  --label "database,high-priority,backend" \
  --assignee @me \
  --project "telleriacarolina/${PROJECT_NUMBER}")

echo "✅ Created: Initialize Database (#${ISSUE_3})"

# Issue #4 - Test Application Startup
ISSUE_4=$(gh issue create \
  --title "Test Application Startup" \
  --body "**Packages:** All
**Priority:** 🔴 High
**Time Estimate:** 15 minutes
**Phase:** Immediate Actions

## Description
Verify all three servers start without errors

## Tasks
- [ ] Start API server: \`npm run dev:api\` (port 3001)
- [ ] Start Socket.IO: \`npm run dev:socket\` (port 3002)
- [ ] Start Next.js: \`npm run dev:web\` (port 3000)
- [ ] Test API health endpoint: \`GET http://localhost:3001/health\`
- [ ] Test Socket.IO connection from browser console
- [ ] Verify Block component renders in browser

## Related
See [TASKS.md](../blob/main/TASKS.md) #4" \
  --label "testing,high-priority" \
  --assignee @me \
  --project "telleriacarolina/${PROJECT_NUMBER}")

echo "✅ Created: Test Application Startup (#${ISSUE_4})"

# Issue #5 - Create API Client Utilities
ISSUE_5=$(gh issue create \
  --title "Create API Client Utilities" \
  --body "**Package:** \`@chatroom/web\`
**Priority:** 🟡 Medium
**Time Estimate:** 30 minutes
**Phase:** Phase 1 - Connect Frontend to Backend

## Description
Build reusable API client with fetch wrapper

## Tasks
- [ ] Create \`packages/web/src/lib/api.ts\`
- [ ] Implement fetch wrapper with error handling
- [ ] Add baseURL from env variables
- [ ] Add request/response interceptors
- [ ] Add TypeScript types for API responses
- [ ] Create helper functions for common requests

## Files
- \`packages/web/src/lib/api.ts\`

## Related
See [TASKS.md](../blob/main/TASKS.md) #5" \
  --label "enhancement,frontend,medium-priority" \
  --assignee @me \
  --project "telleriacarolina/${PROJECT_NUMBER}")

echo "✅ Created: Create API Client Utilities (#${ISSUE_5})"

# Issue #6 - Create Socket.IO Client Wrapper
ISSUE_6=$(gh issue create \
  --title "Create Socket.IO Client Wrapper" \
  --body "**Package:** \`@chatroom/web\`
**Priority:** 🟡 Medium
**Time Estimate:** 30 minutes
**Phase:** Phase 1 - Connect Frontend to Backend

## Description
Set up Socket.IO client instance with reconnection logic

## Tasks
- [ ] Create \`packages/web/src/lib/socket.ts\`
- [ ] Initialize socket.io-client with server URL
- [ ] Add connection/disconnection event handlers
- [ ] Implement reconnection logic
- [ ] Add TypeScript types for socket events
- [ ] Create React hook for socket usage

## Files
- \`packages/web/src/lib/socket.ts\`
- \`packages/web/src/hooks/useSocket.ts\` (optional)

## Related
See [TASKS.md](../blob/main/TASKS.md) #6" \
  --label "enhancement,frontend,websocket,medium-priority" \
  --assignee @me \
  --project "telleriacarolina/${PROJECT_NUMBER}")

echo "✅ Created: Create Socket.IO Client Wrapper (#${ISSUE_6})"

# Issue #7 - Add Dark Mode Toggle
ISSUE_7=$(gh issue create \
  --title "Add Dark Mode Toggle" \
  --body "**Package:** \`@chatroom/web\`
**Priority:** 🟢 Low (Quick Win)
**Time Estimate:** 30 minutes
**Phase:** Quick Wins

## Description
Implement dark mode toggle using existing CSS variables

## Tasks
- [ ] Add theme toggle button in header
- [ ] Use CSS variables already defined
- [ ] Persist preference in localStorage
- [ ] Add smooth transition animation

## Files
- \`packages/web/src/components/ThemeToggle.tsx\`
- \`packages/web/src/app/layout.tsx\`

## Related
See [TASKS.md](../blob/main/TASKS.md) #21" \
  --label "enhancement,ui,quick-win,low-priority" \
  --assignee @me \
  --project "telleriacarolina/${PROJECT_NUMBER}")

echo "✅ Created: Add Dark Mode Toggle (#${ISSUE_7})"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📊 Created 7 issues:"
echo "   - 4 High Priority (Immediate Actions)"
echo "   - 2 Medium Priority (Phase 1)"
echo "   - 1 Low Priority (Quick Win)"
echo ""
echo "🔗 View your project at:"
echo "   https://github.com/users/telleriacarolina/projects/${PROJECT_NUMBER}"
echo ""
echo "📋 View all issues at:"
echo "   https://github.com/telleriacarolina/The-Chatroom/issues"
echo ""
echo "💡 To create more issues, edit this script or use:"
echo "   gh issue create --help"
