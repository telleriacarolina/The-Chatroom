#!/bin/bash
# Fork both repositories using GitHub CLI

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== Forking Repositories ===${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it: https://cli.github.com/"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
echo ""

# Fork main repository
echo -e "${YELLOW}1. Forking The-Chatroom...${NC}"
MAIN_REPO="telleriacarolina/The-Chatroom"
echo "   Source: $MAIN_REPO"

if gh repo fork "$MAIN_REPO" --clone=false 2>/dev/null; then
    echo -e "${GREEN}✅ Forked $MAIN_REPO${NC}"
else
    echo -e "${YELLOW}⚠️  Fork might already exist or error occurred${NC}"
fi

echo ""

# Fork X-FACTOR repository
echo -e "${YELLOW}2. Forking LEAVINGROOM4xFactor...${NC}"
XFACTOR_REPO="telleriacarolina/LEAVINGROOM4xFactor"
echo "   Source: $XFACTOR_REPO"

if gh repo fork "$XFACTOR_REPO" --clone=false 2>/dev/null; then
    echo -e "${GREEN}✅ Forked $XFACTOR_REPO${NC}"
else
    echo -e "${YELLOW}⚠️  Fork might already exist or error occurred${NC}"
fi

echo ""
echo -e "${GREEN}=== Fork Summary ===${NC}"
echo ""
echo "To update your local remotes to point to your forks:"
echo ""
echo -e "${YELLOW}Main repo:${NC}"
echo "  cd /workspaces/The-Chatroom"
echo "  git remote add origin https://github.com/YOUR_USERNAME/The-Chatroom.git"
echo "  git push -u origin main"
echo ""
echo -e "${YELLOW}X-FACTOR repo:${NC}"
echo "  cd '/workspaces/The-Chatroom/LEAVING ROOM FOR THE X FACTOR'"
echo "  git remote set-url origin https://github.com/YOUR_USERNAME/LEAVINGROOM4xFactor.git"
echo "  git push origin main"
echo ""
echo "View your forks:"
echo "  gh repo list --fork"
