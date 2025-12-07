# JUNXOR Debug & Troubleshooting Guide

## 🔍 Enable Debug Logs

### Method 1: Expo CLI Debug Mode
```bash
# Start with verbose logging
EXPO_DEBUG=true npx expo start --clear

# Or with specific log level
DEBUG=* npx expo start --clear
```

### Method 2: Metro Bundler Logs
```bash
# See detailed Metro bundler logs
npx expo start --clear --verbose
```

### Method 3: React Native Logs
```bash
# For Android
npx react-native log-android

# Or use adb directly
adb logcat *:S ReactNative:V ReactNativeJS:V
```

### Method 4: Check Build Errors
```bash
# See detailed build output
npx expo start --clear 2>&1 | tee build.log
```

## 🐛 Common Issues & Fixes

### Issue 1: "Unable to resolve @/contexts/AuthContext"

**Symptoms:**
```
Android Bundling failed
Unable to resolve "../../contexts/AuthContext" from "app/(tabs)/badges.tsx"
```

**Root Cause:** Metro cache not cleared after adding babel config

**Fix:**
```bash
# Nuclear option - clear everything
rm -rf node_modules/.cache .expo .metro-cache android/.gradle ios/build
watchman watch-del-all 2>/dev/null || true
npm cache clean --force

# Reinstall if needed
npm install

# Start fresh
npx expo start --clear
```

### Issue 2: Babel Config Not Loading

**Check:**
```bash
# Verify babel config exists
cat babel.config.js

# Should show module-resolver plugin
```

**Fix:**
```bash
# Ensure babel-plugin-module-resolver is installed
npm install --save-dev babel-plugin-module-resolver

# Restart Metro
npx expo start -c
```

### Issue 3: TypeScript Path Mapping Not Working

**Check:**
```bash
# Verify tsconfig.json has paths
cat tsconfig.json | grep -A 3 paths
```

**Note:** TypeScript paths are for IDE only. Metro uses Babel config.

### Issue 4: Module Not Found After Adding Files

**Fix:**
```bash
# Metro doesn't always detect new files
# Kill all Metro processes
pkill -f "expo/start" || true
pkill -f "metro" || true

# Start clean
npx expo start --clear
```

## 🔧 Complete Cache Clear Script

Save this as `clear-cache.sh`:

```bash
#!/bin/bash
echo "🧹 Clearing all caches..."

# Kill Metro bundler
pkill -f "expo/start" || true
pkill -f "metro" || true

# Clear watchman (if installed)
watchman watch-del-all 2>/dev/null || true

# Clear Metro cache
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true

# Clear Expo cache
rm -rf .expo 2>/dev/null || true
rm -rf .metro-cache 2>/dev/null || true

# Clear node modules cache
rm -rf node_modules/.cache 2>/dev/null || true

# Clear build caches
rm -rf android/.gradle 2>/dev/null || true
rm -rf android/build 2>/dev/null || true
rm -rf ios/build 2>/dev/null || true

# Clear npm cache
npm cache clean --force 2>/dev/null || true

echo "✅ All caches cleared!"
echo "🚀 Run: npx expo start --clear"
```

**Usage:**
```bash
chmod +x clear-cache.sh
./clear-cache.sh
npx expo start --clear
```

## 📱 Android-Specific Debugging

### View Android Logs in Real-Time
```bash
# Filter for React Native and app logs
adb logcat -s ReactNative:V ReactNativeJS:V ExpoModulesCore:V

# Or see everything
adb logcat | grep -i "junxor\|react\|expo"
```

### Check Connected Devices
```bash
adb devices
```

### Clear Android Build Cache
```bash
cd android
./gradlew clean
cd ..
npx expo start --clear
```

### Rebuild Android App
```bash
# Full rebuild
cd android
./gradlew clean
cd ..
npx expo run:android
```

## 🌐 Web-Specific Debugging

### Browser Console Logs
```bash
# Start web
npx expo start --web

# Then open browser DevTools (F12)
# Check Console tab for errors
```

### Clear Web Cache
```bash
rm -rf .expo/web
npx expo start --web --clear
```

## 📊 Performance Debugging

### Bundle Size Analysis
```bash
# See what's in your bundle
npx expo export --platform web --output-dir dist
du -sh dist/*

# Or use Metro's bundle visualizer
npx react-native bundle-visualizer
```

### Check Bundle Time
```bash
# Time the bundling
time npx expo export --platform android
```

## 🔍 Module Resolution Debugging

### Test Import Resolution
```bash
# Check if Metro can resolve a module
node -e "console.log(require.resolve('@/contexts/AuthContext'))"

# Should show the full path
```

### Verify Babel Transform
```bash
# See what Babel does to your imports
npx babel app/(tabs)/badges.tsx --config-file ./babel.config.js

# Look for transformed imports
```

### Check Metro Config
```bash
# If you have a metro.config.js
cat metro.config.js

# Ensure it's not overriding Babel settings
```

## 🚨 Emergency Reset

If nothing works, nuclear reset:

```bash
# 1. Stop everything
pkill -f "expo/start" || true
pkill -f "metro" || true
pkill -f "node" || true

# 2. Remove all caches and builds
rm -rf node_modules
rm -rf .expo
rm -rf .metro-cache
rm -rf android/.gradle
rm -rf android/build
rm -rf ios/build
rm -rf package-lock.json
watchman watch-del-all 2>/dev/null || true

# 3. Reinstall
npm install

# 4. Start fresh
npx expo start --clear
```

## 📝 Logging Best Practices

### Add Debug Logs to Your Code
```typescript
// In app/_layout.tsx
console.log('🚀 App starting...');
console.log('📦 Env vars:', {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL?.slice(0, 20) + '...',
  hasAnonKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
});

// In contexts/AuthContext.tsx
console.log('🔐 Auth context initializing...');
```

### Check Logs
```bash
# Web: Browser console
# Android: adb logcat
# iOS: Xcode console or react-native log-ios
```

## 🔧 Quick Diagnostic Commands

```bash
# Check if babel config is valid
node -e "require('./babel.config.js')"

# Check if contexts folder exists
ls -la contexts/

# Check if imports work from root
node -e "const path = require('path'); console.log(path.resolve('./contexts/AuthContext.tsx'))"

# Verify Metro is finding your files
npx expo start --clear 2>&1 | grep -i "context\|babel"
```

## 📞 Get Help

If you're still stuck:

1. Check the Metro bundler output carefully
2. Look for "Unable to resolve" errors
3. Verify file paths are correct
4. Ensure babel.config.js is in project root
5. Make sure babel-plugin-module-resolver is installed
6. Try the nuclear reset above

## 🎯 Success Indicators

You know it's working when:

✅ Metro starts without errors
✅ No "Unable to resolve" messages
✅ Bundling completes successfully
✅ App loads on device/emulator
✅ Console shows your debug logs

## 🐛 Report Issues

If debugging doesn't help, collect these:

```bash
# 1. Environment info
npx expo-env-info

# 2. Build logs
npx expo start --clear 2>&1 > debug.log

# 3. Package versions
cat package.json

# 4. Babel config
cat babel.config.js

# 5. File structure
find . -name "*.tsx" -not -path "./node_modules/*" | head -20
```
