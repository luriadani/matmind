# MatMind — Design Redesign Plan
**Branch:** `design`
**Goal:** Transform the existing dark-gray developer UI into a modern, Instagram/TikTok-inspired mobile experience focused on video content.

---

## Current State (Baseline)

The app currently has:
- Hard-coded dark gray colors (`#111827`, `#1F2937`, `#374151`) scattered across every file
- No consistent design tokens or component system
- Flat, text-heavy cards — thumbnails are either absent or tiny (80×60px)
- No visual hierarchy in the feed
- Tab bar uses default Expo styling
- No micro-interactions or animations
- No light mode support wired up

**Design tokens are now done (already committed to `design` branch):**
- `constants/Colors.ts` — full color system (light + dark, brand, categories)
- `constants/Typography.ts` — type scale + preset styles
- `constants/Spacing.ts` — 4-point grid + semantic aliases + border radius
- `constants/Shadows.ts` — platform-aware shadow levels

---

## Design Principles

1. **Content first** — Video thumbnails dominate. Everything else serves the content.
2. **One screen, one job** — No clutter. Each screen has a clear primary action.
3. **Familiar patterns** — Instagram-style feed, TikTok-style full-width cards, Facebook-style bottom sheet modals.
4. **Dark mode primary** — App is primarily a dark-mode experience. Light mode is clean white.
5. **Alive, not flashy** — Subtle animations that reward interaction. Nothing distracting.

---

## Color System (Summary)

| Token | Value | Usage |
|---|---|---|
| Primary | `#5B6CF5` Indigo | CTAs, active states, links |
| Accent | `#FF6B6B` Coral | Reminders, alerts, urgency |
| Success | `#00C896` Teal-green | Completed, active sessions |
| Warning | `#FFB020` Amber | Overdue, caution |
| Dark background | `#08080F` | App background (dark) |
| Dark surface | `#13131E` | Cards (dark) |
| Light background | `#F8F9FE` | App background (light) |
| Light surface | `#FFFFFF` | Cards (light) |

---

## Architecture of the New Design System

```
constants/
  Colors.ts          ✅ Done — full palette, category colors
  Typography.ts      ✅ Done — type scale + presets
  Spacing.ts         ✅ Done — 4pt grid + semantic + border radius
  Shadows.ts         ✅ Done — xs → xl + platform-aware card shadow

components/
  ThemedText.tsx     🔄 Update — add new type variants
  ThemedView.tsx     🔄 Update — add surface variants (card, elevated, sunken)

  ui/
    VideoCard.tsx      🔲 New — Instagram-style full-width video card
    ReminderBadge.tsx  🔲 New — Upcoming / Overdue / Done status pill
    CategoryBadge.tsx  🔲 New — Consistent category pill (reusable everywhere)
    Button.tsx         🔲 New — Primary / Secondary / Ghost / Destructive
    SectionHeader.tsx  🔲 New — Screen section label + optional action
    EmptyState.tsx     🔲 New — Centered empty state with icon + message
    ScreenHeader.tsx   🔲 New — Top-of-screen title + subtitle area

  dashboard/
    TechniqueCard.jsx  🔄 Rewrite — uses VideoCard, new design tokens
    TechniqueGridItem.js 🔄 Rewrite — grid version using new tokens

app/(tabs)/
  _layout.tsx        🔄 Update — styled tab bar (active color, sizing)
  index.tsx          🔄 Redesign — Dashboard screen
  schedule.tsx       🔄 Redesign — Schedule screen
  settings.tsx       🔄 Redesign — Settings screen
  admin.tsx          🔄 Minor update — tokens only

app/
  pricing.tsx        🔄 Redesign — Pricing screen (plan cards)
  technique-form.tsx 🔄 Redesign — Add/Edit form
```

---

## Phases

### Phase 1 — Core UI Primitives
Build the component library that everything else is built on top of.
All components must work in both light and dark mode via `useColorScheme`.

**Deliverables:**
- `ThemedText` update (new type variants)
- `ThemedView` update (surface variants)
- `VideoCard` — the main card component
- `ReminderBadge` — status indicator
- `CategoryBadge` — reusable pill
- `Button` — all variants
- `SectionHeader` — section divider
- `EmptyState` — empty state
- `ScreenHeader` — page header

### Phase 2 — Screen Redesigns
Apply Phase 1 components to every screen. No logic changes — design only.

**Priority order:**
1. Tab bar (`_layout.tsx`) — visible on every screen
2. Dashboard / Library (`index.tsx`) — most-used screen
3. Technique card components (`TechniqueCard`, `TechniqueGridItem`)
4. Schedule screen (`schedule.tsx`)
5. Pricing screen (`pricing.tsx`)
6. Settings screen (`settings.tsx`)
7. Technique form (`technique-form.tsx`)

### Phase 3 — Motion & Micro-interactions
Layer in animations using `react-native-reanimated` (already installed).

**Targets:**
- Card press: scale 0.97 → spring back
- Tab switch: icon bounce
- Reminder badge: pulse on "Upcoming"
- Screen enter: fade + slide up (staggered cards)
- Empty state: gentle bounce-in
- Subscription warning: shake on limit hit

### Phase 4 — Polish & Review
- Audit every screen for token consistency (no raw hex values)
- Test both light and dark mode
- Test on small screen (iPhone SE) and large (iPhone Pro Max)
- Verify RTL (Hebrew) layout mirrors correctly
- Review spacing rhythm (consistent 4pt grid)

---

## What We Are NOT Doing in This Branch

- No logic changes
- No new features
- No navigation changes
- No backend work
- No changes to entity files or services

---

## Open Questions (need answers before Phase 3)

1. **Animations scope** — Should Phase 3 (animations) be included in this design branch, or saved for a separate branch?
2. **Light/dark mode** — Should we actively test and support light mode in this pass, or focus on dark mode first?
3. **Technique card layout** — Keep both list and grid views, or simplify to one during this redesign?
4. **Technique form** — Full redesign or just token update (colors + typography)?
