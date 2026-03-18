import AsyncStorage from '@react-native-async-storage/async-storage';
import { BILLING_COUPONS, BillingPlanId, CouponDefinition } from '@/constants/billing';

const COUPON_AUDIT_KEY = 'billing_coupon_audit_v1';

type CouponAuditEvent = {
  code: string;
  planId: BillingPlanId;
  userId?: string;
  email?: string;
  success: boolean;
  reason?: string;
  at: string;
};

type CouponValidationResult =
  | { isValid: true; coupon: CouponDefinition; discountedPrice: number }
  | { isValid: false; reason: string };

const normalizeCode = (code: string): string => code.trim().toUpperCase();

const isExpired = (expiresAt?: string): boolean => {
  if (!expiresAt) return false;
  const expiresDate = new Date(expiresAt);
  if (Number.isNaN(expiresDate.getTime())) return false;
  return expiresDate.getTime() <= Date.now();
};

export const validateCoupon = (
  code: string,
  planId: BillingPlanId,
  basePrice: number
): CouponValidationResult => {
  const couponCode = normalizeCode(code);
  if (!couponCode) {
    return { isValid: false, reason: 'Coupon code is empty.' };
  }

  const coupon = BILLING_COUPONS.find((item) => item.code === couponCode);
  if (!coupon) {
    return { isValid: false, reason: 'Coupon code is invalid.' };
  }

  if (!coupon.active) {
    return { isValid: false, reason: 'Coupon is inactive.' };
  }

  if (isExpired(coupon.expiresAt)) {
    return { isValid: false, reason: 'Coupon has expired.' };
  }

  if (!coupon.appliesTo.includes(planId)) {
    return { isValid: false, reason: 'Coupon does not apply to this plan.' };
  }

  const discountedPrice = Number((basePrice * (1 - coupon.discountPercent / 100)).toFixed(2));
  return { isValid: true, coupon, discountedPrice };
};

const readAuditEvents = async (): Promise<CouponAuditEvent[]> => {
  try {
    const raw = await AsyncStorage.getItem(COUPON_AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to read coupon audit trail:', error);
    return [];
  }
};

export const trackCouponAttempt = async (event: CouponAuditEvent): Promise<void> => {
  try {
    const current = await readAuditEvents();
    current.push(event);
    await AsyncStorage.setItem(COUPON_AUDIT_KEY, JSON.stringify(current.slice(-200)));
  } catch (error) {
    console.error('Failed to write coupon audit trail:', error);
  }
};
