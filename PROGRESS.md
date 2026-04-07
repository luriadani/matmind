# MatMind — Design Progress
**Branch:** `design`
**Started:** 2026-04-05
**Last updated:** 2026-04-05

---

## Legend
`✅` Done · `🔄` In Progress · `⏳` Pending · `❌` Blocked

---

## Phase 1 — Core UI Primitives

| Task | Status | File |
|---|---|---|
| P1-1 · ThemedText — new variants | ✅ | `components/ThemedText.tsx` |
| P1-2 · ThemedView — surface variants | ✅ | `components/ThemedView.tsx` |
| P1-3 · VideoCard | ✅ | `components/ui/VideoCard.tsx` |
| P1-4 · ReminderBadge | ✅ | `components/ui/ReminderBadge.tsx` |
| P1-5 · CategoryBadge | ✅ | `components/ui/CategoryBadge.tsx` |
| P1-6 · Button | ✅ | `components/ui/Button.tsx` |
| P1-7 · SectionHeader | ✅ | `components/ui/SectionHeader.tsx` |
| P1-8 · EmptyState | ✅ | `components/ui/EmptyState.tsx` |
| P1-9 · ScreenHeader | ✅ | `components/ui/ScreenHeader.tsx` |

**Design tokens (pre-work):**

| Token File | Status |
|---|---|
| `constants/Colors.ts` | ✅ |
| `constants/Typography.ts` | ✅ |
| `constants/Spacing.ts` | ✅ |
| `constants/Shadows.ts` | ✅ |

---

## Phase 2 — Screen Redesigns

| Task | Status | File |
|---|---|---|
| P2-1 · Tab bar | ✅ | `app/(tabs)/_layout.tsx` |
| P2-2 · Dashboard screen | ✅ | `app/(tabs)/index.tsx` |
| P2-3 · TechniqueCard rewrite | ✅ | `components/dashboard/TechniqueCard.jsx` |
| P2-4 · TechniqueGridItem rewrite | ✅ | `components/dashboard/TechniqueGridItem.js` |
| P2-5 · Schedule screen | ✅ | `app/(tabs)/schedule.tsx` |
| P2-6 · Pricing screen | ✅ | `app/pricing.tsx` |
| P2-7 · Settings screen | ✅ | `app/(tabs)/settings.tsx` |
| P2-8 · Technique form | ✅ | `app/technique-form.tsx` |

---

## Phase 3 — Motion & Micro-interactions

| Task | Status | Notes |
|---|---|---|
| P3-1 · Card press animation (scale) | ✅ | Built into `VideoCard` + `TechniqueGridItem` |
| P3-2 · Reminder badge pulse | ✅ | Built into `ReminderBadge` (upcoming state) |
| P3-3 · Feed stagger animation | ✅ | Built into Dashboard `AnimatedCard` wrapper |
| P3-4 · Tab icon bounce | ✅ | Built into `_layout.tsx` `TabIcon` component |
| P3-5 · Empty state animation | ✅ | Built into `EmptyState` (scale + fade on mount) |
| P3-6 · Button press opacity | ✅ | Built into `Button` component |

---

## Phase 4 — Polish & Review

| Task | Status | Notes |
|---|---|---|
| P4-1 · Token audit (no raw hex) | ✅ | Added `Media` token group; replaced `#1A1A2E` in VideoCard |
| P4-2 · Spacing audit | ✅ | All hardcoded values on 4-pt grid; semantic aliases used |
| P4-3 · Light + dark mode test | ⏳ | Need device / simulator |
| P4-4 · RTL layout test | ⏳ | Switch to Hebrew in settings |
| P4-5 · Small screen test | ⏳ | Test on iPhone SE (375pt) |

---

## What Was Built

### New files created
```
constants/Colors.ts          (rewritten)
constants/Typography.ts      (new)
constants/Spacing.ts         (new)
constants/Shadows.ts         (new)
components/ui/VideoCard.tsx  (new)
components/ui/ReminderBadge.tsx (new)
components/ui/CategoryBadge.tsx (new)
components/ui/Button.tsx     (new)
components/ui/SectionHeader.tsx (new)
components/ui/EmptyState.tsx (new)
components/ui/ScreenHeader.tsx (new)
PLAN.md                      (new)
TASKS.md                     (new)
PROGRESS.md                  (new)
```

