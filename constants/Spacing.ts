/**
 * MatMind Design System — Spacing & Layout Tokens
 *
 * 4-point grid system — all values are multiples of 4
 * Use these everywhere instead of raw numbers.
 */

export const Space = {
  px: 1,
  '0.5': 2,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '10': 40,
  '12': 48,
  '14': 56,
  '16': 64,
} as const;

// Semantic aliases — prefer these in component code
export const Spacing = {
  // Insets (internal padding)
  cardPaddingH: 16,     // Horizontal padding inside cards
  cardPaddingV: 14,     // Vertical padding inside cards
  screenPaddingH: 16,   // Screen horizontal padding
  screenPaddingV: 16,   // Screen vertical padding
  sectionGap: 24,       // Between sections on a screen
  itemGap: 12,          // Between items in a list
  inlineGap: 8,         // Between inline elements (icon + text)
  badgeGapH: 8,         // Badge horizontal padding
  badgeGapV: 4,         // Badge vertical padding

  // Thumbnail aspect ratio helper
  thumbnailAspectRatio: 9 / 16, // width × this = height (16:9 landscape)
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,

  // Semantic
  card: 16,
  badge: 8,
  button: 12,
  modal: 20,
  thumbnail: 12,
  avatar: 9999,
  input: 12,
  tab: 9999,
} as const;
