/**
 * MatMind Design System — Shadow Tokens
 *
 * Shadows add depth without going heavy (no neumorphism).
 * Dark mode uses no shadows — depth is created via surface color contrast instead.
 *
 * Usage:
 *   <View style={[styles.card, Shadows.card]} />
 *
 * Note: React Native shadow props only work on iOS.
 * For Android, use `elevation`. Both are included per token.
 */

import { Platform } from 'react-native';

type ShadowToken = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android
};

const makeShadow = (
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number
): ShadowToken => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

// ─── Light mode shadows (soft, warm-neutral) ─────────────────────────────────
export const Shadows = {
  // No visible shadow — use for flat surfaces
  none: makeShadow('transparent', 0, 0, 0, 0),

  // Very subtle — card lift on white background
  xs: makeShadow('#1A1A3A', 1, 0.04, 2, 1),

  // Standard card shadow
  sm: makeShadow('#1A1A3A', 2, 0.07, 6, 2),

  // Elevated cards, selected state
  md: makeShadow('#1A1A3A', 4, 0.09, 12, 4),

  // Modals, bottom sheets, FABs
  lg: makeShadow('#1A1A3A', 8, 0.12, 20, 8),

  // Full-screen overlays
  xl: makeShadow('#1A1A3A', 16, 0.16, 32, 16),

  // Platform-aware card shadow
  card: Platform.select({
    ios: makeShadow('#1A1A3A', 2, 0.08, 8, 0),
    android: makeShadow('transparent', 0, 0, 0, 3),
    default: makeShadow('#1A1A3A', 2, 0.08, 8, 3),
  }) as ShadowToken,
} as const;
