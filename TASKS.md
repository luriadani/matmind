# MatMind — Design Tasks
**Branch:** `design`
**Last updated:** 2026-04-05

Each task maps to PLAN.md. Status: `[ ]` todo · `[~]` in progress · `[x]` done · `[?]` blocked.

---

## Phase 1 — Core UI Primitives

### P1-1 · ThemedText — add new type variants
- [ ] Add variants: `videoTitle`, `sectionHeader`, `caption`, `micro`, `badge`
- [ ] Wire all variants to `Typography` tokens
- [ ] Remove hardcoded `color: '#0a7ea4'` from `link` type
- **File:** `components/ThemedText.tsx`

### P1-2 · ThemedView — add surface variants
- [ ] Add `variant` prop: `default` (background) | `surface` (card) | `elevated` (modal) | `sunken` (input)
- [ ] Map each variant to the correct `Colors.light/dark` surface token
- **File:** `components/ThemedView.tsx`

### P1-3 · VideoCard — new Instagram-style technique card
- [~] Full-width thumbnail (16:9 aspect ratio)
- [~] Play button overlay (center, semi-transparent circle)
- [~] Platform badge (top-left corner of thumbnail)
- [~] Category badges below thumbnail
- [~] Title (2-line max, `videoTitle` typography)
- [~] Metadata row: training day + time (if assigned)
- [~] Action row: edit / delete / open video
- [~] Shared-by-gym badge
- [~] Press animation: scale to 0.97 + spring back
- [~] Swipe-to-delete (right → left reveals delete)
- **File:** `components/ui/VideoCard.tsx`

### P1-4 · ReminderBadge — status indicator pill
- [ ] States: `upcoming` (coral) · `overdue` (amber) · `done` (green) · `none`
- [ ] Each state: background tint + icon + label
- [ ] Upcoming state: subtle pulse animation
- **File:** `components/ui/ReminderBadge.tsx`

### P1-5 · CategoryBadge — reusable category pill
- [ ] Accepts `category` string, derives color from `CategoryColors` token
- [ ] Variants: `filled` (default) | `outline`
- [ ] Compact mode for grid view
- **File:** `components/ui/CategoryBadge.tsx`

### P1-6 · Button — all variants
- [ ] Variants: `primary` | `secondary` | `ghost` | `destructive`
- [ ] Sizes: `sm` | `md` | `lg`
- [ ] Loading state (spinner replaces label)
- [ ] Disabled state
- [ ] Optional leading icon
- [ ] Press animation: opacity dip
- **File:** `components/ui/Button.tsx`

### P1-7 · SectionHeader — section label + optional action
- [ ] Left: uppercase label (micro typography)
- [ ] Right: optional action button (text link)
- [ ] Divider line below (optional)
- **File:** `components/ui/SectionHeader.tsx`

### P1-8 · EmptyState — empty content placeholder
- [ ] Centered layout: icon → title → subtitle → optional CTA button
- [ ] Variants: `techniques` | `schedule` | `search` | `generic`
- [ ] Gentle scale animation on mount
- **File:** `components/ui/EmptyState.tsx`

### P1-9 · ScreenHeader — top-of-screen page header
- [ ] Title + optional subtitle
- [ ] Optional right action slot
- [ ] Respects RTL
- **File:** `components/ui/ScreenHeader.tsx`

---

## Phase 2 — Screen Redesigns

### P2-1 · Tab bar (`_layout.tsx`)
- [ ] Active tab: `Brand.primary` icon + dot indicator below icon
- [ ] Inactive tab: `tabIconDefault` color (muted)
- [ ] Center "Add" tab: larger icon, primary color fill circle (FAB-style)
- [ ] Tab bar background: dark mode surface, light mode white + blur
- [ ] Increase icon size from 28 → 26 (slightly less aggressive)
- **File:** `app/(tabs)/_layout.tsx`

