import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { verifyStripeSession } from '../services/billing/stripe';
import { useAppContext } from '../components/Localization';
import { Button } from '../components/ui/Button';
import { Brand, Colors } from '../constants/Colors';
import { BorderRadius, Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { useColorScheme } from '../hooks/useColorScheme';
import { BILLING_PLAN_IDS, BillingPlanId } from '@/constants/billing';

type Status = 'verifying' | 'success' | 'error';

export default function PaymentSuccess() {
  const { session_id, plan } = useLocalSearchParams<{ session_id: string; plan: string }>();
  const { updateUser, user } = useAppContext();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const [status, setStatus] = useState<Status>('verifying');
  const [planId, setPlanId] = useState<BillingPlanId | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!session_id) {
      setStatus('error');
      setErrorMsg('Missing session ID. Please contact support.');
      return;
    }
    verify();
  }, [session_id]);

  const verify = async () => {
    try {
      const result = await verifyStripeSession(session_id as string);
      const resolvedPlan = result.planId as BillingPlanId;
      setPlanId(resolvedPlan);
      activateSubscription(resolvedPlan);
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not verify payment.');
      setStatus('error');
    }
  };

  const activateSubscription = (resolvedPlan: BillingPlanId) => {
    const now = new Date();
    const updates =
      resolvedPlan === BILLING_PLAN_IDS.lifetime
        ? {
            subscription_status: 'lifetime',
            subscription_plan: BILLING_PLAN_IDS.lifetime,
            subscription_expiry_date: null,
            payment_method: 'stripe',
          }
        : {
            subscription_status: 'active',
            subscription_plan: BILLING_PLAN_IDS.yearly,
            subscription_expiry_date: new Date(
              now.getFullYear() + 1,
              now.getMonth(),
              now.getDate()
            ).toISOString(),
            payment_method: 'stripe',
          };
    updateUser({ ...updates, updated_date: now.toISOString() });
  };

  if (status === 'verifying') {
    return (
      <View style={[styles.screen, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={Brand.primary} />
        <Text style={[styles.verifyingText, { color: palette.textSecondary }]}>
          Confirming your payment…
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.screen, { backgroundColor: palette.background }]}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: Brand.accentMuted }]}>
            <Ionicons name="close-circle" size={40} color={Brand.accent} />
          </View>
          <Text style={[styles.title, { color: palette.text }]}>Payment issue</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{errorMsg}</Text>
          <Button
            label="Back to Pricing"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.replace('/pricing')}
          />
        </View>
      </View>
    );
  }

  const isLifetime = planId === BILLING_PLAN_IDS.lifetime;

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: Brand.successMuted }]}>
          <Ionicons name="checkmark-circle" size={48} color={Brand.success} />
        </View>

        <Text style={[styles.title, { color: palette.text }]}>You're all set!</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
          {isLifetime
            ? 'Lifetime access activated. Welcome to MatMind!'
            : 'Yearly subscription activated. Start saving techniques!'}
        </Text>

        <View style={[styles.badge, { backgroundColor: Brand.primaryMuted }]}>
          <Ionicons name="ribbon" size={14} color={Brand.primary} />
          <Text style={[styles.badgeText, { color: Brand.primary }]}>
            {isLifetime ? 'Lifetime Member' : 'Pro — Yearly'}
          </Text>
        </View>

        <Button
          label="Start using MatMind"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.replace('/(tabs)')}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.screenPaddingH,
  },
  verifyingText: {
    ...Typography.body,
    marginTop: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    ...Typography.titleLarge,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    ...Typography.smallMedium,
  },
  cta: {
    marginTop: 8,
    width: '100%',
  },
});
