// Vercel Serverless Function
// GET /api/verify-session?session_id=xxx
// Returns: { planId, status, email }

const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const paid =
      session.payment_status === 'paid' ||
      (session.mode === 'subscription' && session.status === 'complete');

    if (!paid) {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    return res.status(200).json({
      planId: session.metadata?.planId || 'yearly',
      email: session.customer_details?.email || null,
      status: 'paid',
    });
  } catch (err) {
    console.error('Stripe verify error:', err);
    return res.status(500).json({ error: err.message });
  }
};
