import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Button } from './Button';

type EmptyStateVariant = 'techniques' | 'schedule' | 'search' | 'generic';

const VARIANT_CONFIG: Record<EmptyStateVariant, {
  icon: keyof typeof Ionicons.glyphMap;
  defaultTitle: string;
  defaultSubtitle: string;
}> = {
  techniques: {
    icon: 'play-circle-outline',
    defaultTitle: 'No techniques yet',
    defaultSubtitle: 'Save your first technique by tapping the + tab below.',
  },
  schedule: {
    icon: 'calendar-outline',
    defaultTitle: 'No trainings scheduled',
    defaultSubtitle: 'Add your regular training times to get reminders.',
  },
  search: {
    icon: 'search-outline',
    defaultTitle: 'No results found',
    defaultSubtitle: 'Try a different search term or clear the filters.',
  },
  generic: {
    icon: 'file-tray-outline',
    defaultTitle: 'Nothing here yet',
    defaultSubtitle: '',
  },
};

type EmptyStateProps = {
  variant?: EmptyStateVariant;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  style?: ViewStyle;
};

export function EmptyState({
  variant = 'generic',
  title,
  subtitle,
  ctaLabel,
  onCta,
  style,
}: EmptyStateProps) {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const config = VARIANT_CONFIG[variant];

  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }], opacity }, style]}>
      <View style={[styles.iconWrapper, { backgroundColor: palette.surfaceSunken }]}>
        <Ionicons name={config.icon} size={36} color={palette.textTertiary} />
      </View>
      <Text style={[styles.title, { color: palette.text }]}>
        {title ?? config.defaultTitle}
      </Text>
      {(subtitle ?? config.defaultSubtitle) ? (
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          {subtitle ?? config.defaultSubtitle}
        </Text>
      ) : null}
      {ctaLabel && onCta && (
        <Button label={ctaLabel} onPress={onCta} variant="primary" size="md" style={styles.cta} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: Spacing.screenPaddingH,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    marginTop: 20,
  },
});
