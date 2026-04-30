// ═══════════════════════════════════════════════════════════════════
// VAANI Binance Service v2 — Extended Crypto Data
// Market Cap, Volume, Supply from CoinGecko (free) + Binance prices
// ═══════════════════════════════════════════════════════════════════

const BINANCE_API = 'https://api.binance.com/api/v3';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// USD/INR rate cache
let usdToInrRate = 83.5;
let lastRateUpdate = 0;
const RATE_TTL = 60 * 60 * 1000;

// CoinGecko metadata cache
let coinMetaCache = {};
let lastMetaUpdate = 0;
const META_TTL = 30 * 60 * 1000; // 30 min

// ─── USD → INR Rate ─────────────────────────────────────────────
export async function fetchUSDToINRRate() {
  if (Date.now() - lastRateUpdate < RATE_TTL && usdToInrRate > 0) return usdToInrRate;
  try {
    const r = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!r.ok) throw new Error('rate fetch failed');
    const d = await r.json();
    if (d.rates?.INR) { usdToInrRate = d.rates.INR; lastRateUpdate = Date.now(); }
    console.log('[Binance] USD/INR rate:', usdToInrRate);
  } catch (e) { console.warn('[Binance] USD/INR fallback:', usdToInrRate); }
  return usdToInrRate;
}

// ─── Popular Symbols ─────────────────────────────────────────────
export const POPULAR_SYMBOLS = [
  'BTCUSDT','ETHUSDT','BNBUSDT','XRPUSDT','ADAUSDT','SOLUSDT',
  'DOGEUSDT','LTCUSDT','DOTUSDT','MATICUSDT','AVAXUSDT','LINKUSDT',
  'SHIBUSDT','UNIUSDT','ATOMUSDT','TRXUSDT','NEARUSDT','AAVEUSDT',
  'OPUSDT','ARBUSDT',
];

const COIN_META = {
  BTC:  { name:'Bitcoin',   icon:'₿', geckoId:'bitcoin',        created:'2009-01-03', category:'Layer 1' },
  ETH:  { name:'Ethereum',  icon:'Ξ', geckoId:'ethereum',       created:'2015-07-30', category:'Layer 1' },
  BNB:  { name:'BNB',       icon:'🔶', geckoId:'binancecoin',    created:'2017-07-25', category:'Exchange' },
  XRP:  { name:'XRP',       icon:'✕', geckoId:'ripple',          created:'2012-01-01', category:'Payments' },
  ADA:  { name:'Cardano',   icon:'🔵', geckoId:'cardano',        created:'2017-09-29', category:'Layer 1' },
  SOL:  { name:'Solana',    icon:'🟣', geckoId:'solana',          created:'2020-03-16', category:'Layer 1' },
  DOGE: { name:'Dogecoin',  icon:'🐕', geckoId:'dogecoin',       created:'2013-12-06', category:'Meme' },
  LTC:  { name:'Litecoin',  icon:'Ł', geckoId:'litecoin',        created:'2011-10-07', category:'Payments' },
  DOT:  { name:'Polkadot',  icon:'⬟', geckoId:'polkadot',       created:'2020-05-26', category:'Layer 0' },
  MATIC:{ name:'Polygon',   icon:'🟪', geckoId:'matic-network',  created:'2019-04-26', category:'Layer 2' },
  AVAX: { name:'Avalanche', icon:'🔺', geckoId:'avalanche-2',    created:'2020-09-21', category:'Layer 1' },
  LINK: { name:'Chainlink', icon:'⬡', geckoId:'chainlink',      created:'2017-09-19', category:'Oracle' },
  SHIB: { name:'Shiba Inu', icon:'🐶', geckoId:'shiba-inu',      created:'2020-08-01', category:'Meme' },
  UNI:  { name:'Uniswap',   icon:'🦄', geckoId:'uniswap',        created:'2020-09-17', category:'DeFi' },
  ATOM: { name:'Cosmos',    icon:'⚛️', geckoId:'cosmos',          created:'2019-03-14', category:'Layer 0' },
  TRX:  { name:'TRON',      icon:'🔴', geckoId:'tron',            created:'2017-08-28', category:'Layer 1' },
  NEAR: { name:'NEAR',      icon:'🟢', geckoId:'near',            created:'2020-04-22', category:'Layer 1' },
  AAVE: { name:'Aave',      icon:'👻', geckoId:'aave',            created:'2020-10-02', category:'DeFi' },
  OP:   { name:'Optimism',  icon:'🔴', geckoId:'optimism',        created:'2022-05-31', category:'Layer 2' },
  ARB:  { name:'Arbitrum',  icon:'🔵', geckoId:'arbitrum',        created:'2023-03-23', category:'Layer 2' },
};

