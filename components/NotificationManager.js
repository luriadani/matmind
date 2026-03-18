import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from './Localization';

const NotificationManager = () => {
  const { t, settings } = useAppContext();
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    const checkPermission = () => {
      // React Native doesn't have window.Notification
      // For mobile, we'll use a default state
      setPermission('default');
    };

    checkPermission();
  }, []);

  const requestPermission = async () => {
    // React Native doesn't have window.Notification
    // For mobile, we'll simulate the permission flow
    try {
      setPermission('granted');
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  if (permission === 'granted' || permission === 'not-supported') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="notifications" size={20} color="#F59E0B" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('notifications.enable_notifications')}</Text>
          <Text style={styles.description}>{t('notifications.enable_description')}</Text>
        </View>
        <TouchableOpacity style={styles.enableButton} onPress={requestPermission}>
          <Text style={styles.enableButtonText}>{t('notifications.enable_button')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#F59E0B',
  },
  enableButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  enableButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default NotificationManager; 