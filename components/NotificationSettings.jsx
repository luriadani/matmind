import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from './Localization';
import { useNotificationScheduler } from './NotificationScheduler';
import { useColorScheme } from '../hooks/useColorScheme';
import { Brand, Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { BorderRadius } from '../constants/Spacing';

const isExpoGo = Constants.appOwnership === 'expo';

const NotificationSettings = ({ formData, handleChange }) => {
  const { t } = useAppContext();
  const { getScheduledNotifications } = useNotificationScheduler();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const [notificationPermission, setNotificationPermission] = useState('default');
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    if (isExpoGo) { setNotificationPermission('not-supported'); return; }
    const check = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationPermission(status);
      } catch { setNotificationPermission('default'); }
    };
    const loadCount = async () => {
      try {
        const n = await getScheduledNotifications();
        setScheduledCount(n.length);
      } catch {}
    };
    check();
    loadCount();
  }, []);

  const requestPermission = async () => {
    if (isExpoGo) {
      Alert.alert('Expo Go Limitation', 'Push notifications are not supported in Expo Go. Please use a development build.', [{ text: 'OK' }]);
      return;
    }
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status);
      if (status === 'granted') handleChange('notifications_enabled', true);
    } catch {}
  };

  const forceRefresh = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermission(status);
      if (status === 'granted') handleChange('notifications_enabled', true);
    } catch {}
  };

  const testNotification = async () => {
    if (isExpoGo) {
      Alert.alert('Expo Go Limitation', 'Test notifications are not supported in Expo Go. Create a development build to test.', [{ text: 'OK' }]);
      return;
    }
    try {
      if (notificationPermission === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: t('notifications.training_reminder_title'),
            body: 'Time to check your drills! Open the app to review your techniques.',
          },
          trigger: { seconds: 1 },
        });
        Alert.alert('Success', 'Test notification scheduled!');
      } else {
        Alert.alert('Permission Required', 'Please enable notifications first.');
      }
    } catch { Alert.alert('Error', 'Failed to send test notification.'); }
  };

  const statusColor = {
    granted: Brand.success,
    denied: Brand.accent,
    undetermined: Brand.warning,
  }[notificationPermission] ?? palette.textTertiary;

  const statusLabel = {
    granted: 'Enabled',
    denied: 'Blocked',
    undetermined: 'Not Set',
    'not-supported': 'Not Supported',
  }[notificationPermission] ?? 'Checking...';

  return (
    <View style={styles.container}>
      {/* Status row */}
      <View style={styles.statusRow}>
        <Text style={[styles.statusKey, { color: palette.textSecondary }]}>Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20`, borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {scheduledCount > 0 && (
          <Text style={[styles.scheduledText, { color: palette.textTertiary }]}>
            {scheduledCount} reminder{scheduledCount !== 1 ? 's' : ''} scheduled
          </Text>
        )}
      </View>

      {/* Denied alert */}
      {notificationPermission === 'denied' && (
        <View style={[styles.alert, { backgroundColor: Brand.accentMuted, borderColor: Brand.accent }]}>
          <Ionicons name="notifications-off-outline" size={18} color={Brand.accent} />
          <View style={styles.alertBody}>
            <Text style={[styles.alertTitle, { color: Brand.accent }]}>{t('notifications.permission_denied')}</Text>
            <Text style={[styles.alertDesc, { color: palette.textSecondary }]}>{t('notifications.permission_denied_help')}</Text>
            <TouchableOpacity
              style={[styles.checkAgainBtn, { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary }]}
              onPress={forceRefresh}
            >
              <Text style={[styles.checkAgainText, { color: Brand.primary }]}>{t('notifications.check_again')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Expo Go alert */}
      {isExpoGo && (
        <View style={[styles.alert, { backgroundColor: Brand.warningMuted, borderColor: Brand.warning }]}>
          <Ionicons name="information-circle-outline" size={18} color={Brand.warning} />
          <View style={styles.alertBody}>
            <Text style={[styles.alertTitle, { color: Brand.warning }]}>Expo Go Limitation</Text>
            <Text style={[styles.alertDesc, { color: palette.textSecondary }]}>
              Push notifications require a development build. See DEVELOPMENT_BUILD.md.
            </Text>
          </View>
        </View>
      )}

      {/* Toggle */}
      <View style={styles.switchRow}>
        <View style={styles.switchLabel}>
          <Text style={[styles.switchTitle, { color: palette.text }]}>
            {formData.notifications_enabled ? t('notifications.enabled') : t('notifications.disabled')}
          </Text>
          <Text style={[styles.switchDesc, { color: palette.textSecondary }]}>{t('notifications.enable_description')}</Text>
        </View>
        <Switch
          value={formData.notifications_enabled && notificationPermission === 'granted'}
          onValueChange={(checked) => {
            if (checked && notificationPermission !== 'granted') requestPermission();
            else handleChange('notifications_enabled', checked);
          }}
          disabled={notificationPermission === 'denied' || notificationPermission === 'not-supported'}
          trackColor={{ false: palette.surfaceSunken, true: Brand.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Timing picker */}
      {formData.notifications_enabled && notificationPermission === 'granted' && (
        <>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>
              {t('notifications.minutes_before_training')}
            </Text>
            <View style={styles.pillRow}>
              {[10, 15, 30, 45, 60, 120].map(minutes => {
                const active = (formData.notification_minutes_before || 10) === minutes;
                const label = minutes === 60 ? t('settings.1_hour') : minutes === 120 ? t('settings.2_hours') : `${minutes} ${t('settings.minutes')}`;
                return (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.pill,
                      { backgroundColor: palette.surfaceSunken, borderColor: palette.border },
                      active && { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary },
                    ]}
                    onPress={() => handleChange('notification_minutes_before', minutes)}
                  >
                    <Text style={[styles.pillText, { color: active ? Brand.primary : palette.textSecondary }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.testBtn, { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary }]}
            onPress={testNotification}
          >
            <Ionicons name="notifications-outline" size={15} color={Brand.primary} />
            <Text style={[styles.testBtnText, { color: Brand.primary }]}>{t('notifications.test_notification')}</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Enable button */}
      {notificationPermission === 'default' && !isExpoGo && (
        <TouchableOpacity
          style={[styles.enableBtn, { backgroundColor: Brand.primary }]}
          onPress={requestPermission}
        >
          <Ionicons name="notifications-outline" size={15} color="#FFFFFF" />
          <Text style={styles.enableBtnText}>{t('notifications.enable_button')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  statusKey: {
    ...Typography.smallMedium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...Typography.captionMedium,
  },
  scheduledText: {
    ...Typography.caption,
  },
  alert: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  alertBody: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    ...Typography.smallMedium,
  },
  alertDesc: {
    ...Typography.caption,
  },
  checkAgainBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  checkAgainText: {
    ...Typography.captionMedium,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    ...Typography.smallMedium,
  },
  switchDesc: {
    ...Typography.caption,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    ...Typography.smallMedium,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  pillText: {
    ...Typography.captionMedium,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  testBtnText: {
    ...Typography.smallMedium,
  },
  enableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  enableBtnText: {
    ...Typography.bodySemibold,
    color: '#FFFFFF',
  },
});

export default NotificationSettings;
