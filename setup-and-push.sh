#!/bin/bash
# Automatically setup remotes and push both repositories

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== Setting up remotes and pushing ===${NC}"
echo ""

GITHUB_USER=$(gh api user -q .login 2>/dev/null || echo "telleriacarolina")

# Function to setup and push a repo
setup_and_push() {
    local repo_path="$1"
    local repo_name="$2"
    local remote_url="$3"
    
    echo -e "${YELLOW}📦 Processing: $repo_name${NC}"
    cd "$repo_path"
    
    # Get current branch
    BRANCH=$(git branch --show-current)
    echo "   Branch: $BRANCH"
    
    # Check if origin exists
    if git remote get-url origin &>/dev/null; then
        CURRENT_ORIGIN=$(git remote get-url origin)
        echo "   Current origin: $CURRENT_ORIGIN"
        
        if [ "$CURRENT_ORIGIN" != "$remote_url" ]; then
            echo "   Updating origin URL..."
            git remote set-url origin "$remote_url"
        fi
    else
        echo "   Adding origin..."
        git remote add origin "$remote_url"
    fi
    
    echo "   Remote: $remote_url"
    
    # Check for uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "   Staging and committing changes..."
        git add -A
        git commit -m "chore: sync workspace changes" || echo "   No changes to commit"
    fi
    
    # Push to remote
    echo "   Pushing to origin/$BRANCH..."
    if git push -u origin "$BRANCH" 2>&1; then
        echo -e "   ${GREEN}✅ Successfully pushed!${NC}"
    else
        echo -e "   ${RED}❌ Push failed - may need force push or authentication${NC}"
        echo "   Try manually: cd '$repo_path' && git push -u origin $BRANCH --force"
    fi
    
    echo ""
}

# Setup main repo
setup_and_push \
    "/workspaces/The-Chatroom" \
    "The-Chatroom" \
    "https://github.com/$GITHUB_USER/The-Chatroom.git"

# Setup X-FACTOR repo
setup_and_push \
    "/workspaces/The-Chatroom/LEAVING ROOM FOR THE X FACTOR" \
    "LEAVINGROOM4xFactor" \
    "https://github.com/$GITHUB_USER/LEAVINGROOM4xFactor.git"

echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "View your repositories:"
echo "  https://github.com/$GITHUB_USER/The-Chatroom"
echo "  https://github.com/$GITHUB_USER/LEAVINGROOM4xFactor"
