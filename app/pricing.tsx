import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { validateCoupon } from '@/services/billing/coupons';
import { BILLING_PLANS, BILLING_PLAN_IDS, BillingPlanId } from '@/constants/billing';
import { useAppContext } from '../components/Localization';
import { Button } from '../components/ui/Button';
import { Brand, Colors } from '../constants/Colors';
import { BorderRadius, Spacing } from '../constants/Spacing';
import { Shadows } from '../constants/Shadows';
import { Typography } from '../constants/Typography';
import { useColorScheme } from '../hooks/useColorScheme';

// Coupon codes shown for testing — remove from production
const TEST_COUPONS = [
  { code: 'YEARLY20',   label: '20% off Yearly' },
  { code: 'LIFETIME15', label: '15% off Lifetime' },
  { code: 'WELCOME10',  label: '10% off any plan' },
  { code: 'FOUNDER',    label: '100% off — Free' },
];

export default function Pricing() {
  const { user, updateUser } = useAppContext();
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];

  const [selectedPlan, setSelectedPlan] = useState<BillingPlanId>(BILLING_PLAN_IDS.yearly);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<any>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedPlanConfig = useMemo(
    () => BILLING_PLANS.find((p) => p.id === selectedPlan),
    [selectedPlan]
  );

  const finalPrice = couponResult?.isValid
    ? couponResult.discountedPrice
    : selectedPlanConfig?.basePrice ?? 0;

  const handleSelectPlan = (planId: BillingPlanId) => {
    setSelectedPlan(planId);
    setCouponCode('');
    setCouponResult(null);
  };

  const handleApplyCoupon = () => {
    if (!selectedPlanConfig) return;
    const result = validateCoupon(couponCode, selectedPlan, selectedPlanConfig.basePrice);
    setCouponResult(result);
  };

  const handleQuickCoupon = (code: string) => {
    setCouponCode(code);
    if (!selectedPlanConfig) return;
    const result = validateCoupon(code, selectedPlan, selectedPlanConfig.basePrice);
    setCouponResult(result);
  };

  // Persist subscription to Supabase + local context
  const activateSubscription = async (planId: BillingPlanId) => {
    if (!user) return;
    const now = new Date();
    const isLifetime = planId === BILLING_PLAN_IDS.lifetime;

    const updates = isLifetime
      ? {
          subscription_plan: BILLING_PLAN_IDS.lifetime,
          subscription_status: 'lifetime',
          subscription_expiry_date: null,
        }
      : {
          subscription_plan: BILLING_PLAN_IDS.yearly,
          subscription_status: 'active',
          subscription_expiry_date: new Date(
            now.getFullYear() + 1, now.getMonth(), now.getDate()
          ).toISOString(),
        };

    const profileUpdates = {
      ...updates,
      coupon_code: couponResult?.isValid ? couponCode.trim().toUpperCase() : null,
      updated_at: now.toISOString(),
    };

    // Save to Supabase
    await supabase.from('profiles').update(profileUpdates).eq('id', user.id);

    // Update local context
    updateUser({ ...updates, coupon_code: profileUpdates.coupon_code });
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlanConfig || selectedPlan === BILLING_PLAN_IDS.free) return;
    setIsProcessing(true);
    try {
      await activateSubscription(selectedPlan);
      setSuccess(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);
    } catch (e) {
      console.error('Payment error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' }]}>
        <View style={[styles.successRing, { backgroundColor: Brand.successMuted, borderColor: Brand.success }]}>
          <Ionicons name="checkmark" size={40} color={Brand.success} />
        </View>
        <Text style={[styles.successTitle, { color: palette.text }]}>Payment confirmed!</Text>
        <Text style={[styles.successSub, { color: palette.textSecondary }]}>
          {selectedPlan === BILLING_PLAN_IDS.lifetime
            ? 'Lifetime access activated.'
            : 'Yearly subscription activated.'}
        </Text>
      </View>
    );
  }

  // ── Checkout confirmation ──────────────────────────────────────────────────
  if (showCheckout && selectedPlanConfig) {
    return (
      <View style={[styles.screen, { backgroundColor: palette.background }]}>
        <View style={[styles.header, { borderBottomColor: palette.border }]}>
          <Pressable onPress={() => setShowCheckout(false)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={palette.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Review Order</Text>
        </View>

        <ScrollView contentContainerStyle={styles.checkoutContent}>
          {/* Order summary */}
          <View style={[styles.orderCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.orderLabel, { color: palette.textSecondary }]}>ORDER SUMMARY</Text>

            <View style={styles.orderRow}>
              <Text style={[styles.orderItem, { color: palette.text }]}>{selectedPlanConfig.name} Plan</Text>
              <Text style={[styles.orderItem, { color: palette.text }]}>{selectedPlanConfig.displayPrice}</Text>
            </View>

            {couponResult?.isValid && (
              <View style={styles.orderRow}>
                <Text style={[styles.orderDiscount, { color: Brand.success }]}>
                  Coupon {couponCode.toUpperCase()} ({couponResult.coupon.discountPercent}% off)
                </Text>
                <Text style={[styles.orderDiscount, { color: Brand.success }]}>
                  -${(selectedPlanConfig.basePrice - finalPrice).toFixed(2)}
                </Text>
              </View>
            )}

            <View style={[styles.orderDivider, { backgroundColor: palette.border }]} />

            <View style={styles.orderRow}>
              <Text style={[styles.orderTotal, { color: palette.text }]}>Total</Text>
              <Text style={[styles.orderTotalPrice, { color: Brand.primary }]}>${finalPrice.toFixed(2)}</Text>
            </View>

            <Text style={[styles.orderPeriod, { color: palette.textTertiary }]}>
              {selectedPlan === BILLING_PLAN_IDS.lifetime
                ? 'One-time payment — never expires'
                : 'Billed once per year — renews annually'}
            </Text>
          </View>

          {/* Features included */}
          <View style={[styles.orderCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.orderLabel, { color: palette.textSecondary }]}>WHAT YOU GET</Text>
            {selectedPlanConfig.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={Brand.success} />
                <Text style={[styles.featureText, { color: palette.text }]}>{f}</Text>
              </View>
            ))}
          </View>

          <Button
            label={isProcessing ? 'Processing…' : finalPrice === 0 ? 'Activate Free Access' : `Pay $${finalPrice.toFixed(2)}`}
            variant="primary"
            size="lg"
            fullWidth
            loading={isProcessing}
            onPress={handleConfirmPayment}
          />

          <Text style={[styles.terms, { color: palette.textTertiary }]}>
            Payment will be processed securely. By confirming you agree to the terms of service.
          </Text>
        </ScrollView>
      </View>
    );
  }

  // ── Plan selection ─────────────────────────────────────────────────────────
  const paidPlans = BILLING_PLANS.filter((p) => p.id !== BILLING_PLAN_IDS.free);

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Ionicons name="close" size={22} color={palette.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Choose a Plan</Text>
        <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
          Unlock the full MatMind experience
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Plan cards — only paid plans */}
        <View style={styles.plans}>
          {paidPlans.map((plan) => {
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
                {plan.popular && (
                  <View style={[styles.popularBadge, { backgroundColor: Brand.primary }]}>
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <View style={[styles.radioOuter, { borderColor: isSelected ? Brand.primary : palette.border }]}>
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: Brand.primary }]} />}
                  </View>
                  <Text style={[styles.planName, { color: palette.text }]}>{plan.name}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: isSelected ? Brand.primary : palette.text }]}>
                    {plan.displayPrice}
                  </Text>
                  <Text style={[styles.period, { color: palette.textSecondary }]}>
                    {plan.period ? ` / ${plan.period}` : ''}
                  </Text>
                </View>
                <View style={styles.features}>
                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={14} color={Brand.success} />
                      <Text style={[styles.featureText, { color: palette.textSecondary }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Coupon section */}
        <View style={[styles.couponCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.couponLabel, { color: palette.textSecondary }]}>COUPON CODE</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.couponInput, { backgroundColor: palette.surfaceSunken, color: palette.text, borderColor: palette.border }]}
              placeholder="e.g. YEARLY20"
              placeholderTextColor={palette.textTertiary}
              value={couponCode}
              autoCapitalize="characters"
              onChangeText={(v) => { setCouponCode(v); setCouponResult(null); }}
            />
            <Button label="Apply" variant="secondary" size="sm" onPress={handleApplyCoupon} />
          </View>

          {couponResult && (
            <Text style={[styles.couponMsg, { color: couponResult.isValid ? Brand.success : Brand.accent }]}>
              {couponResult.isValid
                ? `✓ ${couponResult.coupon.discountPercent}% off — ${selectedPlanConfig?.displayPrice} → $${couponResult.discountedPrice}`
                : couponResult.reason}
            </Text>
          )}

          {/* Quick-apply test coupons */}
          <Text style={[styles.couponHint, { color: palette.textTertiary }]}>Available codes:</Text>
          <View style={styles.couponChips}>
            {TEST_COUPONS.map((c) => (
              <Pressable
                key={c.code}
                onPress={() => handleQuickCoupon(c.code)}
                style={[styles.couponChip, { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary }]}
              >
                <Text style={[styles.couponChipCode, { color: Brand.primary }]}>{c.code}</Text>
                <Text style={[styles.couponChipLabel, { color: palette.textSecondary }]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* CTA */}
        <Button
          label={finalPrice === 0 ? 'Activate Free Access' : `Continue — $${finalPrice.toFixed(2)}`}
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => setShowCheckout(true)}
        />

        <Text style={[styles.terms, { color: palette.textTertiary }]}>
          Secure payment. Cancel or contact us anytime.
        </Text>
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
  closeBtn: { position: 'absolute', top: 16, right: Spacing.screenPaddingH },
  backBtn: { position: 'absolute', top: 16, left: Spacing.screenPaddingH },
  headerTitle: { ...Typography.titleLarge, textAlign: 'center', marginBottom: 4 },
  headerSubtitle: { ...Typography.body, textAlign: 'center' },

  scrollContent: { padding: Spacing.screenPaddingH, gap: 16, paddingBottom: 48 },
  checkoutContent: { padding: Spacing.screenPaddingH, gap: 16, paddingBottom: 48 },

  plans: { gap: 12 },
  planCard: { borderWidth: 1.5, borderRadius: BorderRadius.lg, padding: 16, position: 'relative', overflow: 'visible' },
  planCardSelected: { borderWidth: 2 },
  popularBadge: { position: 'absolute', top: -11, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 3, borderRadius: BorderRadius.full },
  popularText: { ...Typography.captionMedium, color: '#FFF' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  planName: { ...Typography.bodySemibold },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginBottom: 12, marginLeft: 30 },
  price: { ...Typography.displayLarge },
  period: { ...Typography.body },
  features: { gap: 6, marginLeft: 30 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { ...Typography.small, flex: 1 },

  couponCard: { borderWidth: 1, borderRadius: BorderRadius.md, padding: 14, gap: 10 },
  couponLabel: { ...Typography.micro, textTransform: 'uppercase', letterSpacing: 0.8 },
  couponRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  couponInput: { flex: 1, borderWidth: 1, borderRadius: BorderRadius.input, paddingHorizontal: 12, paddingVertical: 9, ...Typography.body },
  couponMsg: { ...Typography.small },
  couponHint: { ...Typography.caption, marginTop: 4 },
  couponChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  couponChip: { borderWidth: 1, borderRadius: BorderRadius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  couponChipCode: { ...Typography.smallMedium, fontWeight: '700' },
  couponChipLabel: { ...Typography.caption },

  terms: { ...Typography.caption, textAlign: 'center', lineHeight: 18 },

  // Order summary
  orderCard: { borderWidth: 1, borderRadius: BorderRadius.card, padding: 16, gap: 12 },
  orderLabel: { ...Typography.micro, textTransform: 'uppercase', letterSpacing: 0.8 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderItem: { ...Typography.body },
  orderDiscount: { ...Typography.body },
  orderDivider: { height: StyleSheet.hairlineWidth },
  orderTotal: { ...Typography.bodyMedium, fontWeight: '700' },
  orderTotalPrice: { ...Typography.titleLarge, fontWeight: '700' },
  orderPeriod: { ...Typography.caption, textAlign: 'center' },

  // Success
  successRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { ...Typography.titleLarge, fontWeight: '700', marginBottom: 8 },
  successSub: { ...Typography.body, textAlign: 'center' },
});
