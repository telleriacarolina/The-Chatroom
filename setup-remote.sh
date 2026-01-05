#!/bin/bash
# Setup git remote and upstream branch

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== Git Remote Setup ===${NC}"
echo ""

# Get current branch
BRANCH=$(git branch --show-current)
echo -e "📍 Current branch: ${GREEN}$BRANCH${NC}"

# Check if remote 'origin' already exists
if git remote get-url origin &>/dev/null; then
    EXISTING_REMOTE=$(git remote get-url origin)
    echo -e "${YELLOW}⚠️  Remote 'origin' already exists:${NC}"
    echo "   $EXISTING_REMOTE"
    echo ""
    read -p "Do you want to update it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter new repository URL: " REPO_URL
        git remote set-url origin "$REPO_URL"
        echo -e "${GREEN}✅ Remote updated!${NC}"
    fi
else
    # No remote exists, prompt for URL
    echo -e "${YELLOW}No remote 'origin' found.${NC}"
    echo ""
    echo "Enter repository URL (examples):"
    echo "  • HTTPS: https://github.com/username/The-Chatroom.git"
    echo "  • SSH:   git@github.com:username/The-Chatroom.git"
    echo ""
    read -p "Repository URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo -e "${RED}❌ No URL provided. Exiting.${NC}"
        exit 1
    fi
    
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✅ Remote 'origin' added!${NC}"
fi

echo ""
REMOTE_URL=$(git remote get-url origin)
echo -e "🔗 Remote: ${GREEN}$REMOTE_URL${NC}"
echo ""

# Check if there are commits to push
if [ -z "$(git log --oneline)" ]; then
    echo -e "${RED}❌ No commits found. Create an initial commit first.${NC}"
    exit 1
fi

# Set upstream and push
echo -e "${YELLOW}Setting upstream branch and pushing...${NC}"
if git push -u origin "$BRANCH"; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to remote and set upstream!${NC}"
    echo -e "   Branch '${GREEN}$BRANCH${NC}' is now tracking 'origin/$BRANCH'"
else
    echo ""
    echo -e "${RED}❌ Push failed. Common issues:${NC}"
    echo "   • Authentication required (check credentials)"
    echo "   • Branch protection rules"
    echo "   • Network connectivity"
    echo ""
    echo "Try manually: git push -u origin $BRANCH"
    exit 1
fi
