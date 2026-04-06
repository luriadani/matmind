import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BILLING_PLANS, BILLING_PLAN_IDS, BillingPlanId } from '@/constants/billing';
import { trackCouponAttempt, validateCoupon } from '@/services/billing/coupons';
import {
  derivePaidPlanFromCustomerInfo,
  findStoreProductForPlan,
  getCurrentOffering,
  initializeRevenueCat,
  purchasePlanProduct,
  restorePurchases,
  setRevenueCatUser,
} from '@/services/billing/revenuecat';
import { deriveEntitlementState } from '@/services/billing/entitlements';
import { useAppContext } from '../components/Localization';
import { Button } from '../components/ui/Button';
import { Brand, Colors } from '../constants/Colors';
import { BorderRadius, Spacing } from '../constants/Spacing';
import { Shadows } from '../constants/Shadows';
import { Typography } from '../constants/Typography';
import { useColorScheme } from '../hooks/useColorScheme';

export default function Pricing() {
  const { t, user, updateUser } = useAppContext();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const [selectedPlan, setSelectedPlan] = useState<BillingPlanId>(BILLING_PLAN_IDS.yearly);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [isCouponValid, setIsCouponValid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const selectedPlanConfig = useMemo(
    () => BILLING_PLANS.find((p) => p.id === selectedPlan),
    [selectedPlan]
  );

  useEffect(() => {
    const init = async () => {
      const ok = await initializeRevenueCat(user?.id || user?.email);
      setIsInitialized(ok);
      if (ok && user?.id) await setRevenueCatUser(user.id);
    };
    init();
  }, [user?.id, user?.email]);

  const handleSelectPlan = (planId: BillingPlanId) => {
    setSelectedPlan(planId);
    setCouponMessage('');
    setIsCouponValid(false);
  };

  const handleApplyCoupon = async () => {
    if (!selectedPlanConfig || selectedPlan === BILLING_PLAN_IDS.free) {
      setCouponMessage('Coupon only available for paid plans.');
      setIsCouponValid(false);
      return;
    }
    const result = validateCoupon(couponCode, selectedPlan, selectedPlanConfig.basePrice);
    setIsCouponValid(result.isValid);
    setCouponMessage(
      result.isValid
        ? `${result.coupon.discountPercent}% off — ${selectedPlanConfig.displayPrice} → $${result.discountedPrice}`
        : result.reason
    );
    await trackCouponAttempt({
      code: couponCode.trim().toUpperCase(),
      planId: selectedPlan,
      userId: user?.id,
      email: user?.email,
      success: result.isValid,
      reason: result.isValid ? undefined : result.reason,
      at: new Date().toISOString(),
    });
  };

  const applyPaidEntitlementLocally = (planId: BillingPlanId) => {
    const now = new Date();
    const updates =
      planId === BILLING_PLAN_IDS.lifetime
        ? { subscription_status: 'lifetime', subscription_plan: BILLING_PLAN_IDS.lifetime, subscription_expiry_date: null, payment_method: 'store' }
        : { subscription_status: 'active', subscription_plan: BILLING_PLAN_IDS.yearly, subscription_expiry_date: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString(), payment_method: 'store' };
    updateUser({ ...updates, coupon_code: isCouponValid ? couponCode.trim().toUpperCase() : null, updated_date: now.toISOString() });
  };

  const handleSubscribe = async () => {
    if (!selectedPlanConfig) return;
    setIsProcessing(true);
    try {
      if (selectedPlan === BILLING_PLAN_IDS.free) {
        updateUser({ subscription_status: 'expired', subscription_plan: BILLING_PLAN_IDS.free, subscription_expiry_date: null, payment_method: null, updated_date: new Date().toISOString() });
        router.back();
        return;
      }
      const offering = await getCurrentOffering();
      const product = findStoreProductForPlan(offering, selectedPlan);
      if (!product) { Alert.alert('Unavailable', 'Product not configured in RevenueCat.'); return; }
      const customerInfo = await purchasePlanProduct(product);
      if (!customerInfo) { Alert.alert('Failed', 'Could not complete purchase.'); return; }
      const paidPlan = derivePaidPlanFromCustomerInfo(customerInfo);
      if (!paidPlan) { Alert.alert('Pending', 'Purchase complete — activating entitlement.'); return; }
      applyPaidEntitlementLocally(paidPlan);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to process the purchase.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      const info = await restorePurchases();
      if (!info) { Alert.alert('Unavailable', 'Could not restore purchases.'); return; }
      const plan = derivePaidPlanFromCustomerInfo(info);
      if (!plan) { Alert.alert('Not found', 'No active purchases found.'); return; }
      applyPaidEntitlementLocally(plan);
      Alert.alert('Restored', `Restored ${plan} subscription.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setIsProcessing(false);
    }
  };

  const entitlement = deriveEntitlementState(user);

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={palette.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          {t('pricing.title') || 'Choose a Plan'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
          {t('pricing.subtitle') || 'Unlock the full MatMind experience'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan cards */}
        <View style={styles.plans}>
          {BILLING_PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <Pressable
                key={plan.id}
                onPress={() => handleSelectPlan(plan.id)}
                style={[
                  styles.planCard,
                  { backgroundColor: palette.surface, borderColor: isSelected ? Brand.primary : palette.border },
                  isSelected && styles.planCardSelected,
                  Shadows.sm,
                ]}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: Brand.primary }]}>
                    <Text style={styles.popularText}>{t('pricing.most_popular') || 'Most Popular'}</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  {/* Selection indicator */}
                  <View style={[styles.radioOuter, { borderColor: isSelected ? Brand.primary : palette.border }]}>
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: Brand.primary }]} />}
                  </View>
                  <Text style={[styles.planName, { color: palette.text }]}>{plan.name}</Text>
                </View>

                {/* Price */}
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: palette.text }]}>{plan.displayPrice}</Text>
                  <Text style={[styles.period, { color: palette.textSecondary }]}>
                    {plan.period ? ` / ${plan.period}` : ''}
                  </Text>
                </View>

                {/* Features */}
                <View style={styles.features}>
                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={15} color={Brand.success} />
                      <Text style={[styles.featureText, { color: palette.textSecondary }]}>{f}</Text>
                    </View>
                  ))}
                  {plan.limitations?.map((l, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons name="close-circle" size={15} color={Brand.accent} />
                      <Text style={[styles.featureText, { color: palette.textTertiary }]}>{l}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Coupon */}
        <View style={[styles.couponCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.couponLabel, { color: palette.textSecondary }]}>
            COUPON CODE
          </Text>
          <View style={styles.couponRow}>
            <TextInput
              style={[
                styles.couponInput,
                { backgroundColor: palette.surfaceSunken, color: palette.text, borderColor: palette.border },
              ]}
              placeholder="e.g. WELCOME10"
              placeholderTextColor={palette.textTertiary}
              value={couponCode}
              autoCapitalize="characters"
              onChangeText={setCouponCode}
            />
            <Button label="Apply" variant="secondary" size="sm" onPress={handleApplyCoupon} />
          </View>
          {!!couponMessage && (
            <Text style={[styles.couponMsg, { color: isCouponValid ? Brand.success : Brand.accent }]}>
              {isCouponValid && '✓ '}{couponMessage}
            </Text>
          )}
        </View>

        {/* RevenueCat status (dev only) */}
        {!isInitialized && (
          <View style={[styles.statusCard, { backgroundColor: Brand.warningMuted, borderColor: Brand.warning }]}>
            <Ionicons name="warning-outline" size={14} color={Brand.warning} />
            <Text style={[styles.statusText, { color: Brand.warning }]}>
              RevenueCat not initialized — running in Expo Go or missing API keys.
            </Text>
          </View>
        )}

        {/* Subscribe */}
        <View style={styles.footer}>
          <Button
            label={isProcessing ? 'Processing...' : (t('pricing.subscribe_now') || 'Subscribe Now')}
            variant="primary"
            size="lg"
            fullWidth
            loading={isProcessing}
            onPress={handleSubscribe}
          />
          <Button
            label="Restore purchases"
            variant="ghost"
            size="md"
            fullWidth
            loading={isProcessing}
            onPress={handleRestore}
            style={styles.restoreBtn}
          />
          <Text style={[styles.terms, { color: palette.textTertiary }]}>
            {t('pricing.terms_text') || 'Subscriptions auto-renew until cancelled. Manage in your device settings.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    paddingHorizontal: Spacing.screenPaddingH,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: Spacing.screenPaddingH,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.titleLarge,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.body,
    textAlign: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.screenPaddingH,
    gap: 16,
    paddingBottom: 48,
  },

  plans: { gap: 12 },
  planCard: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    padding: 16,
    position: 'relative',
    overflow: 'visible',
  },
  planCardSelected: {
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -11,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  popularText: {
    ...Typography.captionMedium,
    color: '#FFF',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planName: {
    ...Typography.bodySemibold,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 12,
    marginLeft: 30,
  },
  price: {
    ...Typography.displayLarge,
  },
  period: {
    ...Typography.body,
  },
  features: {
    gap: 6,
    marginLeft: 30,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    ...Typography.small,
    flex: 1,
  },

  couponCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 14,
    gap: 10,
  },
  couponLabel: {
    ...Typography.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 9,
    ...Typography.body,
  },
  couponMsg: {
    ...Typography.small,
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: 10,
  },
  statusText: {
    ...Typography.caption,
    flex: 1,
  },

  footer: {
    gap: 8,
    marginTop: 8,
  },
  restoreBtn: {
    marginTop: 2,
  },
  terms: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