### Files fully redesigned
```
components/ThemedText.tsx
components/ThemedView.tsx
components/dashboard/TechniqueCard.jsx
components/dashboard/TechniqueGridItem.js
app/(tabs)/_layout.tsx
app/(tabs)/index.tsx
app/(tabs)/schedule.tsx
app/(tabs)/settings.tsx
app/pricing.tsx
app/technique-form.tsx
```

---

## Decisions & Notes

| Date | Decision |
|---|---|
| 2026-04-05 | Q1: Animations included in this branch |
| 2026-04-05 | Q2: Both light and dark mode supported via `useColorScheme` |
| 2026-04-05 | Q3: Both list and grid views kept and redesigned |
| 2026-04-05 | Q4: Technique form fully redesigned |
| 2026-04-05 | Phase 1, 2, 3 complete. Phase 4 (audit) pending visual review. |

---

## Open Questions (answered)

| # | Question | Answer |
|---|---|---|
| Q1 | Include animations in this branch? | ✅ Yes, same branch |
| Q2 | Full light mode support now? | ✅ Yes, both modes |
| Q3 | Keep both list + grid views? | ✅ Yes, both redesigned |
| Q4 | Technique form: full redesign? | ✅ Full redesign |

---

## Phase 5 — Payments (branch: `payments`)

| Task | Status | Notes |
|---|---|---|
| P5-1 · Update billing constants | ✅ | Free→3 techniques, Yearly→$4.99, Lifetime→$11.99 |
| P5-2 · Vercel serverless functions | ✅ | `api/create-checkout-session.js`, `api/verify-session.js` |
| P5-3 · Stripe web client service | ✅ | `services/billing/stripe.ts` |
| P5-4 · Payment success screen | ✅ | `app/payment-success.tsx` |
| P5-5 · Pricing screen: web/mobile split | ✅ | Web→Stripe, Mobile→RevenueCat |
| P5-6 · Stripe account setup + price IDs | ⏳ | User needs to create Stripe account + products |
| P5-7 · Vercel env vars | ⏳ | `STRIPE_SECRET_KEY`, `STRIPE_YEARLY_PRICE_ID`, `STRIPE_LIFETIME_PRICE_ID` |
| P5-8 · RevenueCat mobile setup | ⏳ | Needs RC account + App Store/Play Store products |

---

---

## Phase 6 — Auth & User Isolation

| Task | Status | Notes |
|---|---|---|
| P6-1 · Free limit 3→2 | ⏳ | `constants/billing.ts` |
| P6-2 · User entity auth methods | ⏳ | `createAccount`, `login`, `findByEmail` |
| P6-3 · Login screen | ⏳ | `app/login.tsx` |
| P6-4 · Register screen | ⏳ | `app/register.tsx` |
| P6-5 · Auth guard in root layout | ⏳ | `app/_layout.tsx` |
| P6-6 · Session-based user loading | ⏳ | `components/Localization.js` |
| P6-7 · Log Out button in Settings | ⏳ | `app/(tabs)/settings.tsx` |
| P6-8 · New users start empty | ⏳ | `data/techniques.ts` |

**Decisions:**
- Local AsyncStorage only (no cloud backend this phase)
- Passwords hashed with SHA-256 via expo-crypto
- Session key: `session_user_email` in AsyncStorage
- Free limit: 2 techniques (changed from 3)
- Trial: 14 days full access after registration
- New accounts start empty (no sample data)

---

## Next Steps (Phase 4)

1. Run the app and do a visual walkthrough on a device or simulator
2. Toggle device to light mode — verify all screens look correct
3. Switch language to Hebrew — verify RTL layout
4. Grep for any remaining raw hex values and replace with tokens
5. Create a PR from `design` → `main` when satisfied
