# Development Build Guide

## Why Development Build?

Expo Go doesn't support push notifications. To test push notifications, you need to create a development build.

## Steps to Create Development Build

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

**Note**: If you get a PowerShell execution policy error, run:
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure your project
```bash
eas build:configure
```

### 4. Build for Development

#### For Android:
```bash
eas build --platform android --profile development
```

#### For iOS:
```bash
eas build --platform ios --profile development
```

#### For both platforms:
```bash
eas build --platform all --profile development
```

### 5. Install the Development Build

After the build completes:
1. Download the APK/IPA file
2. Install it on your device
3. Run `npx expo start --dev-client` to start the development server
4. Open the development build app and scan the QR code

## Benefits of Development Build

- ✅ Push notifications work
- ✅ All native features work
- ✅ Faster development cycle
- ✅ Can test on real devices

## Alternative: Use Expo Go for Development

If you want to continue using Expo Go for development (without push notifications):

1. The app will work normally except for push notifications
2. You'll see a message that notifications are not supported in Expo Go
3. All other features will work perfectly

## Testing Push Notifications

Once you have a development build:

1. Enable notifications in the app settings
2. Add some trainings
3. Add techniques with "Try Next Class" category
4. Wait for the notification (or use the test button in settings)

## Troubleshooting

### Build fails?
- Make sure you're logged in to Expo
- Check that your app.json is properly configured
- Try building for one platform at a time

### Notifications still not working?
- Make sure you're using the development build, not Expo Go
- Check that notifications are enabled in device settings
- Verify the notification timing in app settings

### Data not persisting?
- The new AsyncStorage implementation should fix this
- Data will now be saved permanently on the device 

## Production Release Setup (Android + iOS)

### Required accounts

Before public distribution, complete both:

1. Apple Developer Program enrollment
2. Google Play Console registration

Without these accounts, you can still make Android APK tester builds, but you cannot publish to App Store/Play Store.

### Release version policy

Keep versions aligned on every release:

- `expo.version` in `app.json`: semantic version, e.g. `1.0.4`
- `android.versionCode` in `app.json`: increment integer each release
- `ios.buildNumber` in `app.json`: increment integer each iOS release

Production builds in `eas.json` use `autoIncrement: true` to prevent duplicate build numbers.

### Build commands

#### Internal tester builds

Android APK (direct install):

```bash
eas build --platform android --profile production-apk
```

iOS TestFlight build:

```bash
eas build --platform ios --profile testflight
```

#### Store-ready production builds

Android AAB + iOS production:

```bash
eas build --platform all --profile production
```

### Submission commands

After store metadata is prepared and accounts are configured:

```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

### Device smoke test checklist (every release)

Run on at least one physical Android and one physical iPhone:

1. App launch and first-run flow
2. Navigation across all tabs/screens
3. Notifications (permission, scheduling, delivery)
4. Sharing and deep link flows
5. Data persistence after restart
6. Upgrade behavior from previous app version

### Rollout recommendations

- Google Play: publish to Internal -> Closed testing -> Production
- iOS: TestFlight external testing before App Store release
- Start with staged rollout and monitor:
  - crash-free sessions
  - ANR rate (Android)
  - severe user-reported regressions