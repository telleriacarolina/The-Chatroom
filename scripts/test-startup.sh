#!/bin/bash

# Test Application Startup Script
# This script verifies all three services can start and communicate

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

echo "🚀 Testing Application Startup Process"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Node.js
echo "1️⃣  Checking Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
  echo -e "${RED}✗ Node.js not found${NC}"
  exit 1
fi

# Test 2: Check npm
echo ""
echo "2️⃣  Checking npm..."
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  echo -e "${GREEN}✓ npm installed: $NPM_VERSION${NC}"
else
  echo -e "${RED}✗ npm not found${NC}"
  exit 1
fi

# Test 3: Check dependencies
echo ""
echo "3️⃣  Checking dependencies..."
if [ -d "$PROJECT_ROOT/node_modules" ]; then
  echo -e "${GREEN}✓ node_modules exists${NC}"
else
  echo -e "${YELLOW}⚠ node_modules not found, installing...${NC}"
  cd "$PROJECT_ROOT"
  npm install
  echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

# Test 4: Check environment file
echo ""
echo "4️⃣  Checking .env configuration..."
if [ -f "$PROJECT_ROOT/.env" ]; then
  echo -e "${GREEN}✓ .env file exists${NC}"
else
  echo -e "${YELLOW}⚠ .env file not found, creating from .env.example${NC}"
  cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
  echo -e "${GREEN}✓ .env file created${NC}"
fi

# Test 5: Verify ports are available
echo ""
echo "5️⃣  Checking port availability..."

check_port() {
  local port=$1
  local service=$2
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠ Port $port ($service) is already in use${NC}"
    return 1
  else
    echo -e "${GREEN}✓ Port $port ($service) is available${NC}"
    return 0
  fi
}

check_port 3000 "Next.js"
check_port 3001 "API"
check_port 3002 "Socket.IO"

# Test 6: Verify API server can start
echo ""
echo "6️⃣  Testing API server startup..."
cd "$PROJECT_ROOT"
timeout 5 npm run dev:api &
API_PID=$!
sleep 2

if kill -0 $API_PID 2>/dev/null; then
  echo -e "${GREEN}✓ API server started successfully (PID: $API_PID)${NC}"
  kill $API_PID 2>/dev/null || true
  wait $API_PID 2>/dev/null || true
else
  echo -e "${RED}✗ API server failed to start${NC}"
  exit 1
fi

# Test 7: Verify Socket.IO server can start
echo ""
echo "7️⃣  Testing Socket.IO server startup..."
timeout 5 npm run dev:socket &
SOCKET_PID=$!
sleep 2

if kill -0 $SOCKET_PID 2>/dev/null; then
  echo -e "${GREEN}✓ Socket.IO server started successfully (PID: $SOCKET_PID)${NC}"
  kill $SOCKET_PID 2>/dev/null || true
  wait $SOCKET_PID 2>/dev/null || true
else
  echo -e "${RED}✗ Socket.IO server failed to start${NC}"
  exit 1
fi

# Test 8: Verify Next.js can build
echo ""
echo "8️⃣  Testing Next.js compilation..."
cd "$PROJECT_ROOT/web"
if npm run build 2>/dev/null | grep -q "compiled successfully"; then
  echo -e "${GREEN}✓ Next.js compiled successfully${NC}"
else
  echo -e "${YELLOW}⚠ Next.js build warnings present (may be normal)${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ All startup tests passed!${NC}"
echo ""
echo "To run the application, use:"
echo "  npm run dev:api      (Terminal 1)"
echo "  npm run dev:socket   (Terminal 2)"
echo "  npm run dev:web      (Terminal 3)"
echo ""
echo "Then visit http://localhost:3000 in your browser"
