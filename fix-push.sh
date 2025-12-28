#!/bin/bash
# Fix push issues - pull, merge, and push with proper auth

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== Fixing Push Issues ===${NC}"
echo ""

# Main repo - pull and merge first
echo -e "${YELLOW}1️⃣  The-Chatroom - Pulling remote changes${NC}"
cd /workspaces/The-Chatroom

git fetch origin
git pull origin main --no-rebase --allow-unrelated-histories || {
    echo -e "${RED}   Merge conflict or error - attempting rebase${NC}"
    git pull origin main --rebase || echo "   Manual intervention needed"
}

echo "   Pushing..."
if git push origin main; then
    echo -e "${GREEN}✅ The-Chatroom pushed successfully${NC}"
else
    echo -e "${RED}❌ Still failed - try force push: git push origin main --force${NC}"
fi

echo ""

# X-FACTOR repo - use gh auth for proper credentials
echo -e "${YELLOW}2️⃣  LEAVINGROOM4xFactor - Using GH CLI for auth${NC}"
cd "/workspaces/The-Chatroom/LEAVING ROOM FOR THE X FACTOR"

# Configure git to use gh as credential helper
git config --local credential.helper ""
git config --local --add credential.helper '!gh auth git-credential'

# Try SSH instead if HTTPS fails
CURRENT_URL=$(git remote get-url origin)
if [[ "$CURRENT_URL" == https* ]]; then
    SSH_URL="git@github.com:telleriacarolina/LEAVINGROOM4xFactor.git"
    echo "   Switching to SSH: $SSH_URL"
    git remote set-url origin "$SSH_URL"
fi

echo "   Pushing..."
if git push origin main; then
    echo -e "${GREEN}✅ LEAVINGROOM4xFactor pushed successfully${NC}"
else
    echo -e "${RED}❌ Still failed${NC}"
    echo "   Try: gh auth refresh -s write:packages,repo"
    echo "   Or setup SSH: ssh-keygen -t ed25519 -C 'your_email@example.com'"
fi

echo ""
echo -e "${GREEN}=== Done ===${NC}"
