# MatMind - Sharing Guide

## How to Share Videos to MatMind

### From YouTube, Instagram, Facebook, TikTok

1. **Open the video** in the app (YouTube, Instagram, Facebook, etc.)
2. **Click the Share button** (usually looks like an arrow or share icon)
3. **Select "MatMind"** from the share menu
4. **MatMind will open automatically** with the Add Technique form pre-filled:
   - Video URL will be filled in
   - Technique title will be extracted and filled in
   - "Try Next Class" category will be pre-selected
5. **Choose your settings:**
   - Select which training to show this technique (or "Always show")
   - Add tags and notes if needed
6. **Click Save** - Done!

## Supported Platforms

- ✅ YouTube (youtube.com, youtu.be)
- ✅ Instagram (instagram.com - posts, reels, IGTV)
- ✅ Facebook (facebook.com - videos, reels, watch)
- ✅ TikTok (tiktok.com)
- ✅ Vimeo (vimeo.com)
- ✅ Twitter/X (twitter.com, x.com)
- ✅ Direct video files (.mp4, .mov, .avi, .mkv, .webm, etc.)
- ✅ Any web URL

## Troubleshooting

### Share button doesn't show MatMind?

**Android:**
1. Make sure MatMind is installed
2. Try sharing a text URL first
3. MatMind should appear in the "More apps" section
4. You can pin MatMind to your favorites for quick access

**iOS:**
1. Make sure MatMind is installed
2. iOS requires a specific build configuration for share extensions
3. For now, copy the URL and MatMind will detect it from clipboard

### MatMind doesn't open when sharing?

**Check the console logs:**
```
🔗 Incoming share detected: [URL]
📋 Parsing shared content...
✅ Navigating to technique form with shared data
```

If you don't see these logs:
1. Make sure you're using the latest APK build
2. Try sharing a plain text URL instead of using the share button
3. Check if MatMind appears in your app switcher (it might be running in background)

### No URL is pre-filled?

If MatMind opens but the form is empty:
1. Copy the video URL manually
2. Open MatMind and go to Add Technique
3. MatMind will automatically detect the URL from your clipboard and fill it in

## APK Installation

### Android
**Download the latest APK:**
- [Build 1](https://expo.dev/artifacts/eas/mWLrmGgRZGTmXxcQXqmcUC.apk) - Initial build
- [Build 2](https://expo.dev/artifacts/eas/rHiWwLMSnD4KPoBgnpwwLW.apk) - Fixed share handling

**Installation:**
1. Download the APK file to your phone
2. Open the file (you might need to enable "Install from Unknown Sources")
3. Follow the installation prompts
4. Open MatMind and start sharing videos!

### iPhone
**Note:** iOS requires a different distribution method:

1. **TestFlight** (Recommended for beta testing):
   - Developer uploads to App Store Connect
   - You get invited via email
   - Install TestFlight app and accept the invite

2. **Ad Hoc Distribution** (For specific devices):
   - Developer needs your device UDID
   - Build is created specifically for your device
   - Install via a configuration profile

3. **App Store** (For public release):
   - Full App Store submission and approval process

**Current Status:** iOS builds require additional setup. For now, Android APK is available for testing.

## Features

### Smart Notifications
- Get reminded before each training session
- Notifications include your saved techniques
- Configurable timing (10 min to 2 hours before training)
- Daily reminders for "Show Coach" techniques

### Automatic Title Extraction
- Automatically extracts video titles from YouTube, Instagram, etc.
- Generates technique-friendly names
- You can edit the title before saving

### Training Assignment
- Assign techniques to specific training sessions
- Or mark as "Try Next Class" for all trainings
- Filter techniques by training in your library

## Version History

- **v1.0.3** - Fixed share handling + notification settings saving
- **v1.0.2** - Added automatic navigation to technique form
- **v1.0.1** - Initial share support with modal confirmation
- **v1.0.0** - Initial release


