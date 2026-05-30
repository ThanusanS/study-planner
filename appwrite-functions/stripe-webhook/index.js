const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sdk = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // stripe verifyHeader requires the raw request body string
    event = stripe.webhooks.constructEvent(req.bodyString || req.body, sig, endpointSecret);
  } catch (err) {
    error(`Webhook signature verification failed: ${err.message}`);
    return res.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, plan, cycle } = session.metadata;

    log(`Fulfilling subscription for userId ${userId}, plan ${plan}, cycle ${cycle}`);

    // Initialize Appwrite Server SDK
    const client = new sdk.Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new sdk.Databases(client);
    const databaseId = process.env.DATABASE_ID || 'studyplan';
    const userPlansColId = process.env.USER_PLANS_COLLECTION_ID || 'userPlans';
    const billingHistoryColId = process.env.BILLING_HISTORY_COLLECTION_ID || 'billingHistory';

    // 1. Fetch current plan to update or create
    let planDoc;
    try {
      const response = await databases.listDocuments(databaseId, userPlansColId, [
        sdk.Query.equal('userId', userId)
      ]);
      if (response.documents.length > 0) {
        planDoc = response.documents[0];
      }
    } catch (err) {
      error(`Error listing plan document: ${err.message}`);
    }

    const limits = { pro: 500, premium: 3000 };
    const maxCredits = limits[plan] || 10;

    const renewalDate = new Date();
    if (cycle === 'monthly') {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    } else {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    }

    const updatedData = {
      plan,
      status: 'active',
      aiCredits: maxCredits,
      maxCredits: maxCredits,
      renewalDate: renewalDate.toISOString(),
      billingCycle: cycle
    };

    try {
      if (planDoc) {
        await databases.updateDocument(databaseId, userPlansColId, planDoc.$id, updatedData);
        log(`Successfully updated existing plan for user ${userId}`);
      } else {
        await databases.createDocument(databaseId, userPlansColId, sdk.ID.unique(), {
          userId,
          ...updatedData
        });
        log(`Successfully created new plan for user ${userId}`);
      }

      // 2. Generate billing invoice record
      const amountMap = {
        pro: { monthly: 'LKR 1,500', yearly: 'LKR 12,000' },
        premium: { monthly: 'LKR 2,500', yearly: 'LKR 20,000' }
      };
      const amount = amountMap[plan][cycle] || 'LKR 0';
      const planDisplayName = plan === 'pro' ? 'Scholar Pro' : 'Elite Premium';

      await databases.createDocument(databaseId, billingHistoryColId, sdk.ID.unique(), {
        invoiceId: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        userId,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        amount,
        planName: planDisplayName,
        cycle: cycle === 'monthly' ? 'Monthly' : 'Yearly'
      });
      log(`Successfully logged invoice receipt for user ${userId}`);

    } catch (err) {
      error(`Error saving plan/invoice to database: ${err.message}`);
      return res.json({ error: err.message }, 500);
    }
  }

  return res.json({ received: true });
};
