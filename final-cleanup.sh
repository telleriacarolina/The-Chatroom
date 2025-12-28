#!/bin/bash

echo "🧹 Final cleanup of remaining old directories..."

# Remove remaining old directories
rm -rf components

echo ""
echo "✅ Final cleanup complete!"
echo ""
echo "📦 Monorepo structure is now clean:"
ls -1 | grep -E "^(packages|prisma|public|docs|\.github)$"
