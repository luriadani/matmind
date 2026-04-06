import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { CategoryColors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { BorderRadius, Spacing } from '../../constants/Spacing';

type CategoryBadgeProps = {
  category: string;
  variant?: 'filled' | 'outline';
  compact?: boolean;
  style?: ViewStyle;
};

function getCategoryColor(category: string) {
  return CategoryColors[category as keyof typeof CategoryColors] ?? CategoryColors.default;
}

export function CategoryBadge({
  category,
  variant = 'filled',
  compact = false,
  style,
}: CategoryBadgeProps) {
  const colors = getCategoryColor(category);

  return (
    <View
      style={[
        styles.base,
        compact && styles.compact,
        variant === 'filled'
          ? { backgroundColor: colors.background, borderColor: colors.border }
          : { backgroundColor: 'transparent', borderColor: colors.text },
        style,
      ]}
    >
      <Text
        style={[styles.label, compact && styles.labelCompact, { color: colors.text }]}
        numberOfLines={1}
      >
        {category}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: BorderRadius.badge,
    paddingHorizontal: Spacing.badgeGapH,
    paddingVertical: Spacing.badgeGapV,
    alignSelf: 'flex-start',
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    ...Typography.badge,
  },
  labelCompact: {
    fontSize: 10,
  },
});
