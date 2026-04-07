import { Platform } from 'react-native';
import { BillingPlanId, BILLING_PLAN_IDS } from '@/constants/billing';

const isWeb = Platform.OS === 'web';

/**
 * Start a Stripe Checkout session for web.
 * Calls our Vercel serverless function, then redirects to Stripe's hosted page.
 */
export const startStripeCheckout = async (planId: BillingPlanId): Promise<void> => {
  if (!isWeb) throw new Error('Stripe checkout is web-only');

  const origin = window.location.origin;

  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId,
      successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancelUrl: `${origin}/pricing`,
    }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || 'Failed to create checkout session');
  }

  const { url } = await res.json();
  window.location.href = url;
};

/**
 * Verify a completed Stripe session.
 * Called from the payment-success screen after Stripe redirects back.
 */
export const verifyStripeSession = async (
  sessionId: string
): Promise<{ planId: BillingPlanId; email: string | null }> => {
  const res = await fetch(`/api/verify-session?session_id=${sessionId}`);

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || 'Payment verification failed');
  }

  const data = await res.json();
  return { planId: data.planId as BillingPlanId, email: data.email };
};

export const isStripeAvailable = (): boolean => {
  if (!isWeb) return false;
  const key = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return !!key;
};
