// ═══════════════════════════════════════════════════════════════════
// VAANI Binance Service — Fetch real-time crypto prices
// API: https://api.binance.com/api/v3/ticker/24hr — Free, no API key
// ═══════════════════════════════════════════════════════════════════

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

// USD/INR exchange rate (cached, refreshes hourly)
let usdToInrRate = 83.5;
let lastRateUpdate = 0;
const RATE_CACHE_DURATION = 60 * 60 * 1000;

// ─── Fetch USD to INR Rate ───────────────────────────────────────
export async function fetchUSDToINRRate() {
  const now = Date.now();
  
  // Return cached rate if still valid
  if (now - lastRateUpdate < RATE_CACHE_DURATION && usdToInrRate > 0) {
    return usdToInrRate;
  }
  
  try {
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USDT'
    );
    if (!response.ok) throw new Error('Failed to fetch exchange rate');
    const data = await response.json();
    
    if (data.rates && data.rates.INR) {
      usdToInrRate = data.rates.INR;
      lastRateUpdate = now;
      return usdToInrRate;
    }
  } catch (error) {
    console.warn('[Binance] Could not fetch USD/INR rate, using cached:', error);
  }
  
  return usdToInrRate;
}

// ─── Fetch Single Ticker Price ───────────────────────────────────
export async function fetchTickerPrice(symbol) {
  try {
    const response = await fetch(`${BINANCE_API_BASE}/ticker/price?symbol=${symbol}`);
    if (!response.ok) {
      console.warn(`[Binance] Symbol not found: ${symbol}`);
      return null;
    }
    
    const data = await response.json();
    const usdRate = await fetchUSDToINRRate();
    
    return {
      symbol: data.symbol,
      baseAsset: data.symbol.replace(/USDT$/, ''),
      price: parseFloat(data.price),
      priceInINR: parseFloat(data.price) * usdRate,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error(`[Binance] Error fetching price for ${symbol}:`, error);
    return null;
  }
}

// ─── Fetch 24h Ticker Stats (includes change %) ───────────────────
export async function fetch24hTicker(symbol) {
  try {
    const response = await fetch(`${BINANCE_API_BASE}/ticker/24hr?symbol=${symbol}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const usdRate = await fetchUSDToINRRate();
    
    return {
      symbol: data.symbol,
      baseAsset: data.symbol.replace(/USDT$/, ''),
      price: parseFloat(data.price),
      priceInINR: parseFloat(data.price) * usdRate,
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
  BNB: 'Binance Coin',
  XRP: 'Ripple',
  ADA: 'Cardano',
  SOL: 'Solana',
  DOGE: 'Dogecoin',
  LTC: 'Litecoin',
  DOT: 'Polkadot',
  MATIC: 'Polygon',
  SHIB: 'Shiba Inu',
  AVAX: 'Avalanche',
  LINK: 'Chainlink',
  UNI: 'Uniswap',
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
  if (price < 0.01) return `₹${price.toFixed(4)}`;
  if (price < 1) return `₹${price.toFixed(3)}`;
  if (price < 100) return `₹${price.toFixed(2)}`;
  return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// ─── Format Percent Change ───────────────────────────────────────
export function formatChange(change) {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export default {
  fetchUSDToINRRate,
  fetchTickerPrice,
  fetch24hTicker,
  getMultiplePrices,
  POPULAR_SYMBOLS,
  formatCryptoPrice,
  formatChange,
};