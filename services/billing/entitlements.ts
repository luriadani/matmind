import { BILLING_CONFIG, BILLING_PLAN_IDS, BillingTier, ENTITLEMENT_TIER_RANK } from '@/constants/billing';

export type AppUser = {
  id?: string;
  email?: string;
  role?: string;
  created_date?: string;
  trial_start_date?: string;
  subscription_status?: string | null;
  subscription_level?: string | null;
  subscription_plan?: string | null;
  subscription_expiry_date?: string | null;
  payment_method?: string | null;
  coupon_code?: string | null;
  [key: string]: any;
};

export type EntitlementState = {
  tier: BillingTier;
  level: 'free' | 'premium' | 'admin';
  isActive: boolean;
  isTrialActive: boolean;
  planId: 'free' | 'yearly' | 'lifetime';
  trialEndsAt: string | null;
  expiresAt: string | null;
  freeTechniqueLimit: number;
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const getValidDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getTrialStartDate = (user: AppUser): Date | null =>
  getValidDate(user.trial_start_date) || getValidDate(user.created_date);

export const getTrialEndsAt = (user: AppUser): Date | null => {
  const trialStart = getTrialStartDate(user);
  if (!trialStart) return null;
  return new Date(trialStart.getTime() + BILLING_CONFIG.trialDays * MILLISECONDS_PER_DAY);
};

export const isTrialActiveForUser = (user: AppUser, now: Date = new Date()): boolean => {
  const endsAt = getTrialEndsAt(user);
  return !!endsAt && endsAt.getTime() > now.getTime();
};

const isPaidLifetime = (user: AppUser): boolean =>
  user.subscription_status === 'lifetime' || user.subscription_plan === BILLING_PLAN_IDS.lifetime;

const isPaidYearly = (user: AppUser, now: Date = new Date()): boolean => {
  if (user.subscription_plan === BILLING_PLAN_IDS.yearly && user.subscription_status === 'active') {
    return true;
  }

  const isStatusPaid = user.subscription_status === 'active' || user.subscription_status === 'yearly';
  if (!isStatusPaid) return false;

  const expiry = getValidDate(user.subscription_expiry_date);
  if (!expiry) return true;
  return expiry.getTime() > now.getTime();
};

export const deriveEntitlementState = (user: AppUser | null, now: Date = new Date()): EntitlementState | null => {
  if (!user) return null;

  const debugOverride = (BILLING_CONFIG.debugEntitlementOverride || '').trim() as BillingTier;
  if (debugOverride && ENTITLEMENT_TIER_RANK[debugOverride] !== undefined) {
    const isPaid = debugOverride === 'paid_yearly' || debugOverride === 'paid_lifetime' || debugOverride === 'admin';
    return {
      tier: debugOverride,
      level: debugOverride === 'admin' ? 'admin' : isPaid ? 'premium' : 'free',
      isActive: true,
      isTrialActive: debugOverride === 'trial_active',
      planId:
        debugOverride === 'paid_lifetime'
          ? BILLING_PLAN_IDS.lifetime
          : debugOverride === 'paid_yearly'
          ? BILLING_PLAN_IDS.yearly
          : BILLING_PLAN_IDS.free,
      trialEndsAt: null,
      expiresAt: null,
      freeTechniqueLimit: BILLING_CONFIG.freeTechniqueLimit,
    };
  }

  if (user.role === 'admin') {
    return {
      tier: 'admin',
      level: 'admin',
      isActive: true,
      isTrialActive: false,
      planId: BILLING_PLAN_IDS.lifetime,
      trialEndsAt: null,
      expiresAt: null,
      freeTechniqueLimit: BILLING_CONFIG.freeTechniqueLimit,
    };
  }

  const trialActive = isTrialActiveForUser(user, now);
  const trialEndsAt = getTrialEndsAt(user);

  if (isPaidLifetime(user)) {
    return {
      tier: 'paid_lifetime',
      level: 'premium',
      isActive: true,
      isTrialActive: false,
      planId: BILLING_PLAN_IDS.lifetime,
      trialEndsAt: trialEndsAt?.toISOString() || null,
      expiresAt: null,
      freeTechniqueLimit: BILLING_CONFIG.freeTechniqueLimit,
    };
  }

  if (isPaidYearly(user, now)) {
    return {
      tier: 'paid_yearly',
      level: 'premium',
      isActive: true,
      isTrialActive: false,
      planId: BILLING_PLAN_IDS.yearly,
      trialEndsAt: trialEndsAt?.toISOString() || null,
      expiresAt: user.subscription_expiry_date || null,
      freeTechniqueLimit: BILLING_CONFIG.freeTechniqueLimit,
    };
  }

  if (trialActive) {
    return {
      tier: 'trial_active',
      level: 'premium',
      isActive: true,
      isTrialActive: true,
      planId: BILLING_PLAN_IDS.free,
      trialEndsAt: trialEndsAt?.toISOString() || null,
      expiresAt: trialEndsAt?.toISOString() || null,
      freeTechniqueLimit: BILLING_CONFIG.freeTechniqueLimit,
    };
  }

  return {
    tier: 'free_limited',
    level: 'free',
    isActive: true,
    isTrialActive: false,
    planId: BILLING_PLAN_IDS.free,
    trialEndsAt: trialEndsAt?.toISOString() || null,
    expiresAt: null,
    freeTechniqueLimit: BILLING_CONFIG.freeTechniqueLimit,
  };
};

export const hasTierAccess = (current: BillingTier, required: BillingTier): boolean =>
  ENTITLEMENT_TIER_RANK[current] >= ENTITLEMENT_TIER_RANK[required];

export const migrateLegacySubscriptionFields = (user: AppUser): AppUser => {
  const normalized = { ...user };
  const state = deriveEntitlementState(normalized);
  if (!state) return normalized;

  normalized.subscription_level = state.level;

  if (state.tier === 'paid_lifetime') {
    normalized.subscription_status = 'lifetime';
    normalized.subscription_plan = BILLING_PLAN_IDS.lifetime;
  } else if (state.tier === 'paid_yearly') {
    normalized.subscription_status = 'active';
    normalized.subscription_plan = BILLING_PLAN_IDS.yearly;
  } else if (state.tier === 'trial_active') {
    normalized.subscription_status = 'trial';
    normalized.subscription_plan = BILLING_PLAN_IDS.free;
  } else if (state.tier === 'free_limited') {
    normalized.subscription_status = 'expired';
    normalized.subscription_plan = BILLING_PLAN_IDS.free;
  }

  return normalized;
};

export const canCreateTechnique = (state: EntitlementState | null, ownTechniqueCount: number): boolean => {
  if (!state) return false;
  if (state.level === 'admin' || state.level === 'premium') return true;
  return ownTechniqueCount < state.freeTechniqueLimit;
};
