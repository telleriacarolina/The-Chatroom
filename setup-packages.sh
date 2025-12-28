#!/bin/bash

echo "🚀 Setting up The Chatroom monorepo with all packages..."
echo ""

# Install all dependencies
echo "📦 Installing dependencies..."
npm install

# Build shared package first (other packages depend on it)
echo ""
echo "🔨 Building @chatroom/shared..."
npm run build -w @chatroom/shared --if-present

# Build TypeScript packages
echo ""
echo "🔨 Building TypeScript packages..."
npm run build:email
npm run build:analytics
npm run build:cli

# Build Next.js packages
echo ""
echo "🔨 Building Next.js packages..."
npm run build:web --if-present
npm run build:admin --if-present

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Available commands:"
echo "  npm run dev              # Start all services"
echo "  npm run dev:api          # API server (port 3001)"
echo "  npm run dev:socket       # Socket.IO (port 3002)"
echo "  npm run dev:web          # Frontend (port 3000)"
echo "  npm run dev:admin        # Admin panel (port 3003)"
echo "  npm run dev:mobile       # Mobile app (Expo)"
echo "  npm run cli -- --help    # CLI tools"
echo ""
echo "📚 Documentation: NEW_PACKAGES.md"
echo ""