### P2-2 · Dashboard screen (`index.tsx`)
- [ ] Replace `backgroundColor: '#111827'` with `Colors.dark.background` via `useColorScheme`
- [ ] Replace header hardcoded styles with `ScreenHeader` component
- [ ] Replace `TechniqueCard` usage to use new `VideoCard` (list mode)
- [ ] Replace `TechniqueGridItem` usage to use updated grid card
- [ ] Subscription warning banner: use `Brand.accent` color system
- [ ] Replace view mode toggle buttons with new `Button` variant
- [ ] Replace empty state with `EmptyState` component
- [ ] Section header ("Your Library") with `SectionHeader` component
- [ ] Loading state: skeleton shimmer (3 cards) instead of text
- **File:** `app/(tabs)/index.tsx`

### P2-3 · TechniqueCard rewrite
- [ ] Replace entire component with new `VideoCard` usage
- [ ] Remove all hardcoded hex colors
- [ ] Use `CategoryBadge` for categories
- [ ] Use `ReminderBadge` for training assignment display
- **File:** `components/dashboard/TechniqueCard.jsx`

### P2-4 · TechniqueGridItem rewrite
- [ ] Full-width thumbnail in grid card (not just tiny 80px)
- [ ] Remove all hardcoded hex colors
- [ ] Use `CategoryBadge`
- [ ] Card width: `(screenWidth - 16 * 2 - 12) / 2` (responsive)
- **File:** `components/dashboard/TechniqueGridItem.js`

### P2-5 · Schedule screen (`schedule.tsx`)
- [ ] Replace background + card hardcoded colors with tokens
- [ ] Training card: left-accent colored border based on category
- [ ] Day label: large, bold, primary color
- [ ] Time label: `title` typography
- [ ] Category badge: use `CategoryBadge`
- [ ] "Add Training" button: use `Button primary`
- [ ] Empty state: use `EmptyState` component
- [ ] Replace header with `ScreenHeader`
- **File:** `app/(tabs)/schedule.tsx`

### P2-6 · Pricing screen (`pricing.tsx`)
- [ ] Plan cards: rounded, elevated surface with shadow
- [ ] Popular badge on Yearly: `Brand.primary` background
- [ ] Active plan: primary border highlight (2px)
- [ ] Price: large display typography
- [ ] CTA button: `Button primary lg`
- [ ] Coupon field: styled input with inline validate button
- [ ] Replace all hardcoded colors
- **File:** `app/pricing.tsx`

### P2-7 · Settings screen (`settings.tsx`)
- [ ] Group settings into cards (sections)
- [ ] Replace list items with consistent row style: icon left, label, control right
- [ ] Toggle rows: styled Switch with `Brand.primary` track color
- [ ] Language selector: segmented control style
- [ ] Save button: `Button primary` at bottom
- [ ] Replace all hardcoded colors
- **File:** `app/(tabs)/settings.tsx`

### P2-8 · Technique form (`technique-form.tsx`)
- [ ] Replace background colors with tokens
- [ ] Input fields: `BorderRadius.input` + `Colors.surfaceSunken` background
- [ ] Category selector: pill multi-select (tappable `CategoryBadge` items)
- [ ] Training selector: card-style dropdown
- [ ] URL field: special row with platform icon auto-detected
- [ ] Submit button: `Button primary lg` full-width
- **File:** `app/technique-form.tsx`

---

## Phase 3 — Motion & Micro-interactions

### P3-1 · Card press animation
- [ ] All cards: `scale(0.97)` on press-in, spring back on release
- [ ] Use `Animated.Spring` from `react-native-reanimated`
- **Files:** `VideoCard`, `TechniqueGridItem`

### P3-2 · Reminder badge pulse
- [ ] Upcoming state: subtle scale pulse (1.0 → 1.05 → 1.0) on a loop
- **File:** `components/ui/ReminderBadge.tsx`

### P3-3 · Feed stagger animation
- [ ] Cards enter with staggered fade + slide-up (each card 40ms after previous)
- [ ] Triggered on screen focus
- **File:** `app/(tabs)/index.tsx`

### P3-4 · Tab icon bounce
- [ ] Active tab icon: small bounce on selection (scale 1.0 → 1.2 → 1.0)
- **File:** `components/HapticTab.tsx`

