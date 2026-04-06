/**
 * MatMind Design System — Typography Tokens
 *
 * Scale: based on iOS system sizing conventions
 * Font: System default (-apple-system / Roboto) — no load delay, native feel
 *
 * Hierarchy:
 *   Display  → Screen headers, hero numbers
 *   Title    → Card titles, section headers
 *   Body     → Main readable content
 *   Caption  → Metadata, timestamps, tags
 *   Micro    → Badges, labels, tab icons
 */

export const FontSize = {
  micro: 10,
  caption: 12,
  small: 13,
  body: 15,
  bodyLarge: 17,
  title: 20,
  titleLarge: 24,
  display: 28,
  displayLarge: 34,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const LineHeight = {
  tight: 1.15,   // Titles, display
  normal: 1.4,   // Body text
  relaxed: 1.6,  // Notes, descriptions
} as const;

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.3,
  wider: 0.8,  // ALL CAPS labels
} as const;

// ─── Preset text styles ───────────────────────────────────────────────────────
// Use these in StyleSheet.create() via spread: ...Typography.styles.videoTitle

export const Typography = {
  // Headings
  displayLarge: {
    fontSize: FontSize.displayLarge,
    fontWeight: FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSize.displayLarge * LineHeight.tight,
  },
  display: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSize.display * LineHeight.tight,
  },
  titleLarge: {
    fontSize: FontSize.titleLarge,
    fontWeight: FontWeight.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSize.titleLarge * LineHeight.tight,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.semibold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSize.title * LineHeight.normal,
  },

  // Body
  bodyLarge: {
    fontSize: FontSize.bodyLarge,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.bodyLarge * LineHeight.normal,
  },
  body: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.body * LineHeight.normal,
  },
  bodyMedium: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.body * LineHeight.normal,
  },
  bodySemibold: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.body * LineHeight.normal,
  },

  // Supporting
  small: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.small * LineHeight.normal,
  },
  smallMedium: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.small * LineHeight.normal,
  },
  caption: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.caption * LineHeight.normal,
  },
  captionMedium: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.caption * LineHeight.normal,
  },
  micro: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.medium,
    letterSpacing: LetterSpacing.wider,
    lineHeight: FontSize.micro * LineHeight.normal,
  },

  // Special use
  videoTitle: {
    fontSize: FontSize.bodyLarge,
    fontWeight: FontWeight.semibold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSize.bodyLarge * 1.3,
  },
  sectionHeader: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semibold,
    letterSpacing: LetterSpacing.wider,
  },
  tabLabel: {
    fontSize: FontSize.micro,
    fontWeight: FontWeight.medium,
    letterSpacing: LetterSpacing.wide,
  },
  badge: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    letterSpacing: LetterSpacing.normal,
  },
} as const;