// ─── Fetch CoinGecko Extended Data (market cap, supply, ATH) ────
async function fetchCoinGeckoMeta() {
  if (Date.now() - lastMetaUpdate < META_TTL && Object.keys(coinMetaCache).length > 0) return coinMetaCache;
  
  const ids = Object.values(COIN_META).map(c => c.geckoId).join(',');
  try {
    const r = await fetch(`${COINGECKO_API}/coins/markets?vs_currency=inr&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d`);
    if (!r.ok) throw new Error(`CoinGecko ${r.status}`);
    const data = await r.json();
    
    for (const coin of data) {
      coinMetaCache[coin.symbol.toUpperCase()] = {
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        totalVolume: coin.total_volume,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        maxSupply: coin.max_supply,
        ath: coin.ath,
        athDate: coin.ath_date,
        athChangePercent: coin.ath_change_percentage,
        change1h: coin.price_change_percentage_1h_in_currency,
        change24h: coin.price_change_percentage_24h_in_currency,
        change7d: coin.price_change_percentage_7d_in_currency,
        image: coin.image,
      };
    }
    lastMetaUpdate = Date.now();
    console.log('[CoinGecko] Fetched metadata for', data.length, 'coins');
  } catch (e) {
    console.warn('[CoinGecko] Meta fetch failed:', e.message);
  }
  return coinMetaCache;
}

// ─── Fetch 24h Ticker from Binance ──────────────────────────────
export async function fetch24hTicker(symbol) {
  try {
    const r = await fetch(`${BINANCE_API}/ticker/24hr?symbol=${symbol}`);
    if (!r.ok) return null;
    const d = await r.json();
    const inr = await fetchUSDToINRRate();
    const priceUSD = parseFloat(d.lastPrice || 0);
    const base = symbol.replace(/USDT$/, '');
    const meta = COIN_META[base] || {};
    
    return {
      symbol: d.symbol,
      baseAsset: base,
      coinName: meta.name || base,
      icon: meta.icon || '🪙',
      category: meta.category || 'Unknown',
      createdDate: meta.created || 'N/A',
      price: priceUSD,
      priceInINR: priceUSD * inr,
      change24h: parseFloat(d.priceChangePercent) || 0,
      high24h: parseFloat(d.highPrice) * inr,
      low24h: parseFloat(d.lowPrice) * inr,
      volume24h: parseFloat(d.volume),
      quoteVolume: parseFloat(d.quoteVolume),
      lastUpdated: new Date(),
    };
  } catch (e) {
    console.error(`[Binance] Ticker error ${symbol}:`, e.message);
    return null;
  }
}

// ─── Get Extended Crypto Data (Binance + CoinGecko) ─────────────
export async function getMultiplePrices(symbols = POPULAR_SYMBOLS) {
  // Fetch CoinGecko meta in parallel with Binance prices
  const [, geckoMeta] = await Promise.allSettled([
    fetchUSDToINRRate(),
    fetchCoinGeckoMeta(),
  ]);
  
  const meta = geckoMeta?.status === 'fulfilled' ? geckoMeta.value : coinMetaCache;
  const results = [];
  
  // Batch fetch from Binance (parallel, 5 at a time)
  const chunks = [];
  for (let i = 0; i < symbols.length; i += 5) chunks.push(symbols.slice(i, i + 5));
  
  for (const chunk of chunks) {
    const tickers = await Promise.allSettled(chunk.map(s => fetch24hTicker(s)));
    for (const t of tickers) {
      if (t.status === 'fulfilled' && t.value) {
        const base = t.value.baseAsset;
        const geckoData = meta[base] || {};
        results.push({
          ...t.value,
          marketCap: geckoData.marketCap || null,
          marketCapRank: geckoData.marketCapRank || null,
          totalVolume: geckoData.totalVolume || null,
          circulatingSupply: geckoData.circulatingSupply || null,
          totalSupply: geckoData.totalSupply || null,
          maxSupply: geckoData.maxSupply || null,
          ath: geckoData.ath || null,
          athDate: geckoData.athDate || null,
          athChangePercent: geckoData.athChangePercent || null,
          change1h: geckoData.change1h || null,
          change7d: geckoData.change7d || null,
          image: geckoData.image || null,
        });
      }
    }
  }
  
  return results;
}

// ─── Format Helpers ──────────────────────────────────────────────
export function formatCryptoPrice(price) {
  if (!price || isNaN(price)) return '₹--';
  if (price < 0.01) return `₹${price.toFixed(6)}`;
  if (price < 1) return `₹${price.toFixed(4)}`;
  if (price < 100) return `₹${price.toFixed(2)}`;
  return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function formatMarketCap(cap) {
  if (!cap) return '--';
  if (cap >= 1e12) return `₹${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `₹${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e7) return `₹${(cap / 1e7).toFixed(2)}Cr`;
  if (cap >= 1e5) return `₹${(cap / 1e5).toFixed(2)}L`;
  return `₹${cap.toLocaleString('en-IN')}`;
}

export function formatSupply(supply, symbol) {
  if (!supply) return '--';
  if (supply >= 1e9) return `${(supply / 1e9).toFixed(2)}B ${symbol}`;
  if (supply >= 1e6) return `${(supply / 1e6).toFixed(2)}M ${symbol}`;
  return `${supply.toLocaleString('en-IN')} ${symbol}`;
}

export function formatChange(change) {
  if (!change || isNaN(change)) return '0%';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export default {
  fetchUSDToINRRate, fetch24hTicker, getMultiplePrices, fetchCoinGeckoMeta,
  POPULAR_SYMBOLS, COIN_META,
  formatCryptoPrice, formatMarketCap, formatSupply, formatChange,
};