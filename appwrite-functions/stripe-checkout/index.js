const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async ({ req, res, log, error }) => {
  if (req.method !== 'POST') {
    return res.json({ error: 'Method not allowed' }, 405);
  }

  try {
    const { userId, plan, cycle } = JSON.parse(req.body);

    if (!userId || !plan || !cycle) {
      return res.json({ error: 'Missing required parameters' }, 400);
    }

    // Map plan and cycle to Stripe Price IDs configured in environment variables
    let priceId = '';
    if (plan === 'pro') {
      priceId = cycle === 'monthly' ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID : process.env.STRIPE_PRO_YEARLY_PRICE_ID;
    } else if (plan === 'premium') {
      priceId = cycle === 'monthly' ? process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID : process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID;
    }

    if (!priceId) {
      return res.json({ error: `Price ID not configured for plan ${plan} and cycle ${cycle}. Make sure STRIPE_PRO_MONTHLY_PRICE_ID etc. are set in function settings.` }, 400);
    }

    log(`Creating checkout session for user ${userId}, plan ${plan}, cycle ${cycle}`);

    // Success and cancel redirect URLs back to frontend
    const successUrl = `${process.env.APP_URL}/billing?session=success`;
    const cancelUrl = `${process.env.APP_URL}/billing?session=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        plan,
        cycle
      }
    });

    return res.json({ url: session.url });
  } catch (err) {
    error(`Stripe Session Creation Error: ${err.message}`);
    return res.json({ error: err.message }, 500);
  }
};
