/**
 * MatMind Design System — Color Tokens
 *
 * Philosophy:
 *  - Dark mode is the primary experience (content-forward like Instagram/TikTok)
 *  - Light mode is clean and airy (white cards, soft backgrounds)
 *  - Primary: Indigo (#5B6CF5) — modern, calm, slightly vibrant
 *  - Accent: Coral (#FF6B6B) — reminders, alerts, urgency
 *  - Minimal palette — 2–3 colors max visible at once
 */

// ─── Brand ────────────────────────────────────────────────────────────────────
export const Brand = {
  primary: '#5B6CF5',       // Indigo — main CTAs, active states, links
  primaryLight: '#7C8BFF',  // Hover / pressed state
  primaryDark: '#4A5AE0',   // Deeper shade
  primaryMuted: 'rgba(91,108,245,0.12)', // Subtle tinted backgrounds

  accent: '#FF6B6B',        // Coral — reminders, upcoming, alerts
  accentLight: '#FF8E8E',
  accentMuted: 'rgba(255,107,107,0.12)',

  success: '#00C896',       // Green — completed, active
  successMuted: 'rgba(0,200,150,0.12)',

  warning: '#FFB020',       // Amber — overdue, caution
  warningMuted: 'rgba(255,176,32,0.12)',
} as const;

// ─── Light Mode ───────────────────────────────────────────────────────────────
const light = {
  // Backgrounds
  background: '#F8F9FE',       // App background — very slight blue tint
  surface: '#FFFFFF',          // Cards, sheets
  surfaceElevated: '#FFFFFF',  // Modals, popovers
  surfaceSunken: '#F0F1F8',    // Input fields, inactive areas

  // Text
  text: '#0F0F1A',             // Primary text — near-black
  textSecondary: '#6B7280',    // Secondary / metadata
  textTertiary: '#A0A8B8',     // Placeholder, disabled
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E8EAF2',
  borderStrong: '#D0D4E8',
  divider: '#F0F1F8',

  // Interactive
  tint: Brand.primary,
  icon: '#6B7280',
  tabIconDefault: '#A0A8B8',
  tabIconSelected: Brand.primary,

  // Overlays
  overlay: 'rgba(15,15,26,0.5)',
  thumbnailOverlay: 'rgba(15,15,26,0.35)',

  // Semantic (reuse Brand)
  ...Brand,
};

// ─── Dark Mode ────────────────────────────────────────────────────────────────
const dark = {
  // Backgrounds — softened dark (less pitch-black, more charcoal)
  background: '#0E0E18',       // App background
  surface: '#1A1A28',          // Cards
  surfaceElevated: '#232336',  // Modals, bottom sheets
  surfaceSunken: '#14141F',    // Input fields

  // Text
  text: '#F0F0FA',             // Primary text
  textSecondary: '#9898B8',    // Metadata, labels
  textTertiary: '#5A5A78',     // Placeholder, disabled
  textInverse: '#0F0F1A',

  // Borders & Dividers
  border: '#30304A',
  borderStrong: '#44446A',
  divider: '#232336',

  // Interactive
  tint: Brand.primaryLight,
  icon: '#9898B8',
  tabIconDefault: '#5A5A78',
  tabIconSelected: Brand.primaryLight,

  // Overlays
  overlay: 'rgba(0,0,0,0.65)',
  thumbnailOverlay: 'rgba(0,0,0,0.35)',

  // Semantic (reuse Brand)
  ...Brand,
};

export const Colors = { light, dark };

export type ColorScheme = typeof light;

// ─── Category Colors ─────────────────────────────────────────────────────────
// Used for technique category badges
export const CategoryColors = {
  'Try Next Class': {
    background: 'rgba(91,108,245,0.15)',
    text: '#7C8BFF',
    border: 'rgba(91,108,245,0.3)',
  },
  'Show Coach': {
    background: 'rgba(0,200,150,0.15)',
    text: '#00C896',
    border: 'rgba(0,200,150,0.3)',
  },
  'Favorite': {
    background: 'rgba(255,176,32,0.15)',
    text: '#FFB020',
    border: 'rgba(255,176,32,0.3)',
  },
  default: {
    background: 'rgba(142,142,168,0.15)',
    text: '#8E8EA8',
    border: 'rgba(142,142,168,0.3)',
  },
} as const;

// ─── Media / Video ───────────────────────────────────────────────────────────
// Values that apply regardless of color scheme (e.g., video UI always dark)
export const Media = {
  thumbnailPlaceholderBg: '#232336', // Dark charcoal — video placeholder background
  thumbnailOverlayColor: 'rgba(0,0,0,0.18)',
} as const;

// ─── Training Category Colors ─────────────────────────────────────────────────
export const TrainingCategoryColors = {
  gi: {
    background: 'rgba(91,108,245,0.15)',
    text: '#7C8BFF',
    border: 'rgba(91,108,245,0.25)',
  },
  no_gi: {
    background: 'rgba(255,107,107,0.15)',
    text: '#FF8E8E',
    border: 'rgba(255,107,107,0.25)',
  },
  competition: {
    background: 'rgba(255,176,32,0.15)',
    text: '#FFB020',
    border: 'rgba(255,176,32,0.25)',
  },
  beginner: {
    background: 'rgba(0,200,150,0.15)',
    text: '#00C896',
    border: 'rgba(0,200,150,0.25)',
  },
  advanced: {
    background: 'rgba(255,107,107,0.15)',
    text: '#FF6B6B',
    border: 'rgba(255,107,107,0.25)',
  },
  open_mat: {
    background: 'rgba(142,142,168,0.15)',
    text: '#8E8EA8',
    border: 'rgba(142,142,168,0.25)',
  },
  default: {
    background: 'rgba(142,142,168,0.15)',
    text: '#8E8EA8',
    border: 'rgba(142,142,168,0.25)',
  },
} as const;
