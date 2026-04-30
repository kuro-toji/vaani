 // ═══════════════════════════════════════════════════════════════════
// VAANI Live Market Data Service — Real Binance+CoinGecko+AMFI+FD
// Fetches real prices continuously with caching & auto-refresh
// ═══════════════════════════════════════════════════════════════════

import { setCryptoCache, getCryptoCache, setSIPCache, getSIPCache } from './cacheService';

export interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  priceINR: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  image?: string;
  rank?: number;
}

export interface FDRate {
  bankId: string;
  bankName: string;
  bankShort: string;
  type: 'psu' | 'private' | 'sfb';
  rate: number;
  seniorRate: number;
  tenure: string;
  minDeposit: number;
}

export interface SIPFund {
  schemeCode: string;
  schemeName: string;
  nav: number;
  date: string;
  category: string;
  risk: string;
  minSIP: number;
}

// ─── CoinGecko IDs for top coins ────────────────────────────────
const COINGECKO_IDS = [
  'bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple',
  'cardano', 'dogecoin', 'polkadot', 'avalanche-2', 'chainlink',
  'polygon', 'litecoin', 'uniswap', 'stellar', 'near',
  'injective-protocol', 'render-token', 'the-graph', 'sui', 'pepe',
];

const COIN_NAMES: Record<string, string> = {
  bitcoin: 'Bitcoin', ethereum: 'Ethereum', binancecoin: 'BNB', solana: 'Solana',
  ripple: 'XRP', cardano: 'Cardano', dogecoin: 'Dogecoin', polkadot: 'Polkadot',
  'avalanche-2': 'Avalanche', chainlink: 'Chainlink', polygon: 'Polygon',
  litecoin: 'Litecoin', uniswap: 'Uniswap', stellar: 'Stellar', near: 'NEAR',
  'injective-protocol': 'Injective', 'render-token': 'Render',
  'the-graph': 'The Graph', sui: 'Sui', pepe: 'PEPE',
};

// ─── Cache ──────────────────────────────────────────────────────
let cryptoCache: CryptoData[] = [];
let cryptoCacheTime = 0;
let fdCache: FDRate[] = [];
let sipCache: SIPFund[] = [];
let sipCacheTime = 0;
const CRYPTO_TTL = 60_000;  // 60s
const SIP_TTL = 300_000;    // 5min

