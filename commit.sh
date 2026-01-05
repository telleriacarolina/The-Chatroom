#!/bin/bash

# Git Commit Helper Script for The Chatroom Project
# This script helps you commit changes following project conventions

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== The Chatroom - Git Commit Helper ===${NC}\n"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Show current status
echo -e "${BLUE}Current branch:${NC} $(git branch --show-current)"
echo -e "${BLUE}Current status:${NC}"
git status --short

# Check if there are any changes to commit
if git diff --quiet && git diff --cached --quiet; then
    echo -e "\n${YELLOW}No changes to commit. Working tree clean.${NC}"
    exit 0
fi

echo ""

# Ask for commit type
echo -e "${BLUE}Select commit type:${NC}"
echo "1) feat     - A new feature"
echo "2) fix      - A bug fix"
echo "3) docs     - Documentation changes"
echo "4) style    - Code style changes (formatting, etc.)"
echo "5) refactor - Code refactoring"
echo "6) test     - Adding or updating tests"
echo "7) chore    - Other changes (build, dependencies, etc.)"
read -p "Enter number (1-7): " commit_type_num

case $commit_type_num in
    1) commit_type="feat";;
    2) commit_type="fix";;
    3) commit_type="docs";;
    4) commit_type="style";;
    5) commit_type="refactor";;
    6) commit_type="test";;
    7) commit_type="chore";;
    *) echo -e "${RED}Invalid selection${NC}"; exit 1;;
esac

# Ask for scope (optional)
read -p "Enter scope (e.g., web, api, socket) - optional, press Enter to skip: " scope

# Ask for commit message
read -p "Enter commit message: " message

if [ -z "$message" ]; then
    echo -e "${RED}Error: Commit message cannot be empty${NC}"
    exit 1
fi

# Build commit message
if [ -z "$scope" ]; then
    full_message="${commit_type}: ${message}"
else
    full_message="${commit_type}(${scope}): ${message}"
fi

echo ""
echo -e "${BLUE}Commit message will be:${NC}"
echo -e "${GREEN}${full_message}${NC}"
echo ""

# Ask for confirmation
read -p "Do you want to stage and commit these changes? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo -e "${YELLOW}Commit cancelled${NC}"
    exit 0
fi

# Show what will be staged
echo -e "\n${BLUE}The following changes will be staged:${NC}"
git status --short

# Stage all changes from the repository root
echo -e "\n${BLUE}Staging changes from repository root...${NC}"
repo_root="$(git rev-parse --show-toplevel)"
git -C "$repo_root" add -A

# Show final staged changes
echo -e "\n${BLUE}Staged changes:${NC}"
git diff --cached --stat

# Commit
echo -e "${BLUE}Committing...${NC}"
git commit -m "$full_message"

echo -e "\n${GREEN}✓ Successfully committed!${NC}"

# Ask if user wants to push
read -p "Do you want to push to remote? (y/n): " push_confirm

if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
    current_branch=$(git branch --show-current)
    echo -e "${BLUE}Pushing to origin/${current_branch}...${NC}"
    git push origin "$current_branch"
    echo -e "\n${GREEN}✓ Successfully pushed!${NC}"
else
    echo -e "${YELLOW}Changes committed locally. Remember to push later.${NC}"
fi

echo -e "\n${GREEN}Done!${NC}"
