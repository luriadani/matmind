import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppContext } from './Localization';
import { BILLING_CONFIG, BillingTier } from '@/constants/billing';
import { deriveEntitlementState, hasTierAccess } from '@/services/billing/entitlements';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredLevel?: 'free' | 'premium' | 'admin';
}

const levelToTier: Record<'free' | 'premium' | 'admin', BillingTier> = {
  free: 'free_limited',
  premium: 'paid_yearly',
  admin: 'admin',
};

export const useSubscriptionStatus = () => {
  const { user, isLoading } = useAppContext();
  const subscriptionStatus = deriveEntitlementState(user);

  return {
    user,
    subscriptionStatus,
    isLoading,
    freeTechniqueLimit: BILLING_CONFIG.freeTechniqueLimit,
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

  const currentEntitlement = deriveEntitlementState(user);
  const hasAccess = currentEntitlement
    ? hasTierAccess(currentEntitlement.tier, levelToTier[requiredLevel])
    : false;

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