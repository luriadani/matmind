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
// Fixed colors for built-in categories
export const CategoryColors: Record<string, { background: string; text: string; border: string }> = {
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
};

// Palette for custom categories — deterministic by index (hash of name)
const CUSTOM_PALETTE = [
  { background: 'rgba(168,85,247,0.15)',  text: '#A855F7', border: 'rgba(168,85,247,0.3)'  }, // purple
  { background: 'rgba(236,72,153,0.15)',  text: '#EC4899', border: 'rgba(236,72,153,0.3)'  }, // pink
  { background: 'rgba(249,115,22,0.15)',  text: '#F97316', border: 'rgba(249,115,22,0.3)'  }, // orange
  { background: 'rgba(20,184,166,0.15)',  text: '#14B8A6', border: 'rgba(20,184,166,0.3)'  }, // teal
  { background: 'rgba(239,68,68,0.15)',   text: '#EF4444', border: 'rgba(239,68,68,0.3)'   }, // red
  { background: 'rgba(6,182,212,0.15)',   text: '#06B6D4', border: 'rgba(6,182,212,0.3)'   }, // cyan
  { background: 'rgba(132,204,22,0.15)',  text: '#84CC16', border: 'rgba(132,204,22,0.3)'  }, // lime
  { background: 'rgba(244,63,94,0.15)',   text: '#F43F5E', border: 'rgba(244,63,94,0.3)'   }, // rose
  { background: 'rgba(234,179,8,0.15)',   text: '#EAB308', border: 'rgba(234,179,8,0.3)'   }, // yellow
  { background: 'rgba(59,130,246,0.15)',  text: '#3B82F6', border: 'rgba(59,130,246,0.3)'  }, // blue
];

// Simple djb2 hash — same string always → same number
const hashString = (str: string): number => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return Math.abs(h);
};

// Exported helper — use everywhere instead of CategoryColors[cat] ?? default
export const getCategoryColor = (category: string) => {
  if (CategoryColors[category]) return CategoryColors[category];
  return CUSTOM_PALETTE[hashString(category) % CUSTOM_PALETTE.length];
};

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
