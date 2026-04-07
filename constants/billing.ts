export const BILLING_CONFIG = {
  trialDays: 14,
  freeTechniqueLimit: 2,
  currency: 'USD',
  debugEntitlementOverride: process.env.EXPO_PUBLIC_BILLING_DEBUG_STATE || '',
} as const;

export const BILLING_PLAN_IDS = {
  free: 'free',
  yearly: 'yearly',
  lifetime: 'lifetime',
} as const;

export type BillingPlanId = (typeof BILLING_PLAN_IDS)[keyof typeof BILLING_PLAN_IDS];

export const REVENUECAT_ENTITLEMENTS = {
  premium: 'premium',
  lifetime: 'lifetime',
} as const;

export const REVENUECAT_PRODUCT_IDS = {
  yearly: 'matmind_yearly',
  lifetime: 'matmind_lifetime',
} as const;

// Stripe price IDs — fill in after creating products in Stripe dashboard
export const STRIPE_PRICE_IDS = {
  yearly: process.env.EXPO_PUBLIC_STRIPE_YEARLY_PRICE_ID || '',
  lifetime: process.env.EXPO_PUBLIC_STRIPE_LIFETIME_PRICE_ID || '',
} as const;

export type CouponDefinition = {
  code: string;
  discountPercent: number;
  appliesTo: BillingPlanId[];
  active: boolean;
  expiresAt?: string;
  maxRedemptions?: number;
};

export type BillingPlanConfig = {
  id: BillingPlanId;
  name: string;
  basePrice: number;
  displayPrice: string;
  period: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
  color: string;
};

export const BILLING_PLANS: BillingPlanConfig[] = [
  {
    id: BILLING_PLAN_IDS.free,
    name: 'Free',
    basePrice: 0,
    displayPrice: '$0',
    period: 'forever',
    features: [
      `Up to ${BILLING_CONFIG.freeTechniqueLimit} techniques`,
      'Basic training schedule',
      'Hebrew & English support',
      'Basic notifications',
    ],
    limitations: [
      'Technique creation is limited after trial',
      'No premium-only upgrades',
      'No gym sharing',
    ],
    color: '#6B7280',
  },
  {
    id: BILLING_PLAN_IDS.yearly,
    name: 'Yearly',
    basePrice: 4.99,
    displayPrice: '$4.99',
    period: 'per year',
    features: [
      'Unlimited techniques',
      'Advanced training schedule',
      'Custom categories',
      'Gym sharing',
      'Advanced notifications',
      'Priority support',
    ],
    popular: true,
    color: '#2563EB',
  },
  {
    id: BILLING_PLAN_IDS.lifetime,
    name: 'Lifetime',
    basePrice: 11.99,
    displayPrice: '$11.99',
    period: 'one-time',
    features: [
      'Everything in Yearly',
      'Lifetime access',
      'Future updates included',
      'Premium support',
      'Early access to features',
    ],
    color: '#DC2626',
  },
];

export const BILLING_COUPONS: CouponDefinition[] = [
  {
    code: 'WELCOME10',
    discountPercent: 10,
    appliesTo: [BILLING_PLAN_IDS.yearly, BILLING_PLAN_IDS.lifetime],
    active: true,
  },
  {
    code: 'YEARLY20',
    discountPercent: 20,
    appliesTo: [BILLING_PLAN_IDS.yearly],
    active: true,
  },
  {
    code: 'LIFETIME15',
    discountPercent: 15,
    appliesTo: [BILLING_PLAN_IDS.lifetime],
    active: true,
  },
];

export type BillingTier = 'trial_active' | 'free_limited' | 'paid_yearly' | 'paid_lifetime' | 'admin';

export const ENTITLEMENT_TIER_RANK: Record<BillingTier, number> = {
  free_limited: 0,
  trial_active: 1,
  paid_yearly: 2,
  paid_lifetime: 3,
  admin: 4,
};
