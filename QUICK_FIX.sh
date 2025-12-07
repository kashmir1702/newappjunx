#!/bin/bash

echo "🔧 JUNXOR Quick Fix Script"
echo "=========================="
echo ""

# Kill existing Metro processes
echo "1️⃣ Stopping Metro bundler..."
pkill -f "expo/start" || true
pkill -f "metro" || true
sleep 2

# Clear all caches
echo "2️⃣ Clearing all caches..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .expo 2>/dev/null || true
rm -rf .metro-cache 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true

# Clear watchman if available
if command -v watchman &> /dev/null; then
    echo "3️⃣ Clearing watchman..."
    watchman watch-del-all 2>/dev/null || true
else
    echo "3️⃣ Watchman not installed (skipping)"
fi

# Verify babel config
echo "4️⃣ Verifying babel config..."
if [ -f "babel.config.js" ]; then
    echo "   ✅ babel.config.js exists"
else
    echo "   ❌ babel.config.js missing!"
    exit 1
fi

# Verify source folders
echo "5️⃣ Verifying source folders..."
for folder in contexts lib types; do
    if [ -d "$folder" ]; then
        echo "   ✅ $folder/ exists"
    else
        echo "   ❌ $folder/ missing!"
        exit 1
    fi
done

# Verify key files
echo "6️⃣ Verifying key files..."
for file in "contexts/AuthContext.tsx" "lib/supabase.ts" "lib/api.ts" "types/database.ts"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing!"
        exit 1
    fi
done

echo ""
echo "✅ All checks passed!"
echo ""
echo "🚀 Starting Metro bundler with clear cache..."
echo ""
echo "Run this command:"
echo "  npx expo start --clear"
echo ""
echo "Or for Android specifically:"
echo "  npx expo start --clear --android"
echo ""
echo "📱 Then scan QR code or press 'a' for Android"
echo ""
