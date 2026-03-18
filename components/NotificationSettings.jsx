import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from './Localization';
import { useNotificationScheduler } from './NotificationScheduler';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

const NotificationSettings = ({ formData, handleChange }) => {
  const { t } = useAppContext();
  const { getScheduledNotifications } = useNotificationScheduler();
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    if (isExpoGo) {
      setNotificationPermission('not-supported');
      return;
    }

    const checkNotificationPermission = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationPermission(status);
      } catch (error) {
        console.error('Error checking notification permission:', error);
        setNotificationPermission('default');
      }
    };

    const loadScheduledNotifications = async () => {
      try {
        const notifications = await getScheduledNotifications();
        setScheduledCount(notifications.length);
      } catch (error) {
        console.error('Error loading scheduled notifications:', error);
      }
    };

    checkNotificationPermission();
    loadScheduledNotifications();
  }, []);

  const requestNotificationPermission = async () => {
    if (isExpoGo) {
      Alert.alert(
        'Expo Go Limitation',
        'Push notifications are not supported in Expo Go. Please use a development build for full notification functionality.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status);
      if (status === 'granted') {
        handleChange('notifications_enabled', true);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const forceRefreshPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermission(status);
      if (status === 'granted') {
        handleChange('notifications_enabled', true);
      }
    } catch (error) {
      console.error('Error refreshing notification permission:', error);
    }
  };

  const testNotification = async () => {
    if (isExpoGo) {
      Alert.alert(
        'Expo Go Limitation',
        'Test notifications are not supported in Expo Go. To test notifications:\n\n1. Create a development build using EAS Build\n2. Install the development build on your device\n3. Use the test notification feature\n\nSee DEVELOPMENT_BUILD.md for detailed instructions.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      if (notificationPermission === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: t('notifications.training_reminder_title'),
            body: 'Time to check your drills! You have 3 technique(s) ready for your training. Open the app to review your techniques.',
          },
          trigger: { seconds: 1 },
        });
        Alert.alert('Success', 'Test notification scheduled!');
      } else {
        Alert.alert('Permission Required', 'Please enable notifications first.');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const getNotificationStatusText = () => {
    switch (notificationPermission) {
      case 'granted':
        return 'Notifications Enabled';
      case 'denied':
        return 'Notifications Blocked';
      case 'undetermined':
        return 'Permission Not Set';
      default:
        return 'Checking Permission...';
    }
  };

  const getNotificationStatusColor = () => {
    switch (notificationPermission) {
      case 'granted':
        return '#10B981';
      case 'denied':
        return '#EF4444';
      case 'undetermined':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="notifications" size={20} color="white" />
          <Text style={styles.cardTitle}>{t('notifications.settings_title')}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        {/* Permission Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getNotificationStatusColor() }]}>
              <Text style={styles.statusText}>{getNotificationStatusText()}</Text>
            </View>
          </View>
          {scheduledCount > 0 && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Scheduled:</Text>
              <Text style={styles.statusValue}>{scheduledCount} reminder{scheduledCount !== 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>

        {/* Permission Denied Alert */}
        {notificationPermission === 'denied' && (
          <View style={styles.alertContainer}>
            <View style={styles.alertContent}>
              <Ionicons name="notifications-off" size={20} color="#EF4444" />
              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>{t('notifications.permission_denied')}</Text>
                <Text style={styles.alertDescription}>{t('notifications.permission_denied_help')}</Text>
                <Text style={styles.alertHint}>{t('notifications.refresh_after_change')}</Text>
                <View style={styles.alertButtons}>
                  <TouchableOpacity style={styles.alertButton} onPress={forceRefreshPermission}>
                    <Text style={styles.alertButtonText}>{t('notifications.check_again')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Expo Go Alert */}
        {isExpoGo && (
          <View style={styles.alertContainer}>
            <View style={styles.alertContent}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <View style={styles.alertText}>
                <Text style={[styles.alertTitle, { color: '#FCD34D' }]}>Expo Go Limitation</Text>
                <Text style={[styles.alertDescription, { color: '#FCD34D' }]}>
                  Push notifications are not supported in Expo Go. To test notifications, create a development build using EAS Build.
                </Text>
                <Text style={[styles.alertHint, { color: '#FCD34D' }]}>
                  See DEVELOPMENT_BUILD.md for instructions.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Not Supported Alert */}
        {!isExpoGo && notificationPermission === 'not-supported' && (
          <View style={styles.alertContainer}>
            <Ionicons name="notifications-off" size={16} color="#EF4444" />
            <Text style={styles.alertDescription}>Your device does not support notifications.</Text>
          </View>
        )}

        {/* Notification Toggle */}
        <View style={styles.switchField}>
          <View style={styles.switchLabel}>
            <Text style={styles.switchTitle}>
              {formData.notifications_enabled ? t('notifications.enabled') : t('notifications.disabled')}
            </Text>
            <Text style={styles.switchDescription}>{t('notifications.enable_description')}</Text>
          </View>
          <Switch
            value={formData.notifications_enabled && notificationPermission === 'granted'}
            onValueChange={(checked) => {
              if (checked && notificationPermission !== 'granted') {
                requestNotificationPermission();
              } else {
                handleChange('notifications_enabled', checked);
              }
            }}
            disabled={notificationPermission === 'denied' || notificationPermission === 'not-supported'}
            trackColor={{ false: '#374151', true: '#3B82F6' }}
            thumbColor={formData.notifications_enabled && notificationPermission === 'granted' ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        {/* Notification Settings */}
        {formData.notifications_enabled && notificationPermission === 'granted' && (
          <>
            <View style={styles.formField}>
              <Text style={styles.label}>{t('notifications.minutes_before_training')}</Text>
              <View style={styles.pickerContainer}>
                {[10, 15, 30, 45, 60, 120].map(minutes => (
                  <TouchableOpacity
                    key={minutes}
                    style={[styles.pickerOption, (formData.notification_minutes_before || 10) === minutes && styles.pickerOptionSelected]}
                    onPress={() => handleChange('notification_minutes_before', minutes)}
                  >
                    <Text style={[styles.pickerOptionText, (formData.notification_minutes_before || 10) === minutes && styles.pickerOptionTextSelected]}>
                      {minutes === 60 ? t('settings.1_hour') : minutes === 120 ? t('settings.2_hours') : `${minutes} ${t('settings.minutes')}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.testButton} onPress={testNotification}>
              <Ionicons name="notifications" size={16} color="white" />
              <Text style={styles.testButtonText}>{t('notifications.test_notification')}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Enable Button */}
        {notificationPermission === 'default' && (
          <TouchableOpacity style={styles.enableButton} onPress={requestNotificationPermission}>
            <Ionicons name="notifications" size={16} color="white" />
            <Text style={styles.enableButtonText}>{t('notifications.enable_button')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    marginBottom: 16,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  cardContent: {
    padding: 16,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  statusValue: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
  },
  alertContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FCA5A5',
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: '#FCA5A5',
    marginBottom: 8,
  },
  alertHint: {
    fontSize: 12,
    color: '#F87171',
    marginBottom: 16,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  alertButton: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  alertButtonText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '500',
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  pickerOptionSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  pickerOptionText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  pickerOptionTextSelected: {
    color: 'white',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignSelf: 'flex-start',
  },
  testButtonText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  enableButtonText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default NotificationSettings; 