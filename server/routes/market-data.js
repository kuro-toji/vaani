// ═══════════════════════════════════════════════════════════════════
// VAANI Market Data Route — Layer 1
// Server-side market data pipeline with cron job support
// ═══════════════════════════════════════════════════════════════════

import express from 'express';

const router = express.Router();

// Hardcoded Supabase credentials (same as frontend)
const SUPABASE_URL = 'https://dqdievbkvakaptxhzxft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZGlldmJrdmFrYXB0eGh6eGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDQxNjMsImV4cCI6MjA5MzAyMDE2M30.J-bBpt8Dy9QQoXlWufDo95uT7kmdMwOca_pg7saDKLI';

// ─── Supabase Helper ──────────────────────────────────────────────
async function supabase() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ─── FD Rates from Database (LIVE from Supabase) ──────────────────
router.get('/fd-rates', async (req, res) => {
  try {
    const client = await supabase();
    const { tenure } = req.query; // tenure like "1 Year"
    
    let query = client.from('fd_rates').select('*').order('display_rate', { ascending: false });
    
    if (tenure) {
      query = query.eq('tenure_label', tenure);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({
      rates: data || [],
      count: data?.length || 0,
      last_updated: data?.[0]?.updated_at,
      source: 'live_supabase',
      api: 'AMFI/FD Rates API',
    });
  } catch (err) {
    console.error('[MarketData] FD rates error:', err);
    res.status(500).json({ error: 'Failed to fetch FD rates' });
  }
});

// ─── MF NAV from Cache ─────────────────────────────────────────────
router.get('/mf-nav', async (req, res) => {
  try {
    const client = await supabase();
    const { scheme_code } = req.query;
    
    let query = client.from('mf_nav_cache').select('*').order('nav_date', { ascending: false });
    
    if (scheme_code) {
      query = query.eq('scheme_code', parseInt(scheme_code));
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Get cache metadata
    const { data: meta } = await client
      .from('market_cache_metadata')
      .select('*')
      .eq('cache_type', 'mf_nav')
      .single();
    
    res.json({
      navs: data || [],
      count: data?.length || 0,
      cache_timestamp: meta?.last_updated,
      source: 'cache',
    });
  } catch (err) {
    console.error('[MarketData] MF NAV error:', err);
    res.status(500).json({ error: 'Failed to fetch NAV data' });
  }
});

// ─── Crypto Prices with 3-Layer Fallback ───────────────────────────
router.get('/crypto-prices', async (req, res) => {
  try {
    const client = await supabase();
    const { symbols } = req.query;
    
    // Layer 1: Try Binance
    let prices = await fetchFromBinance(symbols);
    
    if (!prices || Object.keys(prices).length === 0) {
      // Layer 2: CoinGecko fallback
      console.log('[MarketData] Binance failed, trying CoinGecko...');
      prices = await fetchFromCoinGecko(symbols);
    }
    
    if (!prices || Object.keys(prices).length === 0) {
      // Layer 3: Last known price from cache
      console.log('[MarketData] CoinGecko also failed, using cached prices...');
      const { data } = await client.from('crypto_price_cache').select('*');
      prices = {};
      for (const row of (data || [])) {
        prices[row.symbol] = row;
      }
    }
    
    // Update cache
    for (const [symbol, priceData] of Object.entries(prices)) {
      if (priceData?.price_usd) {
        await client.from('crypto_price_cache').upsert({
          symbol,
          base_asset: symbol.replace('USDT', ''),
          price_usd: priceData.price_usd,
          price_inr: priceData.price_inr,
          change_24h: priceData.change_24h || 0,
          source: priceData.source || 'binance',
          last_updated: new Date().toISOString(),
        }, { onConflict: 'symbol' });
      }
    }
    
    res.json({
      prices,
      source: prices?.BTC ? prices.BTC.source : 'cached',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[MarketData] Crypto prices error:', err);
    res.status(500).json({ error: 'Failed to fetch crypto prices' });
  }
});

// ─── Binance API Call ──────────────────────────────────────────────
async function fetchFromBinance(symbols) {
  const BINANCE_API = 'https://api.binance.com/api/v3';
  const usdToInr = await getUSDToINR();
  
  const result = {};
  const symbolList = symbols ? symbols.split(',') : ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
  
  for (const symbol of symbolList) {
    try {
      const response = await fetch(`${BINANCE_API}/ticker/24hr?symbol=${symbol}`);
      if (response.ok) {
        const data = await response.json();
        result[symbol] = {
          price_usd: parseFloat(data.lastPrice),
          price_inr: parseFloat(data.lastPrice) * usdToInr,
          change_24h: parseFloat(data.priceChangePercent),
          source: 'binance',
        };
      }
    } catch (e) {
      console.warn(`[MarketData] Binance failed for ${symbol}:`, e.message);
    }
  }
  
  return result;
}

// ─── CoinGecko Fallback ─────────────────────────────────────────────
async function fetchFromCoinGecko(symbols) {
  const symbolMap = {
    BTCUSDT: 'bitcoin',
    ETHUSDT: 'ethereum',
    BNBUSDT: 'binancecoin',
    XRPUSDT: 'ripple',
    ADAUSDT: 'cardano',
    SOLUSDT: 'solana',
    DOGEUSDT: 'dogecoin',
    LTCUSDT: 'litecoin',
    DOTUSDT: 'polkadot',
    MATICUSDT: 'matic-network',
  };
  
  const result = {};
  const symbolList = symbols ? symbols.split(',') : ['BTCUSDT', 'ETHUSDT'];
  const ids = symbolList.map(s => symbolMap[s]).filter(Boolean).join(',');
  
  if (!ids) return result;
  
  try {
    const usdToInr = await getUSDToINR();
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
    
    if (response.ok) {
      const data = await response.json();
      
      for (const [symbol, cgId] of Object.entries(symbolMap)) {
        if (data[cgId]) {
          result[symbol] = {
            price_usd: data[cgId].usd,
            price_inr: data[cgId].usd * usdToInr,
            change_24h: data[cgId].usd_24h_change,
            source: 'coingecko',
          };
        }
      }
    }
  } catch (e) {
    console.warn('[MarketData] CoinGecko fallback failed:', e.message);
  }
  
  return result;
}

// ─── USD to INR Rate ────────────────────────────────────────────────
let cachedINRRate = 83.5;
let inrRateCacheTime = 0;
const INR_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function getUSDToINR() {
  const now = Date.now();
  
  if (now - inrRateCacheTime < INR_CACHE_DURATION && cachedINRRate > 0) {
    return cachedINRRate;
  }
  
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json();
      cachedINRRate = data.rates?.INR || 83.5;
      inrRateCacheTime = now;
      
      // Cache in database
      const client = await supabase();
      await client.from('exchange_rate_cache').upsert({
        base_currency: 'USD',
        target_currency: 'INR',
        rate: cachedINRRate,
        source: 'exchangerate-api',
        last_updated: new Date().toISOString(),
      }, { onConflict: 'base_currency,target_currency' });
    }
  } catch (e) {
    console.warn('[MarketData] INR rate fetch failed, using cached:', e.message);
  }
  
  return cachedINRRate;
}

// ─── Cron Job: Update FD Rates ─────────────────────────────────────
router.post('/cron/update-fd-rates', async (req, res) => {
  // In production, protect this with a cron secret
  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET && req.headers['x-cron-secret'] !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const client = await supabase();
    
    // FD rates are hardcoded with real data — in production, scrape from bank websites
    const fdRatesData = [
      // PSU Banks
      { bank_name: 'State Bank of India', bank_code: 'SBI', tenure_days: 365, rate: 6.80, senior_rate: 7.30 },
      { bank_name: 'State Bank of India', bank_code: 'SBI', tenure_days: 730, rate: 7.00, senior_rate: 7.50 },
      { bank_name: 'State Bank of India', bank_code: 'SBI', tenure_days: 1095, rate: 6.75, senior_rate: 7.25 },
      { bank_name: 'Bank of Baroda', bank_code: 'BOB', tenure_days: 365, rate: 6.85, senior_rate: 7.35 },
      { bank_name: 'Bank of Baroda', bank_code: 'BOB', tenure_days: 730, rate: 7.15, senior_rate: 7.65 },
      { bank_name: 'Bank of Baroda', bank_code: 'BOB', tenure_days: 1095, rate: 7.00, senior_rate: 7.50 },
      // Private Banks
      { bank_name: 'HDFC Bank', bank_code: 'HDFC', tenure_days: 365, rate: 7.10, senior_rate: 7.60 },
      { bank_name: 'HDFC Bank', bank_code: 'HDFC', tenure_days: 730, rate: 7.20, senior_rate: 7.70 },
      { bank_name: 'HDFC Bank', bank_code: 'HDFC', tenure_days: 1095, rate: 7.00, senior_rate: 7.50 },
      { bank_name: 'ICICI Bank', bank_code: 'ICICI', tenure_days: 365, rate: 7.10, senior_rate: 7.60 },
      { bank_name: 'ICICI Bank', bank_code: 'ICICI', tenure_days: 730, rate: 7.20, senior_rate: 7.70 },
      { bank_name: 'ICICI Bank', bank_code: 'ICICI', tenure_days: 1095, rate: 7.00, senior_rate: 7.50 },
      { bank_name: 'Axis Bank', bank_code: 'Axis', tenure_days: 365, rate: 7.10, senior_rate: 7.60 },
      { bank_name: 'Axis Bank', bank_code: 'Axis', tenure_days: 730, rate: 7.26, senior_rate: 7.76 },
      { bank_name: 'Axis Bank', bank_code: 'Axis', tenure_days: 1095, rate: 7.10, senior_rate: 7.60 },
      // High-Yield Private
      { bank_name: 'Yes Bank', bank_code: 'YES', tenure_days: 365, rate: 7.75, senior_rate: 8.25 },
      { bank_name: 'Yes Bank', bank_code: 'YES', tenure_days: 730, rate: 7.75, senior_rate: 8.25 },
      { bank_name: 'Yes Bank', bank_code: 'YES', tenure_days: 1095, rate: 7.25, senior_rate: 7.75 },
      { bank_name: 'IndusInd Bank', bank_code: 'INDUS', tenure_days: 365, rate: 7.99, senior_rate: 8.49 },
      { bank_name: 'IndusInd Bank', bank_code: 'INDUS', tenure_days: 730, rate: 7.75, senior_rate: 8.25 },
      { bank_name: 'IndusInd Bank', bank_code: 'INDUS', tenure_days: 1095, rate: 7.25, senior_rate: 7.75 },
      // Small Finance Banks
      { bank_name: 'Suryoday Small Finance Bank', bank_code: 'SURYODAY', tenure_days: 365, rate: 9.10, senior_rate: 9.60 },
      { bank_name: 'Suryoday Small Finance Bank', bank_code: 'SURYODAY', tenure_days: 730, rate: 8.60, senior_rate: 9.10 },
      { bank_name: 'Suryoday Small Finance Bank', bank_code: 'SURYODAY', tenure_days: 1095, rate: 8.25, senior_rate: 8.75 },
      { bank_name: 'Utkarsh Small Finance Bank', bank_code: 'UTKARSH', tenure_days: 365, rate: 8.50, senior_rate: 9.00 },
      { bank_name: 'Utkarsh Small Finance Bank', bank_code: 'UTKARSH', tenure_days: 730, rate: 8.25, senior_rate: 8.75 },
      { bank_name: 'Utkarsh Small Finance Bank', bank_code: 'UTKARSH', tenure_days: 1095, rate: 8.00, senior_rate: 8.50 },
      { bank_name: 'AU Small Finance Bank', bank_code: 'AU', tenure_days: 365, rate: 8.00, senior_rate: 8.50 },
      { bank_name: 'AU Small Finance Bank', bank_code: 'AU', tenure_days: 730, rate: 7.75, senior_rate: 8.25 },
      { bank_name: 'AU Small Finance Bank', bank_code: 'AU', tenure_days: 1095, rate: 7.50, senior_rate: 8.00 },
    ];
    
    for (const fd of fdRatesData) {
      await client.from('fd_rates').upsert({
        ...fd,
        min_amount: 1000,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'bank_code,tenure_days' });
    }
    
    // Update metadata
    await client.from('market_cache_metadata').upsert({
      cache_type: 'fd_rates',
      last_updated: new Date().toISOString(),
      status: 'ready',
      records_count: fdRatesData.length,
    }, { onConflict: 'cache_type' });
    
    console.log(`[Cron] Updated ${fdRatesData.length} FD rates`);
    res.json({ success: true, count: fdRatesData.length });
  } catch (err) {
    console.error('[Cron] FD rates update failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Cron Job: Update MF NAV Cache ─────────────────────────────────
router.post('/cron/update-mf-nav', async (req, res) => {
  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET && req.headers['x-cron-secret'] !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const client = await supabase();
    const AMFI_API = 'https://api.mfapi.in/mf';
    
    // Fetch all funds
    const response = await fetch(AMFI_API);
    if (!response.ok) throw new Error('AMFI API failed');
    
    const allFunds = await response.json();
    
    // Filter for popular large-cap funds only to reduce API load
    const popularFunds = allFunds.filter(f => {
      const name = (f.schemeName || '').toLowerCase();
      return name.includes('large cap') || name.includes('blue chip') || 
             name.includes('top 100') || name.includes('flexi cap') ||
             name.includes('nifty 50') || name.includes('sensex');
    }).slice(0, 50);
    
    // Fetch NAV for each
    let updated = 0;
    for (const fund of popularFunds) {
      try {
        const navRes = await fetch(`${AMFI_API}/${fund.schemeCode}`);
        if (navRes.ok) {
          const navData = await navRes.json();
          const latestNav = navData.data?.[0];
          
          if (latestNav?.nav) {
            await client.from('mf_nav_cache').upsert({
              scheme_code: fund.schemeCode,
              scheme_name: fund.schemeName,
              nav: parseFloat(latestNav.nav),
              nav_date: latestNav.date,
              last_updated: new Date().toISOString(),
            }, { onConflict: 'scheme_code' });
            updated++;
          }
        }
      } catch (e) {
        // Skip individual fund errors
      }
    }
    
    // Update metadata
    await client.from('market_cache_metadata').upsert({
      cache_type: 'mf_nav',
      last_updated: new Date().toISOString(),
      status: 'ready',
      records_count: updated,
    }, { onConflict: 'cache_type' });
    
    console.log(`[Cron] Updated NAV for ${updated} funds`);
    res.json({ success: true, count: updated });
  } catch (err) {
    console.error('[Cron] MF NAV update failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Get User Financial Context ──────────────────────────────────────
router.get('/user-context/:userId', async (req, res) => {
  try {
    const client = await supabase();
    const { userId } = req.params;
    
    // Check cache first (5 min TTL)
    const { data: cached } = await client
      .from('user_financial_context')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.last_activity).getTime();
      if (cacheAge < 5 * 60 * 1000) {
        return res.json({ context: cached.context_json, from_cache: true });
      }
    }
    
    // Build fresh context from portfolio data
    const context = await buildUserFinancialContext(client, userId);
    
    // Store in cache
    await client.from('user_financial_context').upsert({
      user_id: userId,
      context_json: context,
      net_worth: context.netWorth,
      fd_count: context.fdCount,
      sip_count: context.sipCount,
      crypto_count: context.cryptoCount,
      monthly_income: context.monthlyIncome,
      tax_bracket: context.taxBracket,
      fire_goal: context.fireGoal,
      fire_target_year: context.fireTargetYear,
      last_activity: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    
    res.json({ context, from_cache: false });
  } catch (err) {
    console.error('[MarketData] User context error:', err);
    res.status(500).json({ error: 'Failed to build context' });
  }
});

// ─── Build User Financial Context ────────────────────────────────────
async function buildUserFinancialContext(client, userId) {
  // Get portfolio data
  const { data: portfolio } = await client
    .from('portfolios')
    .select('*')
    .eq('user_id', userId);
  
  // Get transactions for income analysis
  const { data: transactions } = await client
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30);
  
  // Get user profile
  const { data: profile } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  // Get debt data
  const { data: debts } = await client
    .from('debt_tracking')
    .select('*')
    .eq('user_id', userId);
  
  // Calculate totals
  const fds = (portfolio || []).filter(p => p.type === 'fd');
  const sips = (portfolio || []).filter(p => p.type === 'sip');
  const cryptos = (portfolio || []).filter(p => p.type === 'crypto');
  
  const totalFD = fds.reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalSIP = sips.reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalCrypto = cryptos.reduce((s, c) => s + parseFloat(c.current_value || 0), 0);
  
  // Calculate monthly income from transactions
  const monthlyIncome = calculateMonthlyIncome(transactions || []);
  
  // Calculate this month's spending
  const thisMonthSpend = calculateThisMonthSpend(transactions || []);
  
  // Estimate tax bracket
  const annualIncome = monthlyIncome * 12;
  const taxBracket = getTaxBracket(annualIncome);
  
  // Calculate net worth
  const netWorth = totalFD + totalSIP + totalCrypto;
  
  // Calculate emergency fund (3 months of average spend)
  const avgMonthlySpend = calculateAvgMonthlySpend(transactions || []);
  const emergencyFund = avgMonthlySpend * 3;
  
  // Get FIRE goal from profile
  const fireGoal = profile?.fire_goal || 0;
  const fireTargetYear = profile?.fire_target_year || 2040;
  
  // Calculate avg FD rate
  let avgFDRate = 0;
  if (fds.length > 0) {
    avgFDRate = fds.reduce((s, f) => s + parseFloat(f.rate || 0), 0) / fds.length;
  }
  
  return {
    netWorth,
    totalFD,
    totalSIP,
    totalCrypto,
    fdCount: fds.length,
    sipCount: sips.length,
    cryptoCount: cryptos.length,
    avgFDRate: Math.round(avgFDRate * 10) / 10,
    monthlyIncome,
    thisMonthSpend,
    emergencyFund,
    taxBracket,
    annualIncome,
    fireGoal,
    fireTargetYear,
    debtCount: debts?.length || 0,
    totalDebt: (debts || []).reduce((s, d) => s + parseFloat(d.outstanding_amount || 0), 0),
    profileAge: profile?.age || null,
    profileType: detectProfileType(profile?.age, annualIncome, fds.length, sips.length),
    formatted: formatContextForAI({
      netWorth,
      totalFD,
      totalSIP,
      totalCrypto,
      fdCount: fds.length,
      sipCount: sips.length,
      avgFDRate,
      monthlyIncome,
      thisMonthSpend,
      emergencyFund,
      taxBracket,
      fireGoal,
    }),
  };
}

function calculateMonthlyIncome(transactions) {
  const credits = transactions.filter(t => t.amount > 0);
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  
  const thisMonthCredits = credits.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  
  if (thisMonthCredits.length > 0) {
    return thisMonthCredits.reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0);
  }
  
  // Fallback: average of last 3 months
  const last3Months = credits.slice(0, 20);
  return last3Months.length > 0 
    ? last3Months.reduce((s, t) => s + Math.abs(parseFloat(t.amount)), 0) / 3 
    : 50000; // default
}

function calculateThisMonthSpend(transactions) {
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  
  const debits = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear && t.amount < 0;
  });
  
  return debits.reduce((s, t) => s + Math.abs(parseFloat(t.amount || 0)), 0);
}

function calculateAvgMonthlySpend(transactions) {
  // Calculate from last 6 months of transactions
  const debits = transactions.filter(t => t.amount < 0);
  const months = new Set();
  
  debits.forEach(t => {
    const d = new Date(t.date);
    months.add(`${d.getFullYear()}-${d.getMonth()}`);
  });
  
  const monthCount = months.size || 1;
  const totalSpend = debits.reduce((s, t) => s + Math.abs(parseFloat(t.amount || 0)), 0);
  
  return totalSpend / monthCount || 25000; // default
}

function getTaxBracket(annualIncome) {
  if (annualIncome <= 300000) return '0%';
  if (annualIncome <= 600000) return '5%';
  if (annualIncome <= 900000) return '10%';
  if (annualIncome <= 1200000) return '15%';
  if (annualIncome <= 1500000) return '20%';
  return '30%';
}

function detectProfileType(age, annualIncome, fdCount, sipCount) {
  if (age && age >= 60) return 'senior_citizen';
  if (age && age >= 50) return 'pre_retirement';
  if (annualIncome > 1000000 && fdCount >= 2) return 'middle_income';
  if (annualIncome < 300000) return 'young_accumulator';
  if (annualIncome >= 300000 && annualIncome <= 1000000 && sipCount > 0) return 'middle_income';
  return 'young_accumulator';
}

function formatContextForAI(ctx) {
  // Format for injection into AI system prompt
  return `USER FINANCIAL SNAPSHOT:
- Net worth: ₹${ctx.netWorth.toLocaleString('en-IN')}
- FDs: ${ctx.fdCount} (total ₹${ctx.totalFD.toLocaleString('en-IN')}, avg rate ${ctx.avgFDRate}%)
- SIPs: ${ctx.sipCount} (total ₹${ctx.totalSIP.toLocaleString('en-IN')})
- Crypto: ${ctx.cryptoCount > 0 ? `₹${ctx.totalCrypto.toLocaleString('en-IN')}` : 'none'}
- Monthly income: ₹${Math.round(ctx.monthlyIncome).toLocaleString('en-IN')}
- This month spent: ₹${Math.round(ctx.thisMonthSpend).toLocaleString('en-IN')}
- Emergency fund: ₹${Math.round(ctx.emergencyFund).toLocaleString('en-IN')}
- Tax bracket: ${ctx.taxBracket}
- FIRE goal: ₹${ctx.fireGoal > 0 ? ctx.fireGoal.toLocaleString('en-IN') : 'not set'}${ctx.fireGoal > 0 ? ` by ${new Date().getFullYear() + 15}` : ''}`;
}

// ─── Gold Price Cache ────────────────────────────────────────────────
router.get('/gold-price', async (req, res) => {
  try {
    const client = await supabase();
    
    // Try metals-api first
    const METALS_API_KEY = process.env.METALS_API_KEY;
    let pricePerGram = 0;
    let source = 'cached';
    
    if (METALS_API_KEY) {
      try {
        const response = await fetch(`https://metals-api.com/api/latest?access_key=${METALS_API_KEY}&base=XAU&symbols=INR`);
        if (response.ok) {
          const data = await response.json();
          // 1 troy oz = 31.1035 grams
          pricePerGram = (data.rates?.INR || 0) / 31.1035;
          source = 'metals-api';
        }
      } catch (e) {
        console.warn('[MarketData] Metals API failed:', e.message);
      }
    }
    
    // Fallback to cached
    if (!pricePerGram) {
      const { data } = await client.from('gold_price_cache').select('*').single();
      pricePerGram = data?.price_per_gram_inr || 7500; // Default ~₹7500/gm
    }
    
    // Cache result
    await client.from('gold_price_cache').upsert({
      price_per_gram_inr: pricePerGram,
      price_per_tola_inr: pricePerGram * 11.66,
      source,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'id' }); // Upsert first row
    
    res.json({
      price_per_gram: Math.round(pricePerGram * 100) / 100,
      price_per_tola: Math.round(pricePerGram * 11.66 * 100) / 100,
      source,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[MarketData] Gold price error:', err);
    res.status(500).json({ error: 'Failed to fetch gold price' });
  }
});

// ─── Cache Status ────────────────────────────────────────────────────
router.get('/cache-status', async (req, res) => {
  try {
    const client = await supabase();
    const { data } = await client.from('market_cache_metadata').select('*');
    
    res.json({
      caches: data || [],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cache status' });
  }
});

export default router;