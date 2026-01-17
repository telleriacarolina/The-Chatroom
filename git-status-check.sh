#!/bin/bash
# Check git status and provide detailed information

set -e

echo "=== Git Status Check ==="
echo ""

# Check current branch
BRANCH=$(git branch --show-current)
echo "📍 Current branch: $BRANCH"
echo ""

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    echo "Run: git add -A && git commit -m 'your message'"
    exit 1
fi

# Check for unpushed commits
UNPUSHED=$(git log @{u}.. --oneline 2>/dev/null | wc -l)
if [ $UNPUSHED -gt 0 ]; then
    echo "📤 You have $UNPUSHED unpushed commit(s):"
    git log @{u}.. --oneline
    echo ""
    echo "Run: git push origin $BRANCH"
    exit 0
fi

# Check if remote exists
if ! git remote get-url origin &>/dev/null; then
    echo "❌ No remote 'origin' configured"
    echo ""
    echo "To add a remote:"
    echo "  git remote add origin <repository-url>"
    exit 1
fi

REMOTE_URL=$(git remote get-url origin)
echo "🔗 Remote: $REMOTE_URL"
echo ""


echo "✅ Everything is up to date!"
echo ""

# Show git commit signing info
echo "=== Git Commit Signing Info ==="
echo "User Name:    $(git config --get user.name)"
echo "User Email:   $(git config --get user.email)"
echo "Signing Key:  $(git config --get user.signingkey)"
echo "GPG Program:  $(git config --get gpg.program)"
echo "Commit GPGSign: $(git config --get commit.gpgsign)"
