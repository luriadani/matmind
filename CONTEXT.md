# MatMind — Project Context & Architecture

> **App:** Brazilian Jiu-Jitsu training companion
> **Version:** 1.0.3
> **Platform:** iOS & Android (React Native / Expo)
> **Bundle ID:** `com.matmind.app`

---

## Development Guidelines

**When programming: keep responses concise and focused. Avoid excessive implementation details unless specifically requested. Focus on high-level solutions and key implementation points.**

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [App Flow](#app-flow)
3. [Directory Structure](#directory-structure)
4. [Routing & Navigation](#routing--navigation)
5. [Data Models](#data-models)
6. [State Management](#state-management)
7. [Billing & Subscription System](#billing--subscription-system)
8. [Notifications](#notifications)
9. [Sharing & Deep Linking](#sharing--deep-linking)
10. [Internationalization (i18n)](#internationalization-i18n)
11. [Local Storage & Persistence](#local-storage--persistence)
12. [Screen-by-Screen Functionality](#screen-by-screen-functionality)
13. [Components Reference](#components-reference)
14. [Utilities](#utilities)
15. [Build & Deployment](#build--deployment)
16. [Authentication & User Flow](#authentication--user-flow)
17. [Environment Variables](#environment-variables)
18. [Known Limitations](#known-limitations)
19. [Open Questions](#open-questions)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.79.5 + Expo ~53.0.20 |
| Language | TypeScript ~5.8.3 |
| Routing | Expo Router ~5.1.4 (file-based) |
| Navigation | React Navigation 7 (bottom-tabs) |
| State | React Context API + AsyncStorage |
| Billing | RevenueCat (`react-native-purchases ^9.14.0`) |
| Notifications | `expo-notifications ^0.31.4` |
| Sharing | `expo-sharing`, `expo-clipboard`, `expo-linking` |
| UI Extras | expo-blur, expo-haptics, react-native-reanimated ~3.17.4 |
| Build | EAS (Expo Application Services) |
| Tests | None currently |

---

## App Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         APP STARTUP                             │
│                                                                 │
│  1. Root layout (_layout.tsx) mounts                            │
│  2. AppProvider initializes:                                    │
│     a. Load users_data from AsyncStorage (or seed from data/)   │
│     b. Pick active user (priority: luriadani@ → admin → first)  │
│     c. Load user settings (language, time format, etc.)         │
│  3. RTLWrapper applies LTR/RTL based on language                │
│  4. NotificationHandler registered (skip on Expo Go)            │
│  5. ShareHandler listens on Linking events + clipboard          │
│  6. Navigate to → (tabs)/index                                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BOTTOM TAB NAVIGATOR                          │
│   [Library]  [+ Add]  [Schedule]  [Settings]  [Admin]           │
└──┬──────────────┬──────────┬────────────┬───────────┬───────────┘
   │              │          │            │           │
   ▼              ▼          ▼            ▼           ▼
[LIBRARY]     [ADD]      [SCHEDULE]  [SETTINGS]  [ADMIN]
(index.tsx) (add.tsx)  (schedule)  (settings)  (admin.tsx)
   │              │
   │              └──► entitlement check
   │                   ├─ can create? → /technique-form
   │                   └─ at limit?   → /pricing (modal)
   │
   ├─ Load techniques & trainings for current user
   ├─ Subscription warning banner (if free & at limit)
   ├─ "Coming Up Next" section
   ├─ Notification permission prompt (NotificationManager)
   ├─ Search + category filters
   ├─ List / Grid view toggle
   └─ Schedule notifications after load
```

### Technique Lifecycle Flow

```
Share intent / Clipboard / Manual input
         │
         ▼
   ShareHandler.jsx
   (detect & parse URL)
         │
         ▼
   videoTitleExtractor
   thumbnailExtractor
         │
         ▼
   /technique-form
   (pre-filled or blank)
         │
         ├── User fills: title, URL, notes, tags, categories, training
         │
         ▼
   Technique.create()
   → AsyncStorage save
   → return to Library
         │
         ▼
   Library shows technique card
   NotificationScheduler re-runs
```

### Subscription / Entitlement Flow

```
App loads user
      │
      ▼
deriveEntitlementState(user)
      │
      ├─ role === 'admin'           → tier: admin
      ├─ trial still valid          → tier: trial_active
      ├─ subscription_plan=yearly   → tier: paid_yearly
      ├─ subscription_plan=lifetime → tier: paid_lifetime
      └─ default                    → tier: free_limited (max 2 techniques)

User tries to add technique:
canCreateTechnique(state, ownCount)
      ├─ YES → /technique-form
      └─ NO  → /pricing (modal)
               │
               ├─ Select plan (Yearly $79.99 / Lifetime $199)
               ├─ Apply coupon (optional)
               ├─ RevenueCat.purchasePlanProduct()
               └─ Update user subscription fields + close modal
```

### Notification Scheduling Flow

```
Dashboard mounts or Schedule changes
      │
      ▼
scheduleReminders(techniques, trainings)
      │
      ├─ Cancel all existing scheduled notifications
      ├─ For each training in next 7 days:
      │    ├─ Find techniques assigned to this training
      │    └─ Find "Try Next Class" techniques (unassigned)
      │
      ├─ Build notification body (top 3 technique names)
      │
      └─ Schedule notification at:
           training_datetime − notification_minutes_before
           (skip if time already passed)
```

---

## Directory Structure

```
D:/Projects/matmind/
├── app/                          # Expo Router pages
│   ├── (tabs)/
│   │   ├── _layout.tsx           # 5-tab bottom navigator
│   │   ├── index.tsx             # Library / Dashboard
│   │   ├── add.tsx               # Redirect → technique-form (with guard)
│   │   ├── schedule.tsx          # Weekly training schedule
│   │   ├── settings.tsx          # User preferences
│   │   └── admin.tsx             # Admin panel (admin-only)
│   ├── _layout.tsx               # Root layout (theme, notifications, linking)
│   ├── pricing.tsx               # Subscription pricing modal
│   ├── technique-form.tsx        # Add / edit technique
│   └── +not-found.tsx            # 404
│
├── components/
│   ├── Localization.js           # AppContext + AppProvider
│   ├── Translations.js           # i18n strings (en, he)
│   ├── RTLWrapper.tsx            # RTL/LTR enforcement
│   ├── SubscriptionGuard.tsx     # Entitlement gate + useSubscriptionStatus hook
│   ├── NotificationManager.js    # Permission request UI
│   ├── NotificationScheduler.jsx # useNotificationScheduler hook
│   ├── NotificationSettings.jsx  # Notification preferences UI
│   ├── ShareHandler.jsx          # Incoming share / deep link handler
│   ├── TechniqueImporter.jsx     # URL-based technique import
│   ├── TrainingFormModal.jsx     # Add / edit training modal
│   ├── BeltManager.js            # Belt progression UI
│   ├── UserEditModal.jsx         # Edit user profile modal
│   ├── ShareTechniqueModal.jsx   # Share technique dialog
│   ├── ThemedText.tsx            # Text with theme support
│   ├── ThemedView.tsx            # View with theme support
│   ├── ParallaxScrollView.tsx    # Parallax scroll effect
│   ├── Collapsible.tsx           # Expand/collapse component
│   ├── ExternalLink.tsx          # External URL link
│   ├── HapticTab.tsx             # Tab item with haptic tap
│   ├── PlatformIcon.tsx          # Video source platform icon
│   ├── HelloWave.tsx             # Animated wave
│   ├── ServiceWorker.js          # Web service worker
│   ├── dashboard/
│   │   ├── Filters.js            # Search + category filter bar
│   │   ├── NextPractice.jsx      # "Coming Up Next" widget
│   │   ├── TechniqueCard.jsx     # List-view technique card
│   │   ├── TechniqueGridItem.js  # Grid-view technique card
│   │   └── UpcomingDrills.js     # Upcoming drills preview widget
│   └── ui/
│       ├── IconSymbol.tsx        # Cross-platform icon wrapper
│       ├── IconSymbol.ios.tsx    # iOS SF Symbol icons
│       ├── TabBarBackground.tsx  # Tab bar background (Android)
│       └── TabBarBackground.ios.tsx # Tab bar background (iOS blur)
│
├── entities/                     # Data layer (AsyncStorage CRUD)
│   ├── Technique.js
│   ├── Training.js
│   ├── User.js
│   ├── Gym.js
│   └── all.js                    # Barrel export
│
├── services/
│   └── billing/
│       ├── entitlements.ts       # Entitlement state derivation
│       ├── revenuecat.ts         # RevenueCat API wrapper
│       └── coupons.ts            # Coupon validation + audit
│
├── data/                         # Seed / sample data
│   ├── techniques.ts
│   ├── trainings.ts
│   ├── users.ts
│   └── gyms.ts
│
├── types/
│   └── technique.ts              # Technique TypeScript interface
│
├── constants/
│   ├── Colors.ts                 # Light / dark theme palette
│   └── billing.ts                # Plans, prices, coupon definitions
│
├── hooks/
│   ├── useColorScheme.ts         # Dark mode (native)
│   ├── useColorScheme.web.ts     # Dark mode (web)
│   └── useThemeColor.ts          # Resolve themed color value
│
├── utils/
│   ├── formatters.js             # Time formatting, category colors
│   ├── sharing.js                # Share URL / deep link generation
│   ├── videoTitleExtractor.js    # Extract title from video URL
│   └── thumbnailExtractor.js     # Extract thumbnail from video URL
│
├── assets/
│   ├── images/                   # App icon, splash
│   └── fonts/                    # SpaceMono
│
├── app.json                      # Expo configuration
├── eas.json                      # EAS build profiles
├── package.json
└── tsconfig.json
```

---

## Routing & Navigation

### Bottom Tabs (`app/(tabs)/_layout.tsx`)

| Tab | Route | Guard |
|---|---|---|
| Library | `(tabs)/index` | none |
| Add | `(tabs)/add` | entitlement check |
| Schedule | `(tabs)/schedule` | none |
| Settings | `(tabs)/settings` | none |
| Admin | `(tabs)/admin` | `requiredLevel="admin"` |

### Modal Routes

| Route | Trigger | Query Params |
|---|---|---|
| `/technique-form` | Add tab, edit card | `techniqueId?`, `shared_url?`, `shared_title?`, `shared_platform?` |
| `/pricing` | Entitlement guard | none |

### Deep Links

- **App scheme:** `matmind://`
- **Associated domain:** `matmind.app` (iOS)
- **Android intent filters:** `ACTION_SEND` with `text/*`, `video/*`, `image/*`
- **Share URL format:** `https://matmind.app/technique?title=...&video_url=...&category=...&notes=...&tags=...`

---

## Data Models

### Technique

```typescript
{
  id: string                    // 9-char random ID
  title: string                 // required
  video_url: string             // required
  thumbnail_url: string | null
  source_platform: 'youtube' | 'vimeo' | 'instagram' | 'tiktok' | 'facebook' | 'custom'
  category: string              // comma-separated: "Try Next Class,Show Coach,Favorite"
  tags: string | null           // comma-separated
  notes: string | null
  training_id: string | null    // assigned to a specific training
  shared_by_gym_id: string | null
  created_by: string            // user email
  created_by_id: string
  created_date: string          // ISO8601
  updated_date: string          // ISO8601
  is_sample: boolean | null
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | null
}
```

**CRUD:** `Technique.create()`, `.get(id)`, `.filter(criteria)`, `.update(id, data)`, `.delete(id)`
**Storage key:** `techniques_data`

---

### Training

```typescript
{
  id: string
  dayOfWeek: string             // "Sunday" ... "Saturday"
  time: string                  // "HH:MM"
  category: string              // "gi" | "no_gi" | "competition" | "beginner" | "advanced" | "open_mat"
  location: string | null
  instructor: string | null
  created_by: string
  created_by_id: string
  created_date: string
  updated_date: string
  is_sample: boolean | null
}
```

**Storage key:** `trainings_data`

---

### User

```typescript
{
  id: string
  email: string                 // unique
  full_name: string
  role: 'user' | 'admin'
  belt: string                  // "white" | "blue" | "purple" | "brown" | "black"
  language: 'en' | 'he'
  time_format: '12h' | '24h'
  gym_id: string | null

  // Subscription
  coupon_code: string | null
  subscription_plan: 'free' | 'yearly' | 'lifetime'
  subscription_status: 'trial' | 'active' | 'expired' | 'lifetime'
  subscription_level: 'free' | 'premium' | 'admin'
  trial_start_date: string      // ISO8601
  subscription_expiry_date: string | null
  payment_method: string | null

  // Notifications
  notifications_enabled: string // 'true' | 'false'
  notification_minutes_before: number // default 10

  // UI Preferences
  show_only_next_training_techniques: string // 'true' | 'false'
  dashboard_visible_categories: string       // comma-separated

  // Customization
  custom_technique_categories: string  // comma-separated
  custom_training_categories: string   // comma-separated
  custom_belts: string                 // comma-separated

  // Metadata
  created_date: string
  updated_date: string
  is_verified: boolean
  disabled: boolean | null
  push_subscription: object | null
}
```

**Storage key:** `users_data`

---

### Gym

```typescript
{
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  subscription_plan: string     // "basic"
  max_members: number
  active: boolean | null
  created_by: string
  created_by_id: string
  created_date: string
  updated_date: string
  is_sample: boolean | null
}
```

**Storage key:** `gyms_data`

---

## State Management

### AppContext (`components/Localization.js`)

Initialized on app boot via `AppProvider`. Exposes:

| Value | Type | Description |
|---|---|---|
| `user` | User | Active user object |
| `settings` | object | Subset of user fields used for UI config |
| `isLoading` | boolean | App init in progress |
| `t(key, params?)` | fn | i18n translation function |
| `updateSettings(data)` | fn | Persist setting changes |
| `updateUser(data)` | fn | Update user in state + storage |
| `language` | string | `'en'` or `'he'` |
| `getTextDirection()` | fn | Returns `'ltr'` or `'rtl'` |

**User selection priority on startup:**
1. Email `luriadani@gmail.com` (hardcoded owner)
2. First user with `role === 'admin'`
3. First user in array

---

### SubscriptionGuard (`components/SubscriptionGuard.tsx`)

Hook: `useSubscriptionStatus()` returns:

```typescript
{
  user: User | null
  subscriptionStatus: EntitlementState | null
  isLoading: boolean
  freeTechniqueLimit: number  // 2
}
```

**EntitlementState:**

```typescript
{
  tier: 'free_limited' | 'trial_active' | 'paid_yearly' | 'paid_lifetime' | 'admin'
  level: 'free' | 'premium' | 'admin'
  isActive: boolean
  isTrialActive: boolean
  planId: 'free' | 'yearly' | 'lifetime'
  trialEndsAt: string | null
  expiresAt: string | null
  freeTechniqueLimit: number
}
```

**Tier rank (lowest → highest):** `free_limited` → `trial_active` → `paid_yearly` → `paid_lifetime` → `admin`

---

## Billing & Subscription System

### Plans (`constants/billing.ts`)

| Plan | Price | Period | Technique Limit | Color |
|---|---|---|---|---|
| Free | $0 | Forever | 2 | `#6B7280` |
| Yearly | $79.99 | Per year | Unlimited | `#2563EB` (marked popular) |
| Lifetime | $199 | One-time | Unlimited | `#DC2626` |

**Trial:** 14 days from account creation — full access during trial.

### Coupons (hardcoded in `constants/billing.ts`)

| Code | Discount | Applies To |
|---|---|---|
| `WELCOME10` | 10% off | Yearly + Lifetime |
| `YEARLY20` | 20% off | Yearly only |
| `LIFETIME15` | 15% off | Lifetime only |

Audit trail stored in AsyncStorage key `billing_coupon_audit_v1` (last 200 attempts).

### RevenueCat (`services/billing/revenuecat.ts`)

| Product ID | Entitlement | Plan |
|---|---|---|
| `matmind_yearly` | `premium` | Yearly |
| `matmind_lifetime` | `lifetime` | Lifetime |

**Key functions:**
- `initializeRevenueCat(appUserId)` — one-time init
- `getCurrentOffering()` — fetch available products
- `purchasePlanProduct(product)` — make purchase
- `restorePurchases()` — restore previous purchases
- `derivePaidPlanFromCustomerInfo()` — map entitlements → plan

### Entitlements (`services/billing/entitlements.ts`)

- `deriveEntitlementState(user)` — main derivation logic
- `canCreateTechnique(state, ownCount)` — check if user can add more
- `migrateLegacySubscriptionFields(user)` — normalize old subscription field formats

---

## Notifications

### Permission Flow

1. App starts → register notification handler (skipped in Expo Go)
2. Dashboard loads → `NotificationManager` prompts user if not yet granted
3. User grants permission → create Android notification channel
4. Handler configured: sound ON, badge ON, banner ON

### Scheduling Logic (`components/NotificationScheduler.jsx`)

- Cancel all previously scheduled notifications
- Look at trainings within the next 7 days
- For each training, collect:
  - Techniques with `training_id === training.id`
  - Techniques with category `"Try Next Class"` (and no specific training_id)
- Build notification: title = training label, body = top-3 technique names
- Schedule at: `training_datetime − notification_minutes_before`
- Skip if calculated time has already passed

### User Controls (Settings screen)

- Enable / disable notifications toggle
- Minutes before training: 10, 20, 30, 60, 90, 120

---

## Sharing & Deep Linking

### Incoming Share (`components/ShareHandler.jsx`)

Detection sources:
1. Android/iOS share sheet → `Linking` event
2. Clipboard fallback (video URL auto-detection)

Supported platforms: YouTube, Instagram, Facebook, TikTok, Vimeo, Twitter, direct URL

Flow: detect URL → extract title & thumbnail → navigate to `/technique-form?shared_url=...&shared_title=...&shared_platform=...`

### Outgoing Share (`utils/sharing.js`, `components/ShareTechniqueModal.jsx`)

- **Public URL:** `https://matmind.app/technique?title=...&video_url=...&category=...&notes=...&tags=...`
- **Deep link:** `matmind://technique?...`
- Sharing targets: native share sheet, WhatsApp, Telegram, Twitter, Instagram
- Web fallback: clipboard copy

### Video Metadata Extraction

| Platform | Title Source | Thumbnail Source |
|---|---|---|
| YouTube | oEmbed API call | `img.youtube.com/vi/{id}/maxresdefault.jpg` |
| Vimeo | URL parsing | `vumbnail.com/{id}.jpg` |
| Instagram | URL parsing | null (no public API) |
| Facebook | URL parsing | null |
| TikTok | URL parsing | null |
| Generic | metadata fetch attempt | null |

---

## Internationalization (i18n)

**Languages:** English (`en`, LTR) · Hebrew (`he`, RTL)

**Dictionary:** `components/Translations.js`

**Usage:**
```javascript
const { t } = useAppContext()
t('dashboard.title')
t('add_technique.before_training', { day: 'Monday', time: '19:15', location: 'Gym A' })
```

**RTL enforcement:** `components/RTLWrapper.tsx` calls `I18nManager.forceRTL(isRTL)` on language change.

String categories: general, dashboard, techniques, schedule, settings, admin, notifications, billing, errors/validation.

---

## Local Storage & Persistence

All persistence is **local-only** via AsyncStorage (no backend).

| Key | Content |
|---|---|
| `techniques_data` | JSON array of techniques |
| `trainings_data` | JSON array of trainings |
| `users_data` | JSON array of users |
| `gyms_data` | JSON array of gyms |
| `billing_coupon_audit_v1` | JSON array of coupon attempts (last 200) |

**Init order per entity:**
1. `ensureInitialized()` called on first access
2. Read from AsyncStorage
3. If empty → load seed data from `data/` folder
4. All writes persist back to AsyncStorage immediately

---

## Screen-by-Screen Functionality

### Library / Dashboard (`(tabs)/index.tsx`)

- Subscription warning banner (free tier users at the 2-technique limit)
- "Coming Up Next" — techniques for next scheduled training
- `NotificationManager` — request notifications prompt if not enabled
- Upcoming drills widget
- Search bar (by title / tags)
- Category filter: All / Try Next Class / Show Coach / Favorite
- List ↔ Grid view toggle
- Technique cards: thumbnail, title, platform icon, category badge, edit/delete/open-video actions
- Auto-schedule notifications on mount
- Cleanup: removes stale `training_id` refs from techniques

### Add Technique (`(tabs)/add.tsx` → `/technique-form`)

- Checks entitlement on mount
- If free user at limit → redirect to `/pricing`
- Otherwise → redirect to `/technique-form`

### Technique Form (`/technique-form`)

**Fields:** Title (required), Video URL (required), Notes, Tags (comma-separated), Category (multi-select), Training assignment, Difficulty

**Features:**
- Edit mode: loads existing technique by `techniqueId` param
- Share pre-fill: reads `shared_url`, `shared_title`, `shared_platform` from route params
- Auto-detect video title on URL blur
- Auto-extract thumbnail from URL
- Training dropdown shows user's trainings + "Always show" option

### Schedule (`(tabs)/schedule.tsx`)

- List of user's trainings sorted by day of week (Sun → Sat)
- Training card shows: day, time, category badge (color-coded), location, instructor
- Add/edit via `TrainingFormModal`
- Delete with confirmation dialog
- Re-schedules all notifications after any change

**Training form fields:** Day of week, time (HH:MM), category, location (optional), instructor (optional)

### Settings (`(tabs)/settings.tsx`)

- User profile: name, email, role, belt display
- Belt selector (default + custom belts)
- Language toggle: English / Hebrew
- Time format: 12h / 24h
- Notifications: enable/disable, minutes before training (10–120)
- Dashboard categories: per-category visibility toggles
- "Show only next training's techniques" toggle
- Custom technique categories (add/remove; default items locked)
- Custom training categories (add/remove; default items locked)
- Custom belt ranks (add/remove; default items locked)
- Save button persists all changes to User entity

### Admin Panel (`(tabs)/admin.tsx`)

- Protected by `<SubscriptionGuard requiredLevel="admin">`
- User list: email, role, subscription plan
- User impersonation (switches active user for testing)
- User edit modal
- User deletion
- Gym list
- Gym deletion
- Active impersonation banner with "Stop Impersonating" button

### Pricing (`/pricing`)

- Three plan cards: Free, Yearly ($79.99/yr), Lifetime ($199)
- Plan selection
- Coupon input + validation feedback + discounted price display
- "Subscribe" → `RevenueCat.purchasePlanProduct()`
- "Restore Purchases" → `RevenueCat.restorePurchases()`
- On success: updates user subscription fields, closes modal

---

## Components Reference

| Component | Purpose |
|---|---|
| `SubscriptionGuard` | Wraps content needing a subscription tier; shows error if insufficient |
| `NotificationManager` | Renders permission request banner |
| `NotificationScheduler` | `useNotificationScheduler()` hook — all scheduling logic |
| `ShareHandler` | Watches Linking + clipboard, navigates to technique form |
| `TechniqueImporter` | Explicit URL → technique import |
| `TrainingFormModal` | Full-screen modal for add/edit training |
| `BeltManager` | Belt progression visual selector |
| `UserEditModal` | Admin modal to edit any user's fields |
| `ShareTechniqueModal` | Bottom sheet to share a technique to various targets |
| `NotificationSettings` | Enable/disable + timing preference UI |
| `RTLWrapper` | Enforces RTL direction for Hebrew |
| `ThemedText` / `ThemedView` | Respects light/dark color scheme |
| `ParallaxScrollView` | Scroll view with parallax hero image |
| `Collapsible` | Expand/collapse section |
| `HapticTab` | Bottom tab with haptic feedback on press |
| `PlatformIcon` | Shows YouTube/Instagram/etc. icon from `source_platform` |
| `Filters` | Search bar + category checkboxes |
| `NextPractice` | "Coming Up Next" training widget |
| `TechniqueCard` | List-view card with actions |
| `TechniqueGridItem` | Grid-view card |
| `UpcomingDrills` | Upcoming drills preview widget |

---

## Utilities

### `utils/formatters.js`

| Function | Description |
|---|---|
| `formatTime(timeString, format)` | Converts `HH:MM` to 12h or 24h display string |
| `getTrainingCategoryColor(category)` | Returns `{ backgroundColor, color, borderColor }` for training type badge |
| `getTechniqueCategoryColor(category)` | Returns color object for technique category badge |
| `parseArray(val)` | Converts comma-string, array, or null to a clean trimmed array |

### `utils/sharing.js`

| Function | Description |
|---|---|
| `generateTechniqueShareUrl(technique)` | Builds `https://matmind.app/technique?...` |
| `generateTechniqueDeepLink(technique)` | Builds `matmind://technique?...` |
| `shareTechnique(technique)` | Native share sheet or clipboard fallback |
| `shareTechniqueToExternalApp(technique, platform)` | Opens WhatsApp / Telegram / Twitter / Instagram |

### `utils/videoTitleExtractor.js`
Extracts video title — oEmbed for YouTube, URL parsing for all other platforms.

### `utils/thumbnailExtractor.js`
Extracts thumbnail URL — YouTube max-res, Vimeo via vumbnail.com, SVG data-URI fallback.

---

## Build & Deployment

### EAS Build Profiles (`eas.json`)

| Profile | Platform | Output | Purpose |
|---|---|---|---|
| `development` | iOS / Android | Dev client build | Local development |
| `preview` | iOS / Android | Internal distribution | Internal QA |
| `testflight` | iOS | Store distribution | TestFlight beta |
| `production` | iOS | Store distribution | App Store release |
| `production` | Android | AAB | Play Store release |
| `production-apk` | Android | APK | Direct-install testing |

### npm Scripts

```bash
npm run build:android:apk          # APK for direct install testing
npm run build:android:store        # AAB for Play Store
npm run build:ios:testflight       # TestFlight beta
npm run build:ios:store            # App Store production
npm run submit:android             # Submit to Play Store
npm run submit:ios                 # Submit to App Store
```

### Versioning

- `app.json → expo.version` — semantic version (e.g., `1.0.3`)
- `android.versionCode` — integer, must increment per Play Store release
- `ios.buildNumber` — integer, must increment per App Store release
- Auto-increment enabled on production EAS profile

---

## Authentication & User Flow

> **Current state: no backend authentication.**

- Default active user hardcoded as `luriadani@gmail.com`
- User selected from AsyncStorage on every app startup
- No login / logout screens implemented
- No auth tokens, sessions, or server-side identity
- All user data stored locally in AsyncStorage

This is the primary area identified for future backend replacement.

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | Production | RevenueCat iOS SDK key |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | Production | RevenueCat Android SDK key |
| `EXPO_PUBLIC_BILLING_DEBUG_STATE` | Dev only | Override entitlement state (e.g., `trial_active`, `paid_yearly`, `admin`) |

---

## Known Limitations

| Area | Limitation |
|---|---|
| Backend | No backend API — all data is local AsyncStorage only |
| Auth | No real authentication — hardcoded default user |
| Gym sharing | Data model exists but feature not implemented |
| Video titles | Only YouTube uses oEmbed; others return URL-parsed IDs |
| Notifications | Requires Expo dev build (not Expo Go); no deep link on notification tap |
| iOS share | Share sheet works; clipboard fallback may require manual paste |
| Analytics | None implemented |
| Tests | No tests exist |

---

## Next Development Priorities

1. **Backend Integration** — Replace AsyncStorage with a real API (auth, data sync)
2. **Enhanced Sharing** — Implement gym sharing and collaboration
3. **Analytics** — Track technique usage and progress
4. **Better Offline Support** — Sync strategy for backend migration
5. **Performance** — Optimize video loading and thumbnail caching

---

## Open Questions

The following need clarification before major feature work:

1. **Authentication** — What is the planned backend (Supabase, Firebase, custom API)? What auth method (email/password, magic link, social login)?

2. **Gym Sharing** — How should this work exactly? Can all gym members see each other's techniques? Is there a gym admin role? How are gyms created (invite code, admin-only)?

3. **Hardcoded default user (`luriadani@gmail.com`)** — Is this intentionally always the primary user (single-user app for now), or is multi-user the near-term path?

4. **`TechniqueImporter.jsx` vs `ShareHandler.jsx`** — What is the intended distinction? One for explicit URL import, one for OS share intent?

5. **`difficulty` field** — Is it surfaced anywhere in the UI (filters, cards)? It exists on the model but isn't obvious in the screens.

6. **`show_only_next_training_techniques` setting** — When enabled, does the library hide all techniques not assigned to the next training? Does it also hide unassigned "Try Next Class" techniques?

7. **Gym-level billing** — The Gym model has `subscription_plan` and `max_members`. Is there a gym billing tier separate from user billing?

8. **Web version** — `expo.web` is configured with `output: static`. Is a web version actively planned or is it just scaffolding?

9. **Free tier technique limit** — The existing CONTEXT.md said 7 techniques; the code says 2. Which is correct/intended?

10. **`HelloWave` component** — Is there an onboarding screen planned, or is this leftover Expo scaffolding?
