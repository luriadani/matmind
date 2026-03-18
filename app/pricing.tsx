import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BILLING_PLANS, BILLING_PLAN_IDS, BillingPlanId } from '@/constants/billing';
import { trackCouponAttempt, validateCoupon } from '@/services/billing/coupons';
import { derivePaidPlanFromCustomerInfo, findStoreProductForPlan, getCurrentOffering, initializeRevenueCat, purchasePlanProduct, restorePurchases, setRevenueCatUser } from '@/services/billing/revenuecat';
import { useAppContext } from '../components/Localization';
import { deriveEntitlementState } from '@/services/billing/entitlements';

export default function Pricing() {
  const { t, user, updateUser } = useAppContext();
  const [selectedPlan, setSelectedPlan] = useState<BillingPlanId>(BILLING_PLAN_IDS.yearly);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [isCouponValid, setIsCouponValid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const selectedPlanConfig = useMemo(
    () => BILLING_PLANS.find((plan) => plan.id === selectedPlan),
    [selectedPlan]
  );

  useEffect(() => {
    const initPurchases = async () => {
      const didInit = await initializeRevenueCat(user?.id || user?.email);
      setIsInitialized(didInit);
      if (didInit && user?.id) {
        await setRevenueCatUser(user.id);
      }
    };
    initPurchases();
  }, [user?.id, user?.email]);

  const handleSelectPlan = (planId: BillingPlanId) => {
    setSelectedPlan(planId);
    setCouponMessage('');
    setIsCouponValid(false);
  };

  const handleApplyCoupon = async () => {
    if (!selectedPlanConfig || selectedPlan === BILLING_PLAN_IDS.free) {
      setCouponMessage('Coupon is only available for paid plans.');
      setIsCouponValid(false);
      return;
    }

    const result = validateCoupon(couponCode, selectedPlan, selectedPlanConfig.basePrice);
    setIsCouponValid(result.isValid);
    setCouponMessage(
      result.isValid
        ? `Coupon applied: ${result.coupon.discountPercent}% off (${selectedPlanConfig.displayPrice} -> $${result.discountedPrice})`
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
        ? {
            subscription_status: 'lifetime',
            subscription_plan: BILLING_PLAN_IDS.lifetime,
            subscription_expiry_date: null,
            payment_method: 'store',
          }
        : {
            subscription_status: 'active',
            subscription_plan: BILLING_PLAN_IDS.yearly,
            subscription_expiry_date: new Date(
              now.getFullYear() + 1,
              now.getMonth(),
              now.getDate()
            ).toISOString(),
            payment_method: 'store',
          };

    updateUser({
      ...updates,
      coupon_code: isCouponValid ? couponCode.trim().toUpperCase() : null,
      updated_date: now.toISOString(),
    });
  };

  const handleSubscribe = async () => {
    if (!selectedPlanConfig) return;
    setIsProcessing(true);
    try {
      if (selectedPlan === BILLING_PLAN_IDS.free) {
        updateUser({
          subscription_status: 'expired',
          subscription_plan: BILLING_PLAN_IDS.free,
          subscription_expiry_date: null,
          payment_method: null,
          updated_date: new Date().toISOString(),
        });
        Alert.alert('Plan updated', 'You are now on the free plan.');
        router.back();
        return;
      }

      const offering = await getCurrentOffering();
      const product = findStoreProductForPlan(offering, selectedPlan);
      if (!product) {
        Alert.alert(
          'Billing unavailable',
          'Plan product is not configured in RevenueCat yet. Please verify product IDs and offering setup.'
        );
        return;
      }

      const customerInfo = await purchasePlanProduct(product);
      if (!customerInfo) {
        Alert.alert('Purchase failed', 'Could not complete purchase. Please try again.');
        return;
      }

      const paidPlan = derivePaidPlanFromCustomerInfo(customerInfo);
      if (!paidPlan) {
        Alert.alert('Purchase pending', 'Purchase completed, waiting for entitlement activation.');
        return;
      }

      applyPaidEntitlementLocally(paidPlan);
      Alert.alert('Success', `Subscription activated: ${paidPlan}.`);
      router.back();
    } catch (error) {
      console.error('Subscribe failed:', error);
      Alert.alert('Error', 'Failed to process the purchase.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      const info = await restorePurchases();
      if (!info) {
        Alert.alert('Restore unavailable', 'Could not restore purchases right now.');
        return;
      }

      const plan = derivePaidPlanFromCustomerInfo(info);
      if (!plan) {
        Alert.alert('No purchases found', 'No active purchases were found to restore.');
        return;
      }

      applyPaidEntitlementLocally(plan);
      Alert.alert('Restored', `Restored ${plan} entitlement.`);
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const entitlement = deriveEntitlementState(user);
  const selectedPlanPrice = selectedPlanConfig?.displayPrice || '$0';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('pricing.title')}</Text>
        <Text style={styles.subtitle}>{t('pricing.subtitle')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.plansContainer}>
          {BILLING_PLANS.map(plan => (
            <View 
              key={plan.id} 
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular
              ]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>{t('pricing.most_popular')}</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.planPrice}>
                  <Text style={styles.price}>{plan.displayPrice}</Text>
                  <Text style={styles.period}>{plan.period}</Text>
                </View>
              </View>

              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {plan.limitations && (
                <View style={styles.limitationsList}>
                  {plan.limitations.map((limitation, index) => (
                    <View key={index} style={styles.limitationItem}>
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                      <Text style={styles.limitationText}>{limitation}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  selectedPlan === plan.id && styles.selectButtonSelected,
                  { borderColor: plan.color }
                ]}
                onPress={() => handleSelectPlan(plan.id)}
              >
                <Text style={[
                  styles.selectButtonText,
                  selectedPlan === plan.id && styles.selectButtonTextSelected
                ]}>
                  {selectedPlan === plan.id ? t('pricing.selected') : t('pricing.select')}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.couponContainer}>
          <Text style={styles.couponTitle}>Coupon</Text>
          <View style={styles.couponInputRow}>
            <TextInput
              style={styles.couponInput}
              placeholder="Enter coupon code"
              placeholderTextColor="#9CA3AF"
              value={couponCode}
              autoCapitalize="characters"
              onChangeText={setCouponCode}
            />
            <TouchableOpacity style={styles.couponButton} onPress={handleApplyCoupon}>
              <Text style={styles.couponButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {!!couponMessage && (
            <Text style={[styles.couponMessage, isCouponValid ? styles.couponValid : styles.couponInvalid]}>
              {couponMessage}
            </Text>
          )}
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Current entitlement: {entitlement?.tier || 'unknown'}
          </Text>
          <Text style={styles.statusText}>Selected plan: {selectedPlan} ({selectedPlanPrice})</Text>
          {!isInitialized && (
            <Text style={styles.statusWarning}>
              RevenueCat is not initialized (likely missing keys or running in Expo Go/web).
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.subscribeButton, isProcessing && styles.disabledButton]}
            onPress={handleSubscribe}
            disabled={isProcessing}
          >
            <Text style={styles.subscribeButtonText}>
              {isProcessing ? 'Processing...' : t('pricing.subscribe_now')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.restoreButton, isProcessing && styles.disabledButton]}
            onPress={handleRestore}
            disabled={isProcessing}
          >
            <Text style={styles.restoreButtonText}>Restore purchases</Text>
          </TouchableOpacity>
          
          <Text style={styles.termsText}>
            {t('pricing.terms_text')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 20,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  planCardPopular: {
    borderColor: '#2563EB',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  planPrice: {
    alignItems: 'center',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  period: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  featuresList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
  limitationsList: {
    marginBottom: 16,
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitationText: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 8,
  },
  selectButton: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  selectButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButtonTextSelected: {
    color: 'white',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  subscribeButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
  couponContainer: {
    marginTop: 20,
    padding: 14,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  couponTitle: {
    color: 'white',
    fontWeight: '600',
    marginBottom: 10,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: 'white',
    backgroundColor: '#111827',
  },
  couponButton: {
    backgroundColor: '#2563EB',
    borderRadius: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  couponButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  couponMessage: {
    marginTop: 10,
    fontSize: 13,
  },
  couponValid: {
    color: '#10B981',
  },
  couponInvalid: {
    color: '#F87171',
  },
  statusContainer: {
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  statusText: {
    color: '#D1D5DB',
    fontSize: 12,
    marginBottom: 4,
  },
  statusWarning: {
    color: '#F59E0B',
    fontSize: 12,
  },
  restoreButton: {
    marginTop: 10,
    borderColor: '#6B7280',
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  restoreButtonText: {
    color: '#D1D5DB',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
}); 