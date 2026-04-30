// ═══════════════════════════════════════════════════════════════════
// VAANI Subscriptions Route — Layer 9
// Razorpay integration for ₹99/month premium tier
// ═══════════════════════════════════════════════════════════════════

import express from 'express';

const router = express.Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// ─── Check User Subscription Status ────────────────────────────────
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const isPremium = sub?.status === 'active' && new Date(sub.valid_until) > new Date();
    
    res.json({
      plan: isPremium ? 'premium' : 'free',
      status: sub?.status || 'none',
      validUntil: sub?.valid_until || null,
      razorpayCustomerId: sub?.razorpay_customer_id || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Create Razorpay Customer & Get Subscription Link ──────────────
router.post('/create-session/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .single();
    
    if (!profile?.email) {
      return res.status(400).json({ error: 'User email not found' });
    }
    
    // Check if customer already exists
    let { data: existingSub } = await supabase
      .from('subscriptions')
      .select('razorpay_customer_id')
      .eq('user_id', userId)
      .single();
    
    let customerId = existingSub?.razorpay_customer_id;
    
    if (!customerId) {
      // Create Razorpay customer
      const customerRes = await fetch('https://api.razorpay.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name || 'VAANI User',
          email: profile.email,
          description: 'VAANI Premium Subscription',
        }),
      });
      
      if (!customerRes.ok) throw new Error('Razorpay customer creation failed');
      const customer = await customerRes.json();
      customerId = customer.id;
      
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan: 'free',
        status: 'pending',
        razorpay_customer_id: customerId,
      }, { onConflict: 'user_id' });
    }
    
    // Create subscription with ₹99/month plan
    // Note: In production, create plan_id in Razorpay dashboard first
    const subscriptionRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: customerId,
        plan_id: 'plan_premium_monthly', // Create this in Razorpay dashboard
        quantity: 1,
        total_count: 12, // 12 months
        description: 'VAANI Premium ₹99/month',
      }),
    });
    
    if (!subscriptionRes.ok) {
      const err = await subscriptionRes.text();
      // If plan doesn't exist, create subscription link manually
      return res.json({
        checkoutUrl: `https://rzp.io/i/premium`, // Manual checkout fallback
        customerId,
      });
    }
    
    const subscription = await subscriptionRes.json();
    
    // Store subscription ID
    await supabase.from('subscriptions').update({
      razorpay_subscription_id: subscription.id,
    }).eq('user_id', userId);
    
    res.json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
    });
  } catch (err) {
    console.error('[Subscriptions] Create session error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Razorpay Webhook Handler ───────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const crypto = await import('crypto');
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify webhook signature
    const expectedSignature = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    const event = JSON.parse(req.body);
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    switch (event.event) {
      case 'subscription.activated': {
        const sub = event.payload.subscription.entity;
        await supabase.from('subscriptions').update({
          status: 'active',
          valid_until: new Date(sub.current_end * 1000).toISOString(),
        }).eq('razorpay_subscription_id', sub.id);
        break;
      }
      
      case 'subscription.cancelled': {
        const sub = event.payload.subscription.entity;
        await supabase.from('subscriptions').update({
          status: 'cancelled',
        }).eq('razorpay_subscription_id', sub.id);
        break;
      }
      
      case 'subscription.paused': {
        const sub = event.payload.subscription.entity;
        await supabase.from('subscriptions').update({
          status: 'past_due',
        }).eq('razorpay_subscription_id', sub.id);
        break;
      }
    }
    
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[Subscriptions] Webhook error:', err);
    res.status(500).json({ received: true });
  }
});

// ─── Rate Limit Check ───────────────────────────────────────────────
router.get('/limits/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Check subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const isPremium = sub?.status === 'active' && new Date(sub.valid_until) > new Date();
    
    // Count today's usage
    const today = new Date().toISOString().split('T')[0];
    const { count: todayMessages } = await supabase
      .from('api_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id_hash', Buffer.from(userId).toString('base64').slice(0, 20))
      .gte('created_at', today);
    
    const freeLimits = {
      dailyMessages: 20,
      dailyVoice: 5,
      features: ['basic_dashboard', 'chat'],
    };
    
    const premiumLimits = {
      dailyMessages: Infinity,
      dailyVoice: Infinity,
      features: ['full_dashboard', 'tax_engine', 'freelancer_os', 'credit_intelligence', 'vaani_score', 'fd_alerts'],
    };
    
    const limits = isPremium ? premiumLimits : freeLimits;
    
    res.json({
      plan: isPremium ? 'premium' : 'free',
      usage: {
        messagesToday: todayMessages || 0,
        messagesLimit: limits.dailyMessages,
      },
      canChat: isPremium || (todayMessages || 0) < limits.dailyMessages,
      features: limits.features,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;