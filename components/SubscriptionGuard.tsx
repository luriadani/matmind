import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppContext } from './Localization';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredLevel?: 'free' | 'premium' | 'admin';
}

export const useSubscriptionStatus = () => {
  const { user, isLoading } = useAppContext();
  
  // Disable all limitations - always return admin level
  const subscriptionStatus = user ? {
    level: 'admin', // Force admin level to disable all limitations
    isActive: true,
    expiresAt: null
  } : null;

  return {
    user,
    subscriptionStatus,
    isLoading
  };
};

export default function SubscriptionGuard({ children, requiredLevel = 'free' }: SubscriptionGuardProps) {
  const { user } = useAppContext();

  // If no user, show loading or redirect
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  // Check subscription level
  const userLevel = (user.subscription_level || 'free') as 'free' | 'premium' | 'admin';
  const userRole = user.role || 'user';

  // Admin role has access to everything
  if (userRole === 'admin') {
    return <>{children}</>;
  }

  // Check subscription level
  const levels = {
    free: 0,
    premium: 1,
    admin: 2
  };

  const hasAccess = levels[userLevel] >= levels[requiredLevel];

  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Upgrade Required</Text>
        <Text style={styles.text}>
          This feature requires a {requiredLevel} subscription.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
}); 