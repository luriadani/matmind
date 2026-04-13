import { supabase } from '@/lib/supabase';
import { BillingPlanId } from '@/constants/billing';

export type CouponRow = {
  code: string;
  discount_percent: number;
  applies_to: string[];
  active: boolean;
  description: string | null;
  expires_at: string | null;
  max_redemptions: number | null;
};

export type CouponValidationResult =
  | { isValid: true; coupon: CouponRow; discountedPrice: number }
  | { isValid: false; reason: string };

// ── Supabase CRUD ─────────────────────────────────────────────────────────────

export const fetchCoupons = async (): Promise<CouponRow[]> => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('code');
  if (error) throw error;
  return data ?? [];
};

export const toggleCoupon = async (code: string, active: boolean): Promise<void> => {
  const { error } = await supabase
    .from('coupons')
    .update({ active })
    .eq('code', code);
  if (error) throw error;
};

export const deleteCoupon = async (code: string): Promise<void> => {
  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('code', code);
  if (error) throw error;
};

export const createCoupon = async (coupon: Omit<CouponRow, 'expires_at' | 'max_redemptions'> & { expires_at?: string; max_redemptions?: number }): Promise<void> => {
  const { error } = await supabase
    .from('coupons')
    .insert(coupon);
  if (error) throw error;
};

// ── Validation ────────────────────────────────────────────────────────────────

export const validateCoupon = (
  code: string,
  planId: BillingPlanId,
  basePrice: number,
  coupons: CouponRow[]
): CouponValidationResult => {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { isValid: false, reason: 'Coupon code is empty.' };

  const coupon = coupons.find((c) => c.code === normalized);
  if (!coupon) return { isValid: false, reason: 'Coupon code is invalid.' };
  if (!coupon.active) return { isValid: false, reason: 'Coupon is inactive.' };

  if (coupon.expires_at) {
    const exp = new Date(coupon.expires_at);
    if (!isNaN(exp.getTime()) && exp.getTime() <= Date.now()) {
      return { isValid: false, reason: 'Coupon has expired.' };
    }
  }

  if (!coupon.applies_to.includes(planId)) {
    return { isValid: false, reason: 'Coupon does not apply to this plan.' };
  }

  const discountedPrice = Number(
    (basePrice * (1 - coupon.discount_percent / 100)).toFixed(2)
  );
  return { isValid: true, coupon, discountedPrice };
};
