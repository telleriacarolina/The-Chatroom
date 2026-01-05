#!/bin/bash
# Commit all changes to git

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Staging all changes...${NC}"
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo -e "${GREEN}No changes to commit.${NC}"
    exit 0
fi

# Show what will be committed
echo -e "${YELLOW}Changes to be committed:${NC}"
git status --short

# Get commit message from argument or use default
COMMIT_MSG="${1:-chore: clean build artifacts and workspace}"

echo -e "${YELLOW}Committing with message: ${COMMIT_MSG}${NC}"
git commit -m "$COMMIT_MSG"

echo -e "${GREEN}✅ Changes committed successfully!${NC}"

# Ask if user wants to push
read -p "Push to remote? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Pushing to remote...${NC}"
    git push
    echo -e "${GREEN}✅ Changes pushed successfully!${NC}"
fi
