# Rebuild Instructions for Sharing Fix

## ⚠️ IMPORTANT: Rebuild Required

The sharing fixes include changes to `app.json` intent filters, which require a **new native build**. These changes will NOT work with just a JavaScript reload or hot reload.

## Quick Rebuild (Recommended)

### Option 1: EAS Build (Production/Testing)
```bash
# Build development version
eas build --platform android --profile development

# Or build production version
eas build --platform android --profile production
```

### Option 2: Local Build (Faster for testing)
```bash
# Make sure you have Android Studio and SDK installed
npx expo run:android
```

This will:
1. Generate a new Android build with updated intent filters
2. Install it on your connected device/emulator
3. Start the Metro bundler

## Step-by-Step Instructions

### 1. Clean Previous Build (Optional but Recommended)
```bash
# Remove old build artifacts
rm -rf android/app/build
rm -rf node_modules
npm install
```

### 2. Build the App

#### Using EAS Build:
```bash
# Login to Expo if needed
eas login

# Create a development build
eas build --platform android --profile development --local

# Wait for build to complete (5-15 minutes)
```

#### Using Local Build:
```bash
# Ensure ANDROID_HOME is set
echo $ANDROID_HOME

# Run the build
npx expo run:android

# If you get errors, try:
npx expo prebuild --clean
npx expo run:android
```

### 3. Install on Device

#### For EAS Build:
1. Download the APK from EAS build page
2. Transfer to your Android device
3. Install the APK (allow installation from unknown sources if needed)

#### For Local Build:
The app is automatically installed when you run `npx expo run:android`

### 4. Test Sharing

#### Test Instagram:
1. Open Instagram app
2. Find any reel or post
3. Tap Share → More → MatMind
4. MatMind should open with the add page pre-filled

#### Test YouTube:
1. Open YouTube app
2. Find any video
3. Tap Share → MatMind
4. MatMind should open with the add page pre-filled

### 5. Verify Changes

Check the console logs (while app is running via Metro):
```bash
npx expo start --dev-client
```

Look for these logs when sharing:
```
✅ ShareHandler is ready
🔗 Incoming share detected: https://...
✅ Detected YouTube URL (or Instagram URL)
🚀 Navigation URL: /technique-form?shared_url=...
✅ Navigation triggered successfully
```

## Troubleshooting

### Build Fails?

**Error**: "ANDROID_HOME is not set"
```bash
# On Windows
setx ANDROID_HOME "C:\Users\YourName\AppData\Local\Android\Sdk"

# On Mac/Linux
export ANDROID_HOME=~/Android/Sdk
```

**Error**: "Gradle build failed"
```bash
# Clean gradle cache
cd android
./gradlew clean
cd ..

# Try again
npx expo run:android
```

**Error**: "EAS Build failed"
- Check the build logs on expo.dev
- Ensure your `app.json` is valid JSON
- Try building locally instead

### Sharing Still Not Working?

1. **Uninstall old app completely**:
   ```bash
   adb uninstall com.matmind.app
   ```

2. **Install new build**:
   ```bash
   adb install path/to/new-app.apk
   ```

3. **Clear app data** (if keeping installed):
   - Settings → Apps → MatMind → Storage → Clear Data

4. **Test with ADB** (to verify intent filters):
   ```bash
   adb shell am start -a android.intent.action.SEND \
     -t text/plain \
     --es android.intent.extra.TEXT "https://www.youtube.com/watch?v=test" \
     com.matmind.app
   ```

### Verify Intent Filters Were Applied

After building, you can check the generated AndroidManifest.xml:

#### For EAS Build:
1. Download the APK
2. Extract it (rename to .zip and unzip)
3. Check `AndroidManifest.xml`

#### For Local Build:
```bash
cat android/app/src/main/AndroidManifest.xml | grep -A 5 "intent-filter"
```

You should see SEND actions for text/plain, text/*, and video/*:
```xml
<intent-filter>
    <action android:name="android.intent.action.SEND"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <data android:mimeType="text/plain"/>
</intent-filter>
```

You should NOT see VIEW actions for youtube.com or instagram.com.

## Development Workflow After Rebuild

Once you have the new build installed:

1. **For JavaScript changes only**:
   ```bash
   npx expo start --dev-client
   ```
   Hot reload will work normally

2. **For native changes** (app.json, plugins, etc):
   You'll need to rebuild again

3. **Testing shares**:
   - Keep Metro bundler running
   - Share from Instagram/YouTube
   - Check console logs in real-time

## Build Profiles (in eas.json)

Make sure you have proper build profiles:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## Version Bump (Optional)

Consider bumping the version in `app.json`:

```json
{
  "expo": {
    "version": "1.0.4",
    "android": {
      "versionCode": 5
    }
  }
}
```

This helps track which build has the sharing fixes.

## What Changed in This Build

### app.json
- ❌ Removed VIEW intent filters for youtube.com, youtu.be, instagram.com, facebook.com, tiktok.com
- ✅ Kept SEND intent filters for text/plain, text/*, video/*

### components/ShareHandler.jsx
- Added ready state management (500ms initialization delay)
- Changed navigation from `router.replace()` to `router.push()` with fallback
- Enhanced URL cleaning for Android share intents
- Relaxed Instagram URL detection
- Added comprehensive error handling and logging

## Support

If you still have issues after following these steps:

1. Check `SHARING_FLOW_DEBUG.md` for detailed debugging
2. Check `SHARING_FIX_SUMMARY.md` for technical details
3. Run the ADB test command to verify intent filters
4. Share the console logs when reporting issues

