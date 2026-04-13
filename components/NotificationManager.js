import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from './Localization';
import { useColorScheme } from '../hooks/useColorScheme';
import { Brand, Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { BorderRadius, Spacing } from '../constants/Spacing';

const NotificationManager = () => {
  const { t } = useAppContext();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const [permission, setPermission] = useState('unknown');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setPermission('not-supported');
      return;
    }
    if (!('Notification' in window)) {
      setPermission('not-supported');
      return;
    }
    setPermission(Notification.permission); // 'granted' | 'denied' | 'default'
  }, []);

  const requestPermission = async () => {
    if (Platform.OS !== 'web' || !('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  // Hide if already granted, denied (user said no — don't nag), or not supported
  if (permission === 'granted' || permission === 'denied' || permission === 'not-supported' || permission === 'unknown') {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: Brand.warningMuted, borderColor: Brand.warning }]}>
      <Ionicons name="notifications" size={20} color={Brand.warning} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: Brand.warning }]}>{t('notifications.enable_notifications')}</Text>
        <Text style={[styles.description, { color: palette.textSecondary }]}>{t('notifications.enable_description')}</Text>
      </View>
      <TouchableOpacity style={[styles.enableButton, { backgroundColor: Brand.warning }]} onPress={requestPermission}>
        <Text style={styles.enableButtonText}>{t('notifications.enable_button')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.cardPaddingH,
    marginBottom: 16,
    gap: Spacing.inlineGap,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.smallMedium,
  },
  description: {
    ...Typography.caption,
  },
  enableButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  enableButtonText: {
    ...Typography.captionMedium,
    color: '#FFFFFF',
  },
});

export default NotificationManager;
