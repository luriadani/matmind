import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface PlatformIconProps {
  platform: string;
  size?: number;
  color?: string;
}

export default function PlatformIcon({ platform, size = 20, color = '#007AFF' }: PlatformIconProps) {
  const getIconName = () => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'logo-instagram';
      case 'facebook':
        return 'logo-facebook';
      case 'youtube':
        return 'logo-youtube';
      case 'tiktok':
        return 'logo-tiktok';
      case 'vimeo':
        return 'logo-vimeo';
      default:
        return 'play-circle';
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name={getIconName() as any} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 