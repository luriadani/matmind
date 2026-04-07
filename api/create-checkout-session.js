// Vercel Serverless Function
// POST /api/create-checkout-session
// Body: { planId: 'yearly' | 'lifetime', successUrl: string, cancelUrl: string }

const Stripe = require('stripe');

const PRICE_IDS = {
  yearly: process.env.STRIPE_YEARLY_PRICE_ID,
  lifetime: process.env.STRIPE_LIFETIME_PRICE_ID,
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const { planId, successUrl, cancelUrl } = req.body;

  if (!planId || !PRICE_IDS[planId]) {
    return res.status(400).json({ error: 'Invalid plan ID' });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

  try {
    const isLifetime = planId === 'lifetime';

    const session = await stripe.checkout.sessions.create({
      mode: isLifetime ? 'payment' : 'subscription',
      line_items: [{ price: PRICE_IDS[planId], quantity: 1 }],
      success_url: successUrl || `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: cancelUrl || `${req.headers.origin}/pricing`,
      metadata: { planId },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
};
