#!/bin/bash

# Complete Consolidation Script
# Moves all remaining root-level files into proper packages/ structure

echo "🗂️  Consolidating project structure into packages..."
echo ""

# Move prisma to packages/api
if [ -d "prisma" ] && [ ! -d "packages/api/prisma" ]; then
  echo "📦 Moving prisma/ → packages/api/prisma/"
  mv prisma packages/api/
fi

# Move public to packages/web
if [ -d "public" ] && [ ! -d "packages/web/public" ]; then
  echo "📦 Moving public/ → packages/web/public/"
  mv public packages/web/
fi

# Move root-level config files to packages/web
echo ""
echo "⚙️  Moving configuration files to packages/web..."

if [ -f "jsconfig.json" ]; then
  mv jsconfig.json packages/web/ 2>/dev/null || echo "  ⚠️  jsconfig.json already in packages/web"
fi

if [ -f "tsconfig.json" ]; then
  mv tsconfig.json packages/web/ 2>/dev/null || echo "  ⚠️  tsconfig.json already in packages/web"
fi

if [ -f "next-env.d.ts" ]; then
  mv next-env.d.ts packages/web/ 2>/dev/null || echo "  ⚠️  next-env.d.ts already in packages/web"
fi

# Move .next if it exists
if [ -d ".next" ]; then
  echo "📦 Moving .next/ → packages/web/.next/"
  rm -rf packages/web/.next
  mv .next packages/web/
fi

# Clean up old scripts
echo ""
echo "🧹 Removing old migration scripts..."
rm -f migrate-files.sh cleanup-old-dirs.sh remove-old-components.sh final-cleanup.sh 2>/dev/null

# Update .gitignore to reflect new structure
echo ""
echo "📝 Updating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Build outputs
packages/web/.next/
packages/web/out/
packages/web/build/
packages/api/dist/
packages/socket/dist/

# Environment files
.env
.env.local
.env.*.local
packages/api/.env
packages/socket/.env
packages/web/.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
logs/

# Testing
coverage/
.nyc_output/

# Misc
*.pem
.cache/
EOF

echo "✅ .gitignore updated"

# Create a consolidated README at root
echo ""
echo "📄 Creating root-level README..."
cat > README.md << 'EOF'
# The Chatroom

A real-time chat application with multi-tier authentication, language-specific lounges, and marketplace features.

## 📦 Monorepo Structure

This project uses npm workspaces with four packages:

```
The-Chatroom/
├── packages/
│   ├── api/          # Express REST API + Prisma
│   ├── socket/       # Socket.IO WebSocket server
│   ├── web/          # Next.js 14 frontend
│   └── shared/       # Shared types and utilities
├── docs/             # Documentation
└── package.json      # Workspace root
```

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Set Up Environment
1. Copy `.env.example` files in each package:
   - `packages/api/.env`
   - `packages/socket/.env`
   - `packages/web/.env.local`

2. Configure database and secrets

### Initialize Database
```bash
cd packages/api
npm run prisma:generate
npm run prisma:migrate
```

### Run Development Servers
```bash
# All services
npm run dev

# Or individually:
npm run dev:api      # http://localhost:3001
npm run dev:socket   # http://localhost:3002
npm run dev:web      # http://localhost:3000
```

## 📚 Documentation

- [Complete Setup Guide](APPLICATIONS.md)
- [Task Tracker](TASKS.md)
- [TODO List](TODO.md)
- [Contributing Guide](CONTRIBUTING.md)

## 📋 Project Status

See [TODO.md](TODO.md) for current tasks and priorities.

## 🔗 Links

- **Repository:** https://github.com/telleriacarolina/The-Chatroom
- **Issues:** https://github.com/telleriacarolina/The-Chatroom/issues
- **Project Board:** https://github.com/users/telleriacarolina/projects

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.
EOF

echo "✅ README.md updated"

echo ""
echo "🎉 Consolidation complete!"
echo ""
echo "📊 Final structure:"
echo "   packages/api/    - Backend REST API"
echo "   packages/socket/ - WebSocket server"
echo "   packages/web/    - Next.js frontend"
echo "   packages/shared/ - Shared code"
echo ""
echo "🗂️  All files consolidated into packages/"
echo "📝 Root README.md updated with monorepo info"
echo "🧹 Old migration scripts removed"
echo ""
echo "✅ Project is now fully consolidated!"
