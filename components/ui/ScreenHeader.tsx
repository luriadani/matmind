import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { useColorScheme } from '../../hooks/useColorScheme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function ScreenHeader({ title, subtitle, right, style }: ScreenHeaderProps) {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
        {right ? <View style={styles.rightSlot}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.sectionGap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textBlock: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    ...Typography.titleLarge,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    lineHeight: 20,
  },
  rightSlot: {
    paddingTop: 4,
  },
});