### P3-5 · Empty state animation
- [ ] Gentle scale bounce on initial render
- **File:** `components/ui/EmptyState.tsx`

---

## Phase 4 — Polish & Review

### P4-1 · Token audit
- [ ] Grep all `.tsx/.jsx` files for raw hex color values
- [ ] Replace every instance with a token from `Colors`
- [ ] No raw hex allowed in any component except the token files themselves

### P4-2 · Spacing audit
- [ ] Grep for raw number margins/paddings outside of `Spacing`/`Space` imports
- [ ] Ensure consistent 4pt grid throughout

### P4-3 · Dark + Light mode test
- [ ] Toggle device to light mode — verify all screens look correct
- [ ] Toggle to dark mode — verify all screens look correct
- [ ] Check contrast ratios on key text elements

### P4-4 · RTL layout test
- [ ] Switch language to Hebrew in settings
- [ ] Verify tab bar, cards, headers mirror correctly

### P4-5 · Small screen test
- [ ] Test on iPhone SE (375pt width) — no overflow, no clipping
- [ ] Test on large screen (430pt) — good use of space, not too stretched

---

---

## Phase 6 — Auth & User Isolation

### P6-1 · Free technique limit 3 → 2
- [ ] Change `freeTechniqueLimit: 3` → `2` in `constants/billing.ts`
- **File:** `constants/billing.ts`

### P6-2 · User entity — auth methods
- [ ] Add `findByEmail(email)` — returns user or null
- [ ] Add `createAccount({ email, password, name })` — hashes password (SHA-256 via expo-crypto), sets `trial_start`, `trial_end` (+14 days), stores new user
- [ ] Add `login(email, password)` — hashes input, compares to stored hash, returns user or null
- **File:** `entities/User.js`

### P6-3 · Login screen
- [ ] Fields: Email, Password
- [ ] "Sign In" button → calls `User.login()` → stores session → navigates to `/(tabs)`
- [ ] Error message for wrong credentials
- [ ] Link to Register screen
- [ ] Styled with design tokens (dark + light mode)
- **File:** `app/login.tsx` (new)

### P6-4 · Register screen
- [ ] Fields: Full Name, Email, Password, Confirm Password
- [ ] "Create Account" button → calls `User.createAccount()` → sets session → navigates to `/(tabs)`
- [ ] Validation: passwords match, email not already taken
- [ ] Shows "14-day free trial included" message
- [ ] Link back to Login screen
- [ ] Styled with design tokens (dark + light mode)
- **File:** `app/register.tsx` (new)

### P6-5 · Auth guard in root layout
- [ ] On mount: check AsyncStorage for `session_user_email`
- [ ] If missing → `router.replace('/login')`
- [ ] If present → allow normal tab navigation
- **File:** `app/_layout.tsx`

### P6-6 · Session-based user loading in Localization
- [ ] Remove hardcoded `luriadani@gmail.com` selection
- [ ] Read `session_user_email` from AsyncStorage on startup
- [ ] Load matching user from `User` entity
- [ ] Expose `logout()` function: clears `session_user_email` + resets state + redirects to `/login`
- **File:** `components/Localization.js`

### P6-7 · Log Out button in Settings
- [ ] Add "Log Out" row at the bottom of the settings screen
- [ ] Calls `logout()` from `useAppContext()`
- [ ] Confirm dialog before logout
- **File:** `app/(tabs)/settings.tsx`

### P6-8 · New users start empty
- [ ] Sample techniques in `data/users.ts` / `data/techniques.ts` only shown for demo user
- [ ] New registered users start with 0 techniques
- **File:** `data/techniques.ts` / `entities/Technique.js`

---

## Blocked / Questions

- [ ] **[?] P3 scope** — Include animations in this branch or separate?
- [ ] **[?] Light mode priority** — Full light mode support now or dark-first?
- [ ] **[?] Grid vs List** — Keep both views or simplify to list-only for now?
- [ ] **[?] Form redesign depth** — Full form redesign or just token replacement?
