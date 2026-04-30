// ═══════════════════════════════════════════════════════════════════
// VAANI Cache Service — AsyncStorage for offline data persistence
// Caches crypto prices, SIP NAV, and user preferences
// ═══════════════════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CRYPTO_CACHE: '@vani_crypto_cache',
  SIP_CACHE: '@vani_sip_cache',
  FD_RATES_CACHE: '@vani_fd_rates_cache',
  USER_PREFS: '@vani_user_prefs',
  PRICE_ALERTS: '@vani_price_alerts',
  LAST_UPDATE: '@vani_last_update',
};

interface CryptoCache {
  data: any[];
  timestamp: number;
}

interface SIPCache {
  data: any[];
  timestamp: number;
}

interface PriceAlert {
  symbol: string;
  targetPrice: number;
  direction: 'above' | 'below';
  enabled: boolean;
}

// ─── Crypto Cache ────────────────────────────────────────────────
export async function setCryptoCache(data: any[]): Promise<void> {
  try {
    const cache: CryptoCache = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(KEYS.CRYPTO_CACHE, JSON.stringify(cache));
    await AsyncStorage.setItem(KEYS.LAST_UPDATE, new Date().toISOString());
  } catch (e) {
    console.error('[Cache] Crypto save error:', e);
  }
}

export async function getCryptoCache(): Promise<any[] | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CRYPTO_CACHE);
    if (!raw) return null;
    
    const cache: CryptoCache = JSON.parse(raw);
    // Cache valid for 5 minutes
    if (Date.now() - cache.timestamp > 300000) {
      console.log('[Cache] Crypto expired, needs refresh');
      return null;
    }
    return cache.data;
  } catch (e) {
    console.error('[Cache] Crypto read error:', e);
    return null;
  }
}

// ─── SIP Cache ──────────────────────────────────────────────────
export async function setSIPCache(data: any[]): Promise<void> {
  try {
    const cache: SIPCache = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(KEYS.SIP_CACHE, JSON.stringify(cache));
  } catch (e) {
    console.error('[Cache] SIP save error:', e);
  }
}

export async function getSIPCache(): Promise<any[] | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SIP_CACHE);
    if (!raw) return null;
    
    const cache: SIPCache = JSON.parse(raw);
    // Cache valid for 30 minutes
    if (Date.now() - cache.timestamp > 1800000) {
      return null;
    }
    return cache.data;
  } catch (e) {
    console.error('[Cache] SIP read error:', e);
    return null;
  }
}

// ─── Price Alerts ───────────────────────────────────────────────
export async function setPriceAlerts(alerts: PriceAlert[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PRICE_ALERTS, JSON.stringify(alerts));
  } catch (e) {
    console.error('[Cache] Price alerts save error:', e);
  }
}

export async function getPriceAlerts(): Promise<PriceAlert[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PRICE_ALERTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('[Cache] Price alerts read error:', e);
    return [];
  }
}

export async function addPriceAlert(alert: PriceAlert): Promise<void> {
  const alerts = await getPriceAlerts();
  alerts.push(alert);
  await setPriceAlerts(alerts);
}

export async function removePriceAlert(symbol: string): Promise<void> {
  const alerts = await getPriceAlerts();
  const filtered = alerts.filter(a => a.symbol !== symbol);
  await setPriceAlerts(filtered);
}

// ─── User Preferences ───────────────────────────────────────────
interface UserPrefs {
  language: string;
  voiceEnabled: boolean;
  accessibilityMode: 'none' | 'visual' | 'illiterate';
  notificationsEnabled: boolean;
}

const DEFAULT_PREFS: UserPrefs = {
  language: 'hi',
  voiceEnabled: true,
  accessibilityMode: 'none',
  notificationsEnabled: true,
};

export async function setUserPrefs(prefs: Partial<UserPrefs>): Promise<void> {
  try {
    const current = await getUserPrefs();
    const merged = { ...current, ...prefs };
    await AsyncStorage.setItem(KEYS.USER_PREFS, JSON.stringify(merged));
  } catch (e) {
    console.error('[Cache] User prefs save error:', e);
  }
}

export async function getUserPrefs(): Promise<UserPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER_PREFS);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('[Cache] User prefs read error:', e);
    return DEFAULT_PREFS;
  }
}

// ─── Clear All Cache ────────────────────────────────────────────
export async function clearAllCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEYS.CRYPTO_CACHE,
      KEYS.SIP_CACHE,
      KEYS.FD_RATES_CACHE,
    ]);
    console.log('[Cache] All cleared');
  } catch (e) {
    console.error('[Cache] Clear error:', e);
  }
}

// ─── Get Last Update Time ────────────────────────────────────────
export async function getLastUpdate(): Promise<string | null> {
  return await AsyncStorage.getItem(KEYS.LAST_UPDATE);
}