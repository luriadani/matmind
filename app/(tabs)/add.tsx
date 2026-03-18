import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Technique } from '@/entities/all';
import { canCreateTechnique } from '@/services/billing/entitlements';
import { useSubscriptionStatus } from '@/components/SubscriptionGuard';

export default function AddTab() {
  const [error, setError] = useState(null);
  const { user, subscriptionStatus } = useSubscriptionStatus();

  useEffect(() => {
    try {
      // Add a small delay to ensure proper navigation
      const timeout = setTimeout(async () => {
        if (!user || !subscriptionStatus) {
          router.replace('/pricing');
          return;
        }

        const ownTechniques = await Technique.filter({ created_by: user.email });
        if (!canCreateTechnique(subscriptionStatus, ownTechniques.length)) {
          router.replace('/pricing');
          return;
        }

        router.replace('/technique-form');
      }, 100);

      return () => clearTimeout(timeout);
    } catch (err) {
      console.error('Navigation error:', err);
      setError(err.message);
    }
  }, [subscriptionStatus, user]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Navigation Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
}); 