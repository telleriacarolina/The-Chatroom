#!/bin/bash
# Test and verify forked repositories

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== Testing Forked Repositories ===${NC}"
echo ""

# Get current GitHub user
GITHUB_USER=$(gh api user -q .login 2>/dev/null)
if [ -z "$GITHUB_USER" ]; then
    echo -e "${RED}❌ Could not determine GitHub username${NC}"
    exit 1
fi

echo -e "👤 GitHub User: ${GREEN}$GITHUB_USER${NC}"
echo ""

# List all forks
echo -e "${YELLOW}Your forked repositories:${NC}"
gh repo list --fork --json name,owner,parent,url --limit 10

echo ""
echo -e "${YELLOW}=== Checking specific forks ===${NC}"
echo ""

# Check The-Chatroom fork
echo -e "1️⃣  ${YELLOW}The-Chatroom fork:${NC}"
if gh repo view "$GITHUB_USER/The-Chatroom" &>/dev/null; then
    CHATROOM_URL=$(gh repo view "$GITHUB_USER/The-Chatroom" --json url -q .url)
    echo -e "   ${GREEN}✅ Found: $CHATROOM_URL${NC}"
else
    echo -e "   ${RED}❌ Not found${NC}"
fi

echo ""

# Check LEAVINGROOM4xFactor fork
echo -e "2️⃣  ${YELLOW}LEAVINGROOM4xFactor fork:${NC}"
if gh repo view "$GITHUB_USER/LEAVINGROOM4xFactor" &>/dev/null; then
    XFACTOR_URL=$(gh repo view "$GITHUB_USER/LEAVINGROOM4xFactor" --json url -q .url)
    echo -e "   ${GREEN}✅ Found: $XFACTOR_URL${NC}"
else
    echo -e "   ${RED}❌ Not found${NC}"
fi

echo ""
echo -e "${YELLOW}=== Next Steps ===${NC}"
echo ""
echo "Update local remotes to use your forks:"
echo ""
echo -e "${YELLOW}Main repo:${NC}"
echo "  git remote add origin https://github.com/$GITHUB_USER/The-Chatroom.git"
echo "  git push -u origin main"
echo ""
echo -e "${YELLOW}X-FACTOR repo:${NC}"
echo "  cd 'LEAVING ROOM FOR THE X FACTOR'"
echo "  git remote set-url origin https://github.com/$GITHUB_USER/LEAVINGROOM4xFactor.git"
echo "  git push origin main"
