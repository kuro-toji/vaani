// ═══════════════════════════════════════════════════════════════════
// VAANI Binance Crypto Service — Fetch real-time crypto prices
// API: https://api.binance.com/api/v3/ticker/price — Free, no API key
// ═══════════════════════════════════════════════════════════════════

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

// ─── Types ───────────────────────────────────────────────────────────
export interface BinanceTicker {
  symbol: string;
  price: string;
  priceChangePercent: string;
}

export interface CryptoPrice {
  symbol: string;        // e.g., "BTCUSDT"
  baseAsset: string;     // e.g., "BTC"
  quoteAsset: string;    // e.g., "USDT"
  price: number;         // Current price
  priceInINR: number;    // Price converted to INR
  change24h: number;     // 24h price change percent
  lastUpdated: Date;
}

export interface CryptoHolding {
  id: string;
  coin: string;          // e.g., "Bitcoin", "Ethereum"
  symbol: string;        // e.g., "BTC", "ETH"
  amount: number;        // Quantity held
  buyPrice: number;     // Average buy price in USDT
  currentPrice: number;  // Current price in USDT
  currentValueUSD: number;
  currentValueINR: number;
  profitLoss: number;
  profitLossPercent: number;
}

// USD/INR exchange rate (cached, refreshes hourly)
let usdToInrRate = 83.5; // Default fallback rate
let lastRateUpdate = 0;
const RATE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// ─── Fetch USD to INR Rate ──────────────────────────────────────────
export async function fetchUSDToINRRate(): Promise<number> {
  const now = Date.now();
  
  // Return cached rate if still valid
  if (now - lastRateUpdate < RATE_CACHE_DURATION && usdToInrRate > 0) {
    return usdToInrRate;
  }
  
  try {
    // Using a free forex API
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

// ─── Fetch Single Ticker Price ──────────────────────────────────────
export async function fetchTickerPrice(symbol: string): Promise<CryptoPrice | null> {
  try {
    const response = await fetch(`${BINANCE_API_BASE}/ticker/price?symbol=${symbol}`);
    if (!response.ok) {
      console.warn(`[Binance] Symbol not found: ${symbol}`);
      return null;
    }
    
    const data: { symbol: string; price: string } = await response.json();
    const usdRate = await fetchUSDToINRRate();
    
    return {
      symbol: data.symbol,
      baseAsset: data.symbol.replace(/USDT$/, ''),
      quoteAsset: 'USDT',
      price: parseFloat(data.price),
      priceInINR: parseFloat(data.price) * usdRate,
      change24h: 0, // Single ticker doesn't include change
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error(`[Binance] Error fetching price for ${symbol}:`, error);
    return null;
  }
}

// ─── Fetch 24h Ticker Stats (includes change %) ──────────────────────
export async function fetch24hTicker(symbol: string): Promise<CryptoPrice | null> {
  try {
    const response = await fetch(`${BINANCE_API_BASE}/ticker/24hr?symbol=${symbol}`);
    if (!response.ok) return null;
    
    const data: BinanceTicker & { priceChangePercent: string } = await response.json();
    const usdRate = await fetchUSDToINRRate();
    
    return {
      symbol: data.symbol,
      baseAsset: data.symbol.replace(/USDT$/, ''),
      quoteAsset: 'USDT',
      price: parseFloat(data.price),
      priceInINR: parseFloat(data.price) * usdRate,
      change24h: parseFloat(data.priceChangePercent) || 0,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error(`[Binance] Error fetching 24h ticker for ${symbol}:`, error);
    return null;
  }
}

// ─── Fetch Multiple Prices at Once ──────────────────────────────────
export async function fetchMultiplePrices(
  symbols: string[]
): Promise<Map<string, CryptoPrice>> {
  const results = new Map<string, CryptoPrice>();
  
  // Binance doesn't support batch requests for ticker prices
  // So we fetch them in parallel (rate limited)
  const batchSize = 5;
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map(symbol => fetch24hTicker(symbol));
    const prices = await Promise.all(promises);
    
    prices.forEach((price, index) => {
      if (price) {
        results.set(batch[index], price);
      }
    });
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < symbols.length) {
      await sleep(100);
    }
  }
  
  return results;
}

// ─── Calculate Holding Value ────────────────────────────────────────
export async function calculateHoldingValue(
  symbol: string,
  amount: number,
  buyPrice: number
): Promise<CryptoHolding | null> {
  const currentData = await fetch24hTicker(symbol);
  
  if (!currentData) return null;
  
  const currentValueUSD = amount * currentData.price;
  const currentValueINR = amount * currentData.priceInINR;
  const investedUSD = amount * buyPrice;
  const profitLoss = currentValueUSD - investedUSD;
  const profitLossPercent = buyPrice > 0 ? ((currentData.price - buyPrice) / buyPrice) * 100 : 0;
  
  const coinNames: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    BNB: 'Binance Coin',
    XRP: 'Ripple',
    ADA: 'Cardano',
    SOL: 'Solana',
    DOGE: 'Dogecoin',
    DOT: 'Polkadot',
    MATIC: 'Polygon',
    SHIB: 'Shiba Inu',
    LTC: 'Litecoin',
    AVAX: 'Avalanche',
    LINK: 'Chainlink',
    UNI: 'Uniswap',
    ATOM: 'Cosmos',
  };
  
  return {
    id: `${symbol}-${Date.now()}`,
    coin: coinNames[symbol.replace('USDT', '')] || symbol.replace('USDT', ''),
    symbol: symbol.replace('USDT', ''),
    amount,
    buyPrice,
    currentPrice: currentData.price,
    currentValueUSD,
    currentValueINR,
    profitLoss,
    profitLossPercent,
  };
}

// ─── Get Total Portfolio Value ─────────────────────────────────────
export async function getTotalPortfolioValue(
  holdings: { symbol: string; amount: number }[]
): Promise<{ totalUSD: number; totalINR: number; breakdown: CryptoHolding[] }> {
  const breakdown: CryptoHolding[] = [];
  let totalUSD = 0;
  
  for (const holding of holdings) {
    const fullSymbol = holding.symbol.toUpperCase().endsWith('USDT') 
      ? holding.symbol.toUpperCase() 
      : `${holding.symbol.toUpperCase()}USDT`;
    
    const value = await calculateHoldingValue(fullSymbol, holding.amount, 0);
    if (value) {
      breakdown.push(value);
      totalUSD += value.currentValueUSD;
    }
  }
  
  const usdRate = await fetchUSDToINRRate();
  
  return {
    totalUSD,
    totalINR: totalUSD * usdRate,
    breakdown,
  };
}

// ─── Popular Crypto Symbols ─────────────────────────────────────────
export const POPULAR_SYMBOLS = [
  'BTCUSDT',  // Bitcoin
  'ETHUSDT',  // Ethereum
  'BNBUSDT',  // BNB
  'XRPUSDT',  // Ripple
  'ADAUSDT',  // Cardano
  'SOLUSDT',  // Solana
  'DOGEUSDT', // Dogecoin
  'DOTUSDT',  // Polkadot
  'MATICUSDT', // Polygon
  'LTCUSDT',  // Litecoin
  'AVAXUSDT', // Avalanche
  'LINKUSDT', // Chainlink
  'UNIUSDT',  // Uniswap
  'ATOMUSDT', // Cosmos
  'SHIBUSDT', // Shiba Inu
];

// ─── Search Symbols ─────────────────────────────────────────────────
export async function searchSymbols(query: string): Promise<string[]> {
  if (!query || query.length < 1) return POPULAR_SYMBOLS;
  
  try {
    // Fetch all tickers (heavy, but cached)
    const response = await fetch(`${BINANCE_API_BASE}/ticker/price`);
    if (!response.ok) return [];
    
    const allTickers: { symbol: string }[] = await response.json();
    const upperQuery = query.toUpperCase();
    
    return allTickers
      .filter(t => t.symbol.includes(upperQuery) && t.symbol.endsWith('USDT'))
      .map(t => t.symbol)
      .slice(0, 20);
  } catch (error) {
    console.error('[Binance] Error searching symbols:', error);
    return [];
  }
}

// ─── Format Crypto Amount ────────────────────────────────────────────
export function formatCryptoAmount(amount: number, symbol: string): string {
  // Show more decimals for small amounts
  if (amount < 0.001) return amount.toFixed(8);
  if (amount < 1) return amount.toFixed(6);
  if (amount < 100) return amount.toFixed(4);
  return amount.toFixed(2);
}

// ─── Format Price ────────────────────────────────────────────────────
export function formatCryptoPrice(price: number): string {
  if (price < 0.01) return `₹${price.toFixed(4)}`;
  if (price < 1) return `₹${price.toFixed(3)}`;
  if (price < 100) return `₹${price.toFixed(2)}`;
  return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// ─── Helper: Sleep ────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  fetchTickerPrice,
  fetch24hTicker,
  fetchMultiplePrices,
  calculateHoldingValue,
  getTotalPortfolioValue,
  searchSymbols,
  POPULAR_SYMBOLS,
  formatCryptoAmount,
  formatCryptoPrice,
  fetchUSDToINRRate,
};
