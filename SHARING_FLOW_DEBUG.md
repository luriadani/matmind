# Sharing Flow Debug Guide

## How Sharing Works Now

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  User shares from Instagram/YouTube                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Android Intent Filter (SEND action)                        │
│  - Accepts text/plain, text/*, video/*                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Expo Linking API receives URL                              │
│  - Linking.getInitialURL() for cold start                   │
│  - Linking.addEventListener() for warm start                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  ShareHandler Component (after 500ms ready delay)           │
│  1. Checks if already handling                              │
│  2. Cleans URL (extracts from Android intent extras)        │
│  3. Detects platform (YouTube/Instagram/etc)                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  parseSharedContent()                                        │
│  - Identifies video platform                                │
│  - Extracts video title                                     │
│  - Generates technique title                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Navigation (after 100ms delay)                             │
│  router.push('/technique-form?shared_url=...&shared_title=) │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  technique-form.tsx                                          │
│  - Receives shared_url and shared_title params              │
│  - Pre-fills form fields                                    │
│  - Sets "Try Next Class" category                           │
└─────────────────────────────────────────────────────────────┘
```

## Debug Checklist

### ✅ Check 1: Intent Filter Configuration
**File**: `app.json`
**What to look for**:
```json
"intentFilters": [
  {
    "action": "SEND",
    "category": ["DEFAULT"],
    "data": [{"mimeType": "text/plain"}]
  }
]
```
**Should NOT have**: VIEW actions for youtube.com, instagram.com, etc.

### ✅ Check 2: ShareHandler Initialization
**File**: `components/ShareHandler.jsx`
**Console logs to check**:
```
✅ ShareHandler is ready
```
This should appear ~500ms after app starts.

### ✅ Check 3: URL Reception
**Console logs to check**:
```
🔍 Initial URL check: https://youtube.com/...
🔗 Incoming share detected: https://youtube.com/...
URL type: string
URL length: 45
```

### ✅ Check 4: URL Cleaning
**Console logs to check**:
```
📋 Parsing shared content...
🔍 Cleaned URL: https://youtube.com/watch?v=xxxxx
```
The cleaned URL should be a proper HTTP/HTTPS URL.

### ✅ Check 5: Platform Detection
**Console logs to check**:
```
✅ Detected YouTube URL
  or
✅ Detected Instagram URL
```
If you see:
```
❌ URL format not recognized: [url]
```
Then the URL cleaning or platform detection failed.

### ✅ Check 6: Title Extraction
**Console logs to check**:
```
🎬 Extracting title for platform: youtube
📝 Generated technique title: Triangle Choke from Guard
```

### ✅ Check 7: Navigation
**Console logs to check**:
```
✅ Navigating to technique form with shared data
🚀 Navigation URL: /technique-form?shared_url=...
✅ Navigation triggered successfully
```

### ✅ Check 8: Form Pre-fill
**File**: `app/technique-form.tsx`
**Console logs to check**:
```
📤 Handling shared content: {shared_url: "...", shared_title: "..."}
✅ Pre-filled form with shared content
```

## Common Issues & Solutions

### Issue 1: "No URL or matmind:// URL, checking clipboard..."
**Cause**: The URL wasn't passed through the intent correctly
**Solutions**:
1. Rebuild the app to ensure intent filters are updated
2. Check if the share action is SEND not VIEW
3. Try sharing plain text instead of using native share sheet

### Issue 2: "URL format not recognized"
**Cause**: URL cleaning failed or platform not detected
**Solutions**:
1. Check the raw URL in logs
2. Ensure it starts with http:// or https://
3. Check if platform detection logic matches the URL format

### Issue 3: Navigation doesn't happen
**Cause**: Router not ready or navigation timing issue
**Solutions**:
1. Check if "ShareHandler is ready" log appears
2. Verify navigation logs appear
3. Try increasing the navigation delay in ShareHandler

### Issue 4: Form opens but fields are empty
**Cause**: URL parameters not passed or parsed correctly
**Solutions**:
1. Check the navigation URL in logs - should include ?shared_url=
2. Verify technique-form.tsx receives params
3. Check if params.shared_url is set in technique form

## Platform-Specific Notes

### Instagram
- Works with any instagram.com URL
- No longer requires specific paths (/reel/, /p/, /tv/)
- Share button usually sends the URL correctly

### YouTube
- Works with youtube.com and youtu.be
- Intent filters no longer interfere with native YouTube app
- Share button should now send URL to MatMind

### Testing with ADB
You can test sharing manually using ADB:

```bash
# Test YouTube share
adb shell am start -a android.intent.action.SEND -t text/plain --es android.intent.extra.TEXT "https://www.youtube.com/watch?v=dQw4w9WgXcQ" com.matmind.app

# Test Instagram share
adb shell am start -a android.intent.action.SEND -t text/plain --es android.intent.extra.TEXT "https://www.instagram.com/reel/ABC123/" com.matmind.app
```

## Logs to Monitor

Run your app with:
```bash
npx expo start --dev-client
```

Then use the Metro bundler console or run:
```bash
adb logcat | grep -E "ShareHandler|Navigation|technique-form"
```

Key log patterns to look for:
- 🔗 = URL received
- 📋 = Processing
- ✅ = Success
- ❌ = Error
- 🚀 = Navigation
- 🎬 = Title extraction
- 📝 = Generated content

