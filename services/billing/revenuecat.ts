import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, LOG_LEVEL, PurchasesOffering, PurchasesStoreProduct } from 'react-native-purchases';
import { BILLING_PLAN_IDS, BillingPlanId, REVENUECAT_ENTITLEMENTS, REVENUECAT_PRODUCT_IDS } from '@/constants/billing';

const isExpoGo = Constants.appOwnership === 'expo';
let initialized = false;

const getApiKey = (): string | null => {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || null;
  }
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || null;
  }
  return null;
};

export const initializeRevenueCat = async (appUserId?: string): Promise<boolean> => {
  if (initialized || isExpoGo || Platform.OS === 'web') return false;

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('RevenueCat key missing. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY/ANDROID_API_KEY.');
    return false;
  }

  try {
    Purchases.setLogLevel(LOG_LEVEL.WARN);
    await Purchases.configure({ apiKey, appUserID: appUserId });
    initialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    return false;
  }
};

export const setRevenueCatUser = async (appUserId: string): Promise<void> => {
  if (!initialized || !appUserId) return;
  try {
    await Purchases.logIn(appUserId);
  } catch (error) {
    console.error('Failed to set RevenueCat user:', error);
  }
};

export const getCurrentOffering = async (): Promise<PurchasesOffering | null> => {
  if (!initialized) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current || null;
  } catch (error) {
    console.error('Failed to load RevenueCat offerings:', error);
    return null;
  }
};

export const findStoreProductForPlan = (
  offering: PurchasesOffering | null,
  planId: BillingPlanId
): PurchasesStoreProduct | null => {
  if (!offering) return null;
  const targetProductId =
    planId === BILLING_PLAN_IDS.yearly ? REVENUECAT_PRODUCT_IDS.yearly : REVENUECAT_PRODUCT_IDS.lifetime;
  return offering.availablePackages.find((pkg) => pkg.product.identifier === targetProductId)?.product || null;
};

export const purchasePlanProduct = async (product: PurchasesStoreProduct): Promise<CustomerInfo | null> => {
  if (!initialized) return null;
  try {
    const result = await Purchases.purchaseStoreProduct(product);
    return result.customerInfo;
  } catch (error) {
    console.error('Failed to complete purchase:', error);
    return null;
  }
};

export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  if (!initialized) return null;
  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return null;
  }
};

export const derivePaidPlanFromCustomerInfo = (customerInfo: CustomerInfo): BillingPlanId | null => {
  if (customerInfo.entitlements.active[REVENUECAT_ENTITLEMENTS.lifetime]) {
    return BILLING_PLAN_IDS.lifetime;
  }
  if (customerInfo.entitlements.active[REVENUECAT_ENTITLEMENTS.premium]) {
    return BILLING_PLAN_IDS.yearly;
  }
  return null;
};
