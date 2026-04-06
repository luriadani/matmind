import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Brand } from '../../constants/Colors';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  divider?: boolean;
  style?: ViewStyle;
};

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  divider = false,
  style,
}: SectionHeaderProps) {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  return (
    <View style={style}>
      <View style={styles.row}>
        <Text style={[styles.title, { color: palette.textSecondary }]}>{title}</Text>
        {actionLabel && onAction && (
          <Pressable onPress={onAction}>
            <Text style={[styles.action, { color: Brand.primary }]}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
      {divider && <View style={[styles.divider, { backgroundColor: palette.border }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.itemGap,
  },
  title: {
    ...Typography.sectionHeader,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  action: {
    ...Typography.smallMedium,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: Spacing.itemGap,
  },
});
