// ═══════════════════════════════════════════════════════════════════
// VAANI Gold Price Service — Fetch gold prices
// API: metals-api.com (free tier) — needs free API key
// ═══════════════════════════════════════════════════════════════════

import * as Constants from '../constants';

// ─── Types ───────────────────────────────────────────────────────────
export interface GoldPrice {
  pricePerGram: number;      // Price per gram in INR
  pricePerTola: number;       // Price per tola (11.664g) in INR
  pricePerOz: number;         // Price per ounce in INR
  pricePerKg: number;         // Price per kg in INR
  pricePerBharat: number;    // Price per Bharat (10g) in INR
  currency: string;
  lastUpdated: Date;
  source: string;
}

export interface GoldHolding {
  id: string;
  grams: number;
  buyPricePerGram: number;
  currentPricePerGram: number;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface GoldHistoricalData {
  date: string;
  priceInr: number;
}

// ─── API Configuration ────────────────────────────────────────────────
const METALS_API_BASE = 'https://metals-api.com/api';
const FALLBACK_API = 'https://api.goldprice.org/v1/latest/inr';

// Cache for gold prices (refresh every 15 minutes)
let cachedGoldPrice: GoldPrice | null = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// ─── Fetch Gold Price (metals-api.com) ──────────────────────────────
export async function fetchGoldPriceMetalsAPI(): Promise<GoldPrice | null> {
  try {
    const apiKey = Constants.API_CONFIG.METALS_API_KEY || 'demo';
    const response = await fetch(
      `${METALS_API_BASE}/latest?access_key=${apiKey}&base=USD&symbols=XAU`
    );
    
    if (!response.ok) {
      console.warn('[Gold] metals-api.com returned error');
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.rates && data.rates.XAU) {
      // XAU = 1 troy ounce of gold
      // 1 troy ounce = 31.1035 grams
      const pricePerOzUSD = 1 / data.rates.XAU; // Price in USD per oz
      const pricePerGramUSD = pricePerOzUSD / 31.1035;
      const pricePerGramINR = pricePerGramUSD * 83.5; // USD to INR conversion
      
      return {
        pricePerGram: Math.round(pricePerGramINR * 100) / 100,
        pricePerTola: Math.round(pricePerGramINR * 11.664 * 100) / 100,
        pricePerOz: Math.round(pricePerGramINR * 31.1035 * 100) / 100,
        pricePerKg: Math.round(pricePerGramINR * 1000 * 100) / 100,
        pricePerBharat: Math.round(pricePerGramINR * 10 * 100) / 100, // 10g = 1 Bharat
        currency: 'INR',
        lastUpdated: new Date(),
        source: 'metals-api.com',
      };
    }
    
    return null;
  } catch (error) {
    console.error('[Gold] Error fetching from metals-api:', error);
    return null;
  }
}

// ─── Fetch Gold Price (Fallback - goldprice.org) ─────────────────────
export async function fetchGoldPriceFallback(): Promise<GoldPrice | null> {
  try {
    const response = await fetch(`${FALLBACK_API}?currency=INR`);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Calculate price per gram from the API response
    const pricePerOz = data.price_per_oz || data.price || 0;
    const pricePerGramINR = pricePerOz / 31.1035;
    
    return {
      pricePerGram: Math.round(pricePerGramINR * 100) / 100,
      pricePerTola: Math.round(pricePerGramINR * 11.664 * 100) / 100,
      pricePerOz: Math.round(pricePerOz * 100) / 100,
      pricePerKg: Math.round(pricePerGramINR * 1000 * 100) / 100,
      pricePerBharat: Math.round(pricePerGramINR * 10 * 100) / 100,
      currency: 'INR',
      lastUpdated: new Date(),
      source: 'goldprice.org',
    };
  } catch (error) {
    console.error('[Gold] Error fetching from goldprice.org:', error);
    return null;
  }
}

// ─── Get Gold Price (with caching) ──────────────────────────────────
export async function getGoldPrice(): Promise<GoldPrice | null> {
  const now = Date.now();
  
  // Return cached price if still valid
  if (cachedGoldPrice && now - lastCacheUpdate < CACHE_DURATION) {
    return cachedGoldPrice;
  }
  
  // Try metals-api.com first
  let price = await fetchGoldPriceMetalsAPI();
  
  // Fallback to goldprice.org
  if (!price) {
    price = await fetchGoldPriceFallback();
  }
  
  // If both fail, return cached or hardcoded fallback
  if (!price) {
    console.warn('[Gold] All APIs failed, using hardcoded fallback');
    price = getHardcodedFallbackPrice();
  }
  
  cachedGoldPrice = price;
  lastCacheUpdate = now;
  
  return price;
}

// ─── Hardcoded Fallback (updated Apr 2026 rates) ─────────────────────
function getHardcodedFallbackPrice(): GoldPrice {
  // Approximate gold price in India as of April 2026
  const pricePerGram = 7450; // INR per gram
  
  return {
    pricePerGram,
    pricePerTola: Math.round(pricePerGram * 11.664),
    pricePerOz: Math.round(pricePerGram * 31.1035),
    pricePerKg: pricePerGram * 1000,
    pricePerBharat: pricePerGram * 10, // 1 Bharat = 10 grams
    currency: 'INR',
    lastUpdated: new Date(),
    source: 'fallback',
  };
}

// ─── Calculate Gold Holding Value ────────────────────────────────────
export async function calculateGoldHolding(
  grams: number,
  buyPricePerGram: number
): Promise<GoldHolding | null> {
  const currentGold = await getGoldPrice();
  
  if (!currentGold) return null;
  
  const currentPricePerGram = currentGold.pricePerGram;
  const totalInvested = grams * buyPricePerGram;
  const currentValue = grams * currentPricePerGram;
  const profitLoss = currentValue - totalInvested;
  const profitLossPercent = buyPricePerGram > 0 
    ? ((currentPricePerGram - buyPricePerGram) / buyPricePerGram) * 100 
    : 0;
  
  return {
    id: `gold-${Date.now()}`,
    grams,
    buyPricePerGram,
    currentPricePerGram,
    totalInvested,
    currentValue,
    profitLoss,
    profitLossPercent,
  };
}

// ─── Get Multiple Holdings Total ─────────────────────────────────────
export async function getGoldPortfolioValue(
  holdings: { grams: number; buyPrice: number }[]
): Promise<{
  totalGrams: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  breakdown: GoldHolding[];
}> {
  const breakdown: GoldHolding[] = [];
  let totalInvested = 0;
  let totalCurrentValue = 0;
  
  const currentGold = await getGoldPrice();
  const currentPricePerGram = currentGold?.pricePerGram || 7450;
  
  for (const holding of holdings) {
    const invested = holding.grams * holding.buyPrice;
    const currentValue = holding.grams * currentPricePerGram;
    
    totalInvested += invested;
    totalCurrentValue += currentValue;
    
    breakdown.push({
      id: `gold-${Date.now()}-${Math.random()}`,
      grams: holding.grams,
      buyPricePerGram: holding.buyPrice,
      currentPricePerGram,
      totalInvested: invested,
      currentValue,
      profitLoss: currentValue - invested,
      profitLossPercent: holding.buyPrice > 0 
        ? ((currentPricePerGram - holding.buyPrice) / holding.buyPrice) * 100 
        : 0,
    });
  }
  
  return {
    totalGrams: holdings.reduce((sum, h) => sum + h.grams, 0),
    totalInvested,
    totalCurrentValue,
    totalProfitLoss: totalCurrentValue - totalInvested,
    totalProfitLossPercent: totalInvested > 0 
      ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 
      : 0,
    breakdown,
  };
}

// ─── Historical Gold Price (simulated) ───────────────────────────────
// Note: metals-api.com free tier doesn't support historical data
// For production, consider upgrading to paid tier or using alternative
export async function getHistoricalGoldPrice(
  _startDate: Date,
  _endDate: Date = new Date()
): Promise<GoldHistoricalData[]> {
  // Return simulated historical data based on current price
  // In production, use paid metals-api.com historical endpoint
  const currentPrice = await getGoldPrice();
  const basePrice = currentPrice?.pricePerGram || 7450;
  
  const data: GoldHistoricalData[] = [];
  const endDate = _endDate || new Date();
  const startDate = _startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Generate daily data points with small random variations
  const current = new Date(startDate);
  let price = basePrice * 0.95; // Start 5% lower
  
  while (current <= endDate) {
    // Simulate gradual increase with daily variation
    const dailyChange = (Math.random() - 0.4) * 50; // Slight upward bias
    price = Math.max(price + dailyChange, basePrice * 0.85);
    
    data.push({
      date: current.toISOString().split('T')[0],
      priceInr: Math.round(price),
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return data;
}

// ─── Format Gold Amount ───────────────────────────────────────────────
export function formatGoldAmount(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(3)} kg`;
  }
  if (grams >= 10) {
    return `${grams.toFixed(2)} g`;
  }
  return `${grams.toFixed(3)} g`;
}

// ─── Format Gold Price ───────────────────────────────────────────────
export function formatGoldPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Get Gold Price Summary ─────────────────────────────────────────
export async function getGoldPriceSummary(): Promise<string> {
  const gold = await getGoldPrice();
  
  if (!gold) return 'Gold price unavailable';
  
  return `Gold today: ₹${gold.pricePerBharat}/Bharat (10g), ₹${gold.pricePerGram}/gram`;
}

export default {
  getGoldPrice,
  fetchGoldPriceMetalsAPI,
  fetchGoldPriceFallback,
  calculateGoldHolding,
  getGoldPortfolioValue,
  getHistoricalGoldPrice,
  formatGoldAmount,
  formatGoldPrice,
  getGoldPriceSummary,
};
