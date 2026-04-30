// ═══════════════════════════════════════════════════════════════════
// VAANI Binance Service — Fetch real-time crypto prices
// API: https://api.binance.com/api/v3/ticker/24hr — Free, no API key
// ═══════════════════════════════════════════════════════════════════

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

// USD/INR exchange rate (cached, refreshes hourly)
let usdToInrRate = 83.5; // Default fallback
let lastRateUpdate = 0;
const RATE_CACHE_DURATION = 60 * 60 * 1000;

// ─── Fetch USD to INR Rate ───────────────────────────────────────
export async function fetchUSDToINRRate() {
  const now = Date.now();
  
  if (now - lastRateUpdate < RATE_CACHE_DURATION && usdToInrRate > 0) {
    return usdToInrRate;
  }
  
  try {
    // Using exchangerate-api which returns USD base
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) throw new Error('Failed to fetch exchange rate');
    const data = await response.json();
    
    // API returns base USD, so rates are relative to USD
    // USD to INR rate
    if (data.rates && data.rates.INR) {
      usdToInrRate = data.rates.INR;
      lastRateUpdate = now;
      console.log('[Binance] USD/INR rate fetched:', usdToInrRate);
      return usdToInrRate;
    }
  } catch (error) {
    console.warn('[Binance] Could not fetch USD/INR rate, using cached/default:', error);
  }
  
  return usdToInrRate;
}

// ─── Fetch 24h Ticker Stats ───────────────────────────────────────
export async function fetch24hTicker(symbol) {
  try {
    const response = await fetch(`${BINANCE_API_BASE}/ticker/24hr?symbol=${symbol}`);
    if (!response.ok) {
      console.warn(`[Binance] Symbol not found: ${symbol}`);
      return null;
    }
    
    const data = await response.json();
    
    // Get USD to INR rate
    let inrRate = usdToInrRate;
    try {
      inrRate = await fetchUSDToINRRate();
    } catch (e) {
      // Use cached value
    }
    
    const priceUSD = parseFloat(data.lastPrice || data.price || 0);
    const priceINR = priceUSD * inrRate;
    
    return {
      symbol: data.symbol,
      baseAsset: data.symbol.replace(/USDT$/, ''),
      price: priceUSD,
      priceInINR: priceINR,
      change24h: parseFloat(data.priceChangePercent) || 0,
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume: parseFloat(data.volume),
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error(`[Binance] Error fetching 24h ticker for ${symbol}:`, error);
    return null;
  }
}

// ─── Popular Crypto Symbols ──────────────────────────────────────
export const POPULAR_SYMBOLS = [
  'BTCUSDT',  // Bitcoin
  'ETHUSDT',  // Ethereum
  'BNBUSDT',  // BNB
  'XRPUSDT',  // Ripple
  'ADAUSDT',  // Cardano
  'SOLUSDT',  // Solana
  'DOGEUSDT', // Dogecoin
  'LTCUSDT',  // Litecoin
  'DOTUSDT',  // Polkadot
  'MATICUSDT', // Polygon
];

// ─── Coin Names Map ──────────────────────────────────────────────
const COIN_NAMES = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  BNB: 'BNB',
  XRP: 'XRP',
  ADA: 'ADA',
  SOL: 'Solana',
  DOGE: 'DOGE',
  LTC: 'LTC',
  DOT: 'DOT',
  MATIC: 'MATIC',
  SHIB: 'SHIB',
  AVAX: 'AVAX',
  LINK: 'LINK',
  UNI: 'UNI',
};

// ─── Get Multiple Crypto Prices ─────────────────────────────────
export async function getMultiplePrices(symbols = POPULAR_SYMBOLS) {
  const results = [];
  
  for (const symbol of symbols) {
    const ticker = await fetch24hTicker(symbol);
    if (ticker) {
      results.push({
        ...ticker,
        coinName: COIN_NAMES[symbol.replace('USDT', '')] || symbol.replace('USDT', ''),
      });
    }
  }
  
  return results;
}

// ─── Format Crypto Price ─────────────────────────────────────────
export function formatCryptoPrice(price) {
  if (!price || isNaN(price)) return '₹--';
  if (price < 0.01) return `₹${price.toFixed(4)}`;
  if (price < 1) return `₹${price.toFixed(3)}`;
  if (price < 100) return `₹${price.toFixed(2)}`;
  return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// ─── Format Percent Change ───────────────────────────────────────
export function formatChange(change) {
  if (!change || isNaN(change)) return '0%';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export default {
  fetchUSDToINRRate,
  fetch24hTicker,
  getMultiplePrices,
  POPULAR_SYMBOLS,
  formatCryptoPrice,
  formatChange,
};