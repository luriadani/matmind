# MatMind Release Checklist

Use this checklist for tester distribution and public store releases.

## 1) Accounts and access

- [ ] Apple Developer account active and paid
- [ ] App Store Connect access confirmed
- [ ] Google Play Console account active
- [ ] Team roles set (Owner/Admin/Developer) for release members

## 2) App configuration and versioning

- [ ] `app.json` `expo.version` bumped
- [ ] `app.json` `android.versionCode` incremented
- [ ] `app.json` `ios.buildNumber` incremented
- [ ] Bundle identifiers unchanged:
  - `com.matmind.app` (iOS)
  - `com.matmind.app` (Android)
- [ ] Deep links and associated domains verified (if used)

## 3) Internal tester builds

- [ ] Android APK built with:
  - `eas build --platform android --profile production-apk`
- [ ] iOS TestFlight build created with:
  - `eas build --platform ios --profile testflight`
- [ ] Build artifacts shared with testers

## 4) Smoke testing

- [ ] Startup and onboarding
- [ ] Core navigation and tab switching
- [ ] Notifications permission + delivery
- [ ] Sharing import/export flows
- [ ] Data persistence after force close/reopen
- [ ] Regression check on existing user data

## 5) Store metadata readiness

- [ ] App name/subtitle/short description finalized
- [ ] Full description and keywords finalized
- [ ] Screenshots uploaded for required devices
- [ ] Feature graphic and app icon validated
- [ ] Privacy policy URL live
- [ ] Support email and contact URL present
- [ ] Data safety / privacy questionnaire completed
- [ ] Content rating / age rating completed

## 6) Store submissions

- [ ] Android AAB built:
  - `eas build --platform android --profile production`
- [ ] iOS production build built:
  - `eas build --platform ios --profile production`
- [ ] Android submitted:
  - `eas submit --platform android --profile production`
- [ ] iOS submitted:
  - `eas submit --platform ios --profile production`

## 7) Rollout and monitoring

- [ ] Play release starts in Internal track
- [ ] Promote to Closed testing after validation
- [ ] Gradual production rollout enabled
- [ ] TestFlight external test group validated
- [ ] Crash and ANR metrics monitored for 24-72 hours
- [ ] Rollback criteria documented before full rollout

## 8) Post-release

- [ ] Tag release in git (example: `v1.0.4`)
- [ ] Release notes published
- [ ] Known issues list updated
- [ ] Next patch scope documented
