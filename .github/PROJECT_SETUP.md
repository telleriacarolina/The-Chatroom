# GitHub Project Setup Guide

This guide will help you set up a GitHub Project board to track all tasks from TASKS.md.

## Quick Setup (5 minutes)

### 1. Create a New Project

1. Go to <https://github.com/telleriacarolina/The-Chatroom/projects>
2. Click "New project"
3. Choose "Board" template
4. Name it "The Chatroom Development"
5. Click "Create project"

### 2. Set Up Columns

Add these columns to your board:

- **📋 Backlog** - Future tasks
- **🎯 To Do** - Ready to start
- **🚀 In Progress** - Currently working on
- **👀 Review** - Awaiting review/testing
- **✅ Done** - Completed

### 3. Add Custom Fields

Add these fields to track task details:

1. **Priority** (Single select)
   - 🔴 High
   - 🟡 Medium
   - 🟢 Low

2. **Phase** (Single select)
   - Phase 1: Connect Frontend to Backend
   - Phase 2: Authentication Flow
   - Phase 3: Real-Time Chat
   - Phase 4: Account Tiers
   - Phase 5: Marketplace
   - Technical Improvements
   - Quick Wins

3. **Estimated Time** (Number)
   - Track in minutes

4. **Package** (Single select)
   - @chatroom/web
   - @chatroom/api
   - @chatroom/socket
   - @chatroom/shared
   - Infrastructure

### 4. Create Labels

Set up these labels in your repository:

```bash
# Using GitHub CLI
gh label create "high-priority" --color "d73a4a" --description "High priority task"
gh label create "medium-priority" --color "fbca04" --description "Medium priority task"
gh label create "low-priority" --color "0e8a16" --description "Low priority task"
gh label create "bug" --color "d73a4a" --description "Something isn't working"
gh label create "enhancement" --color "a2eeef" --description "New feature or request"
gh label create "task" --color "1d76db" --description "Development task"
gh label create "frontend" --color "e99695" --description "@chatroom/web"
gh label create "backend" --color "5319e7" --description "@chatroom/api"
gh label create "websocket" --color "0052cc" --description "@chatroom/socket"
gh label create "infrastructure" --color "fef2c0" --description "DevOps/Infrastructure"
gh label create "quick-win" --color "bfdadc" --description "High impact, low effort"
gh label create "security" --color "ee0701" --description "Security related"
gh label create "performance" --color "006b75" --description "Performance improvement"
gh label create "testing" --color "c5def5" --description "Testing related"
gh label create "documentation" --color "0075ca" --description "Documentation"
```

## Bulk Create Issues from TASKS.md

### Using GitHub CLI (Recommended)

Install GitHub CLI: <https://cli.github.com/>

```bash
# Login
gh auth login

# Navigate to your repo
cd /workspaces/The-Chatroom

# Create issues (examples - adapt from TASKS.md)
gh issue create \
  --title "Fix TypeScript Errors in Block.tsx" \
  --body "**Package:** @chatroom/web
**Time:** 5 minutes
**Priority:** High

Fix type error on line 14 of components/chat/Block.tsx

- [ ] Change \`useState(null)\` to \`useState<string | null>(null)\`
- [ ] Verify no TypeScript errors
- [ ] Test component renders correctly

See TASKS.md #1" \
  --label "bug,typescript,high-priority,frontend" \
  --assignee @me

gh issue create \
  --title "Set Up Environment Variables" \
  --body "**Packages:** @chatroom/api, @chatroom/socket, @chatroom/web
**Time:** 10 minutes
**Priority:** High

Create environment configuration files for all packages

- [ ] Copy packages/api/.env.example to packages/api/.env
- [ ] Configure DATABASE_URL
- [ ] Set ACCESS_TOKEN_SECRET (32+ chars)
- [ ] Set REFRESH_TOKEN_SECRET (32+ chars)
- [ ] Set PHONE_ENC_KEY (32-byte key)
- [ ] Copy packages/socket/.env.example to packages/socket/.env
- [ ] Create packages/web/.env.local with API/Socket URLs

See TASKS.md #2" \
  --label "infrastructure,high-priority" \
  --assignee @me

# Continue for other tasks...
```

### Using GitHub Web Interface

1. Go to <https://github.com/telleriacarolina/The-Chatroom/issues/new>
2. Copy task content from TASKS.md
3. Add title, labels, and assignees
4. Submit issue
5. Add to project board

### Using a Script

Create `create-issues.sh`:

```bash
#!/bin/bash

# Array of tasks (add all from TASKS.md)
declare -a tasks=(
  "Fix TypeScript Errors in Block.tsx|bug,typescript,high-priority,frontend"
  "Set Up Environment Variables|infrastructure,high-priority"
  # ... add all tasks
)

for task in "${tasks[@]}"; do
  IFS='|' read -r title labels <<< "$task"
  gh issue create --title "$title" --label "$labels" --body "See TASKS.md"
done
```

## Project Automation

### Auto-add Issues to Project

1. Go to Project Settings → Workflows
2. Enable "Auto-add to project"
3. Select criteria (all new issues, specific labels)

### Auto-move on Status Change

1. Set up workflow to move items:
   - When issue opened → To Do
   - When PR opened → In Progress
   - When PR merged → Done

### Link PRs to Issues

Use keywords in PR descriptions:
<!-- 
```
Closes #1.
Fixes #2
Resolves #3
```.

 -->

## Milestones

Create milestones for each phase:

```bash
gh milestone create "Phase 1: Connect Frontend to Backend" --due-date 2025-01-10
gh milestone create "Phase 2: Authentication Flow" --due-date 2025-01-15
gh milestone create "Phase 3: Real-Time Chat" --due-date 2025-01-22
gh milestone create "Phase 4: Account Tiers" --due-date 2025-01-29
gh milestone create "Phase 5: Marketplace" --due-date 2025-02-05
```

Assign issues to milestones:

```bash
gh issue edit 1 --milestone "Phase 1: Connect Frontend to Backend"
```

## View Progress

### In GitHub

- View project board: <https://github.com/telleriacarolina/The-Chatroom/projects>
- View all issues: <https://github.com/telleriacarolina/The-Chatroom/issues>
- View by milestone: <https://github.com/telleriacarolina/The-Chatroom/milestones>

### In VS Code

- Install GitHub Pull Requests extension
- View issues in sidebar
- Create/update issues from editor

## Best Practices

1. **Break down large tasks** - Split tasks > 4 hours into smaller ones
2. **Update status regularly** - Move cards as you work
3. **Link related issues** - Reference issues with #number
4. **Use checklists** - Track sub-tasks within issues
5. **Add comments** - Document decisions and blockers
6. **Review weekly** - Groom backlog and update priorities
7. **Close completed issues** - Keep board clean

## Integrations

### VS Code

- Install: GitHub Pull Requests and Issues extension
- View/edit issues directly in VS Code

### Slack/Discord

- Set up webhooks for issue notifications
- Get updates when issues are created/closed

### CI/CD

- Run tests on issue branches
- Auto-close issues when PR merges

---

**Ready to start?** Create your first issue from [TASKS.md](../TASKS.md)!