// ─── Fetch Crypto from CoinGecko ────────────────────────────────
export async function fetchCryptoPrices(): Promise<CryptoData[]> {
  const now = Date.now();
  if (cryptoCache.length > 0 && (now - cryptoCacheTime) < CRYPTO_TTL) return cryptoCache;

  try {
    const ids = COINGECKO_IDS.join(',');
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&ids=${ids}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h,7d`;
    
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!res.ok) {
      console.warn(`[Market] CoinGecko ${res.status}, trying offline cache`);
      const cached = await getCryptoCache();
      if (cached && cached.length > 0) {
        console.log('[Market] Using offline crypto cache');
        return cached;
      }
      return cryptoCache;
    }

    const data = await res.json();
    cryptoCache = data.map((coin: any) => ({
      symbol: coin.symbol?.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceINR: coin.current_price,
      change24h: coin.price_change_percentage_24h || 0,
      change7d: coin.price_change_percentage_7d_in_currency || 0,
      marketCap: coin.market_cap || 0,
      volume24h: coin.total_volume || 0,
      image: coin.image,
      rank: coin.market_cap_rank,
    }));
    cryptoCacheTime = now;
    
    // Persist to AsyncStorage for offline access
    await setCryptoCache(cryptoCache);
    
    console.log(`[Market] Crypto: ${cryptoCache.length} coins loaded`);
    return cryptoCache;
  } catch (e) {
    console.error('[Market] Crypto fetch error:', e);
    // Try offline cache on network error
    const cached = await getCryptoCache();
    if (cached && cached.length > 0) {
      console.log('[Market] Network error - using offline crypto cache');
      return cached;
    }
    return cryptoCache;
  }
}

// ─── FD Rates (static authoritative data, Apr 2026) ─────────────
export function getFDRates(): FDRate[] {
  if (fdCache.length > 0) return fdCache;

  const banks = [
    { id: 'suryoday', name: 'Suryoday Small Finance Bank', short: 'Suryoday SFB', type: 'sfb' as const, rate: 9.10, senior: 9.60, min: 5000 },
    { id: 'utkarsh', name: 'Utkarsh Small Finance Bank', short: 'Utkarsh SFB', type: 'sfb' as const, rate: 8.50, senior: 9.00, min: 1000 },
    { id: 'equitas', name: 'Equitas Small Finance Bank', short: 'Equitas SFB', type: 'sfb' as const, rate: 8.25, senior: 8.75, min: 5000 },
    { id: 'au', name: 'AU Small Finance Bank', short: 'AU SFB', type: 'sfb' as const, rate: 8.00, senior: 8.50, min: 1000 },
    { id: 'indusind', name: 'IndusInd Bank', short: 'IndusInd', type: 'private' as const, rate: 7.99, senior: 8.49, min: 10000 },
    { id: 'yes', name: 'Yes Bank', short: 'Yes Bank', type: 'private' as const, rate: 7.75, senior: 8.25, min: 10000 },
    { id: 'kotak', name: 'Kotak Mahindra Bank', short: 'Kotak', type: 'private' as const, rate: 7.40, senior: 7.90, min: 5000 },
    { id: 'axis', name: 'Axis Bank', short: 'Axis', type: 'private' as const, rate: 7.10, senior: 7.60, min: 5000 },
    { id: 'hdfc', name: 'HDFC Bank', short: 'HDFC', type: 'private' as const, rate: 7.10, senior: 7.60, min: 5000 },
    { id: 'icici', name: 'ICICI Bank', short: 'ICICI', type: 'private' as const, rate: 7.10, senior: 7.60, min: 10000 },
    { id: 'bob', name: 'Bank of Baroda', short: 'BoB', type: 'psu' as const, rate: 6.85, senior: 7.35, min: 1000 },
    { id: 'canara', name: 'Canara Bank', short: 'Canara', type: 'psu' as const, rate: 6.85, senior: 7.35, min: 1000 },
    { id: 'sbi', name: 'State Bank of India', short: 'SBI', type: 'psu' as const, rate: 6.80, senior: 7.30, min: 1000 },
    { id: 'pnb', name: 'Punjab National Bank', short: 'PNB', type: 'psu' as const, rate: 6.80, senior: 7.30, min: 1000 },
  ];

  fdCache = banks.map(b => ({
    bankId: b.id, bankName: b.name, bankShort: b.short, type: b.type,
    rate: b.rate, seniorRate: b.senior, tenure: '1y', minDeposit: b.min,
  }));
  return fdCache;
}

// ─── SIP NAV from AMFI ──────────────────────────────────────────
const SIP_SCHEME_CODES = [
  { code: '119598', name: 'Mirae Asset Large Cap', category: 'Large Cap', risk: 'Moderate', minSIP: 500 },
  { code: '118989', name: 'SBI Blue Chip Fund', category: 'Large Cap', risk: 'Moderate', minSIP: 500 },
  { code: '119152', name: 'HDFC Mid-Cap Opportunities', category: 'Mid Cap', risk: 'High', minSIP: 500 },
  { code: '125307', name: 'Axis Small Cap Fund', category: 'Small Cap', risk: 'Very High', minSIP: 500 },
  { code: '100119', name: 'Parag Parikh Flexi Cap', category: 'Flexi Cap', risk: 'Moderate-High', minSIP: 1000 },
  { code: '120716', name: 'UTI Nifty 50 Index', category: 'Index', risk: 'Moderate', minSIP: 500 },
  { code: '119775', name: 'Mirae Asset Tax Saver', category: 'ELSS', risk: 'High', minSIP: 500 },
  { code: '120828', name: 'Nippon India Small Cap', category: 'Small Cap', risk: 'Very High', minSIP: 100 },
];

export async function fetchSIPNav(): Promise<SIPFund[]> {
  const now = Date.now();
  if (sipCache.length > 0 && (now - sipCacheTime) < SIP_TTL) return sipCache;

  const results: SIPFund[] = [];
  
  for (const scheme of SIP_SCHEME_CODES) {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${scheme.code}/latest`, {
        signal: AbortSignal.timeout(8000), // 8s timeout per fund
      });
      if (!res.ok) continue;
      const data = await res.json();
      const latest = data?.data?.[0];
      if (latest) {
        results.push({
          schemeCode: scheme.code,
          schemeName: data.meta?.scheme_name || scheme.name,
          nav: parseFloat(latest.nav) || 0,
          date: latest.date || '',
          category: scheme.category,
          risk: scheme.risk,
          minSIP: scheme.minSIP,
        });
      }
    } catch (e) {
      console.warn(`[Market] SIP ${scheme.code} fetch error`);
    }
  }

  if (results.length > 0) {
    sipCache = results;
    sipCacheTime = now;
    // Persist to AsyncStorage for offline access
    await setSIPCache(sipCache);
    console.log(`[Market] SIP: ${results.length} funds loaded`);
  } else {
    // Try offline cache on fetch failure
    const cached = await getSIPCache();
    if (cached && cached.length > 0) {
      sipCache = cached;
      console.log('[Market] SIP fetch failed - using offline cache');
    }
  }
  return sipCache;
}

// ─── Format Helpers ─────────────────────────────────────────────
export function formatPrice(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  if (amount >= 1) return `₹${amount.toFixed(2)}`;
  return `₹${amount.toFixed(6)}`;
}

export function formatMarketCap(amount: number): string {
  if (!amount) return '--';
  if (amount >= 1e12) return `₹${(amount / 1e12).toFixed(1)}T`;
  if (amount >= 1e9) return `₹${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(1)}Cr`;
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatChange(change: number): string {
  const arrow = change >= 0 ? '▲' : '▼';
  return `${arrow} ${Math.abs(change).toFixed(2)}%`;
}
