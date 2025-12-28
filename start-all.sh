#!/bin/bash

# The Chatroom - All-in-One Startup Script
# This script starts all three services required for the application

set -e  # Exit on error

echo "🚀 Starting The Chatroom Application..."
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
    npm install
fi

# Check if workspace dependencies are installed
if [ ! -d "packages/api/node_modules" ] || [ ! -d "packages/socket/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing workspace dependencies...${NC}"
    npm install --workspaces
fi

# Check environment variables
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found. Please create one from .env.example${NC}"
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${RED}🛑 Shutting down all services...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Trap CTRL+C and cleanup
trap cleanup SIGINT SIGTERM

# Create log directory
mkdir -p logs

echo -e "${BLUE}Starting services...${NC}"
echo ""

# Start API Server (port 3001)
echo -e "${GREEN}✓ Starting API Server (port 3001)...${NC}"
npm run dev:api > logs/api.log 2>&1 &
API_PID=$!
sleep 2

# Start Socket.IO Server (port 3002)
echo -e "${GREEN}✓ Starting Socket.IO Server (port 3002)...${NC}"
npm run dev:socket > logs/socket.log 2>&1 &
SOCKET_PID=$!
sleep 2

# Start Next.js Frontend (port 3000)
echo -e "${GREEN}✓ Starting Next.js Frontend (port 3000)...${NC}"
npm run dev:web > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

echo ""
echo ""
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo "========================================"
echo -e "${BLUE}🌐 Open the app:${NC}     ${CYAN}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}📡 API Server:${NC}       http://localhost:3001"
echo -e "${BLUE}🔌 Socket.IO Server:${NC} http://localhost:3002"
echo -e "${BLUE}📊 Health Check:${NC}     http://localhost:3001/health"
echo "========================================"
echo -e "${YELLOW}📋 View logs:${NC}        ./start-all.sh --logs"
echo -e "${YELLOW}❓ Get help:${NC}         ./start-all.sh --help"
echo -e "${YELLOW}💡 Stop services:${NC}    Press CTRL+C"
echo ""

# Monitor processes
while true; do
    # Check if all processes are still running
    if ! kill -0 $API_PID 2>/dev/null; then
        echo -e "${RED}❌ API Server crashed! Check logs/api.log${NC}"
        cleanup
    fi
    if ! kill -0 $SOCKET_PID 2>/dev/null; then
        echo -e "${RED}❌ Socket.IO Server crashed! Check logs/socket.log${NC}"
        cleanup
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend crashed! Check logs/frontend.log${NC}"
        cleanup
    fi
    sleep 5
done
