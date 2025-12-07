#!/bin/bash

echo "🧹 JUNXOR - Complete Clean Start"
echo "=================================="

# 1. Kill all processes
echo "1. Killing all Metro/Expo processes..."
pkill -9 -f "expo" 2>/dev/null || true
pkill -9 -f "metro" 2>/dev/null || true
pkill -9 -f "node.*start" 2>/dev/null || true
sleep 2

# 2. Clear ALL caches
echo "2. Clearing all caches..."
rm -rf .expo .metro-cache node_modules/.cache 2>/dev/null || true
rm -rf /tmp/metro-* /tmp/haste-* /tmp/react-* 2>/dev/null || true
watchman watch-del-all 2>/dev/null || true

# 3. Clear npm cache
echo "3. Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# 4. Verify setup
echo "4. Verifying setup..."
if [ ! -f "babel.config.js" ]; then
    echo "❌ ERROR: babel.config.js not found!"
    exit 1
fi

if [ ! -d "contexts" ]; then
    echo "❌ ERROR: contexts/ folder not found!"
    exit 1
fi

if [ ! -f "contexts/AuthContext.tsx" ]; then
    echo "❌ ERROR: contexts/AuthContext.tsx not found!"
    exit 1
fi

echo "✅ All files in place"

# 5. Start Metro with clean cache
echo ""
echo "🚀 Starting Metro Bundler with clean cache..."
echo ""
npx expo start --clear

