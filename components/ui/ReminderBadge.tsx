import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Brand } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { BorderRadius, Spacing } from '../../constants/Spacing';

export type ReminderState = 'upcoming' | 'overdue' | 'done' | 'none';

type ReminderConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  background: string;
  border: string;
};

const CONFIG: Record<Exclude<ReminderState, 'none'>, ReminderConfig> = {
  upcoming: {
    icon: 'alarm-outline',
    label: 'Upcoming',
    color: Brand.accent,
    background: Brand.accentMuted,
    border: 'rgba(255,107,107,0.3)',
  },
  overdue: {
    icon: 'alert-circle-outline',
    label: 'Overdue',
    color: Brand.warning,
    background: Brand.warningMuted,
    border: 'rgba(255,176,32,0.3)',
  },
  done: {
    icon: 'checkmark-circle-outline',
    label: 'Done',
    color: Brand.success,
    background: Brand.successMuted,
    border: 'rgba(0,200,150,0.3)',
  },
};

type ReminderBadgeProps = {
  state: ReminderState;
  label?: string;
  style?: ViewStyle;
};

export function ReminderBadge({ state, label, style }: ReminderBadgeProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state !== 'upcoming') return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [state]);

  if (state === 'none') return null;

  const config = CONFIG[state];
  const displayLabel = label ?? config.label;

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: config.background,
          borderColor: config.border,
          transform: state === 'upcoming' ? [{ scale: pulse }] : [],
        },
        style,
      ]}
    >
      <Ionicons name={config.icon} size={12} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>{displayLabel}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.badgeGapH,
    paddingVertical: Spacing.badgeGapV,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.captionMedium,
  },
});
