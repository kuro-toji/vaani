// ═══════════════════════════════════════════════════════════════════
// VAANI Sync Service — SQLite ↔ Supabase Bidirectional Sync
// ═══════════════════════════════════════════════════════════════════
//
// The web app uses these Supabase tables:
//   - profiles       (id, preferred_lang, vaani_score)
//   - portfolios     (id, user_id, type='fd'|'sip'|'crypto', bank, fund, coin, ...)
//   - transactions   (id, user_id, date, description, amount, type, category)
//
// The APK uses separate SQLite tables (expenses, fd_investments, sip_investments, etc.)
// This service maps between them for real-time bidirectional sync.
// ═══════════════════════════════════════════════════════════════════

import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { supabase } from './supabase';
import * as DB from '../database';
import { useFinanceStore } from '../stores/useFinanceStore';
import { API_CONFIG } from '../constants';

let syncInProgress = false;
let realtimeChannel: any = null;
let appStateListener: any = null;
let netInfoUnsubscribe: (() => void) | null = null;

// ─── Check if Supabase is configured ────────────────────────────
function isSupabaseReady(): boolean {
  return !!(API_CONFIG.SUPABASE_URL && API_CONFIG.SUPABASE_ANON_KEY &&
    !API_CONFIG.SUPABASE_URL.includes('placeholder'));
}

// ═══════════════════════════════════════════════════════════════════
// PUSH: SQLite → Supabase (Upload local changes)
// ═══════════════════════════════════════════════════════════════════

export async function pushToCloud(userId: string): Promise<{ pushed: number; errors: number }> {
  if (!isSupabaseReady() || syncInProgress) return { pushed: 0, errors: 0 };

  syncInProgress = true;
  let pushed = 0;
  let errors = 0;

  try {
    const queue = await DB.getSyncQueue();
    console.log(`[Sync] Push: ${queue.length} items in queue`);

    for (const item of queue) {
      try {
        const data = JSON.parse(item.data);

        switch (item.table_name) {
          case 'expenses':
            await syncExpenseToCloud(item.operation, data, userId);
            break;
          case 'fd_investments':
            await syncFDToCloud(item.operation, data, userId);
            break;
          case 'sip_investments':
            await syncSIPToCloud(item.operation, data, userId);
            break;
          case 'savings_goals':
            await syncSavingsToCloud(item.operation, data, userId);
            break;
          case 'crypto_wallets':
            await syncCryptoToCloud(item.operation, data, userId);
            break;
          default:
            console.warn(`[Sync] Unknown table: ${item.table_name}`);
        }

        // Remove from queue on success
        await DB.removeSyncItem(item.id);
        pushed++;
      } catch (error) {
        console.error(`[Sync] Push error for ${item.id}:`, error);
        errors++;
      }
    }
  } catch (error) {
    console.error('[Sync] Push failed:', error);
  } finally {
    syncInProgress = false;
  }

  console.log(`[Sync] Push complete: ${pushed} pushed, ${errors} errors`);
  return { pushed, errors };
}

// ─── Map expense → transactions table ───────────────────────────
async function syncExpenseToCloud(op: string, data: any, userId: string) {
  if (op === 'delete') {
    await supabase.from('transactions').delete().eq('id', data.id);
    return;
  }

  const row = {
    id: data.id,
    user_id: userId,
    date: data.date || new Date().toISOString(),
    description: data.description || '',
    amount: data.type === 'income' ? Math.abs(data.amount) : -Math.abs(data.amount),
    type: data.type === 'income' ? 'credit' : 'debit',
    category: data.category || 'other',
  };

  const { error } = await supabase.from('transactions').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

// ─── Map FD → portfolios table (type='fd') ──────────────────────
async function syncFDToCloud(op: string, data: any, userId: string) {
  if (op === 'delete') {
    await supabase.from('portfolios').delete().eq('id', data.id);
    return;
  }

  const row = {
    id: data.id,
    user_id: userId,
    type: 'fd',
    bank: data.bank,
    principal: data.principal,
    current_value: data.current_value || data.principal,
    rate: data.rate,
    maturity_date: data.maturity_date,
    tenure_months: data.tenure_months,
    start_date: data.start_date,
  };

  const { error } = await supabase.from('portfolios').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

// ─── Map SIP → portfolios table (type='sip') ────────────────────
async function syncSIPToCloud(op: string, data: any, userId: string) {
  if (op === 'delete') {
    await supabase.from('portfolios').delete().eq('id', data.id);
    return;
  }

  const row = {
    id: data.id,
    user_id: userId,
    type: 'sip',
    fund: data.fund,
    institution: data.institution || '',
    principal: data.principal || data.monthly,
    current_value: data.current_value || data.monthly,
    monthly: data.monthly,
    units: data.units || 0,
    nav: data.nav || 0,
    start_date: data.start_date,
  };

  const { error } = await supabase.from('portfolios').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

// ─── Map savings goals → Supabase ───────────────────────────────
async function syncSavingsToCloud(op: string, data: any, userId: string) {
  if (op === 'delete') {
    await supabase.from('savings_goals').delete().eq('id', data.id);
    return;
  }

  const row = {
    id: data.id,
    user_id: userId,
    name: data.name,
    icon: data.icon || 'piggy-bank',
    target_amount: data.target_amount,
    current_amount: data.current_amount || 0,
    deadline: data.deadline,
  };

  const { error } = await supabase.from('savings_goals').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

// ─── Map crypto → portfolios table (type='crypto') ──────────────
async function syncCryptoToCloud(op: string, data: any, userId: string) {
  if (op === 'delete') {
    await supabase.from('portfolios').delete().eq('id', data.id);
    return;
  }

  const row = {
    id: data.id,
    user_id: userId,
    type: 'crypto',
    coin: data.coin,
    symbol: data.symbol,
    amount: data.amount,
    current_value: data.current_value_inr || 0,
    buy_price: data.buy_price,
    blockchain: data.blockchain || 'ethereum',
  };

  const { error } = await supabase.from('portfolios').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════════
// PULL: Supabase → SQLite (Download cloud changes)
// ═══════════════════════════════════════════════════════════════════

export async function pullFromCloud(userId: string): Promise<{ pulled: number }> {
  if (!isSupabaseReady()) return { pulled: 0 };

  let pulled = 0;

  try {
    // Pull portfolios
    const { data: portfolios, error: pfError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);

    if (!pfError && portfolios) {
      for (const p of portfolios) {
        try {
          switch (p.type) {
            case 'fd':
              await upsertFDLocally(p, userId);
              pulled++;
              break;
            case 'sip':
              await upsertSIPLocally(p, userId);
              pulled++;
              break;
            case 'crypto':
              await upsertCryptoLocally(p, userId);
              pulled++;
              break;
          }
        } catch (e) {
          console.error('[Sync] Pull portfolio item error:', e);
        }
      }
    }

    // Pull transactions → expenses
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100);

    if (!txError && transactions) {
      for (const tx of transactions) {
        try {
          await upsertExpenseLocally(tx, userId);
          pulled++;
        } catch (e) {
          console.error('[Sync] Pull transaction error:', e);
        }
      }
    }

    // Pull profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      await DB.setSetting('preferred_lang', profile.preferred_lang || 'hi');
      await DB.setSetting('vaani_score', String(profile.vaani_score || 0));
    }

    console.log(`[Sync] Pulled ${pulled} items from cloud`);
  } catch (error) {
    console.error('[Sync] Pull failed:', error);
  }

  return { pulled };
}

// ─── Upsert helpers (cloud → local) ─────────────────────────────
async function upsertFDLocally(p: any, userId: string) {
  const db = DB.getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO fd_investments (id, user_id, bank, principal, current_value, rate, maturity_date, tenure_months, start_date, synced)
     VALUES (?,?,?,?,?,?,?,?,?,1)`,
    [p.id, userId, p.bank || '', p.principal || 0, p.current_value || p.principal || 0,
     p.rate || 0, p.maturity_date || '', p.tenure_months || 12, p.start_date || '']
  );
}

async function upsertSIPLocally(p: any, userId: string) {
  const db = DB.getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO sip_investments (id, user_id, fund, institution, principal, current_value, monthly, units, nav, start_date, synced)
     VALUES (?,?,?,?,?,?,?,?,?,?,1)`,
    [p.id, userId, p.fund || '', p.institution || '', p.principal || 0,
     p.current_value || 0, p.monthly || 0, p.units || 0, p.nav || 0, p.start_date || '']
  );
}

async function upsertCryptoLocally(p: any, userId: string) {
  const db = DB.getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO crypto_wallets (id, user_id, coin, symbol, amount, current_value_inr, buy_price, blockchain, synced)
     VALUES (?,?,?,?,?,?,?,?,1)`,
    [p.id, userId, p.coin || '', p.symbol || '', p.amount || 0,
     p.current_value || 0, p.buy_price || 0, p.blockchain || 'ethereum']
  );
}

async function upsertExpenseLocally(tx: any, userId: string) {
  const db = DB.getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO expenses (id, user_id, description, amount, category, type, date, synced)
     VALUES (?,?,?,?,?,?,?,1)`,
    [tx.id, userId, tx.description || '', Math.abs(tx.amount || 0),
     tx.category || 'other', tx.type === 'credit' ? 'income' : 'expense',
     tx.date ? tx.date.split('T')[0] : new Date().toISOString().split('T')[0]]
  );
}

// ═══════════════════════════════════════════════════════════════════
// FULL SYNC (Push + Pull)
// ═══════════════════════════════════════════════════════════════════

export async function fullSync(userId: string): Promise<void> {
  if (!isSupabaseReady() || !userId || userId === 'demo_user') {
    console.log('[Sync] Skipped — no Supabase or demo user');
    return;
  }

  console.log('[Sync] Starting full sync for user:', userId);

  // Push local changes first (local wins for pending items)
  await pushToCloud(userId);

  // Then pull cloud changes (server wins for everything else)
  await pullFromCloud(userId);

  // Refresh the store
  try {
    useFinanceStore.getState().loadAll(userId);
  } catch {}

  console.log('[Sync] Full sync complete');
}

// ═══════════════════════════════════════════════════════════════════
// REALTIME: Supabase Realtime subscription for live updates
// ═══════════════════════════════════════════════════════════════════

export function subscribeToRealtime(userId: string): void {
  if (!isSupabaseReady() || !userId || userId === 'demo_user') return;

  // Unsubscribe from previous
  unsubscribeRealtime();

  console.log('[Sync] Subscribing to realtime for user:', userId);

  realtimeChannel = supabase
    .channel(`user_${userId}`)
    // Listen to portfolio changes
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'portfolios', filter: `user_id=eq.${userId}` },
      async (payload: any) => {
        console.log('[Sync] Realtime portfolio change:', payload.eventType);
        try {
          if (payload.eventType === 'DELETE') {
            // Remove from local DB
            const id = payload.old?.id;
            if (id) {
              const db = DB.getDB();
              await db.runAsync(`DELETE FROM fd_investments WHERE id = ?`, [id]);
              await db.runAsync(`DELETE FROM sip_investments WHERE id = ?`, [id]);
              await db.runAsync(`DELETE FROM crypto_wallets WHERE id = ?`, [id]);
            }
          } else {
            const row = payload.new;
            if (row) {
              switch (row.type) {
                case 'fd': await upsertFDLocally(row, userId); break;
                case 'sip': await upsertSIPLocally(row, userId); break;
                case 'crypto': await upsertCryptoLocally(row, userId); break;
              }
            }
          }
          // Refresh store
          useFinanceStore.getState().loadAll(userId);
        } catch (error) {
          console.error('[Sync] Realtime handler error:', error);
        }
      }
    )
    // Listen to transaction changes
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
      async (payload: any) => {
        console.log('[Sync] Realtime transaction change:', payload.eventType);
        try {
          if (payload.eventType === 'DELETE') {
            const id = payload.old?.id;
            if (id) {
              await DB.getDB().runAsync(`DELETE FROM expenses WHERE id = ?`, [id]);
            }
          } else if (payload.new) {
            await upsertExpenseLocally(payload.new, userId);
          }
          useFinanceStore.getState().loadAll(userId);
        } catch (error) {
          console.error('[Sync] Realtime tx handler error:', error);
        }
      }
    )
    .subscribe((status: string) => {
      console.log('[Sync] Realtime status:', status);
    });
}

export function unsubscribeRealtime(): void {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// BACKGROUND SYNC: Auto-sync on app foreground + network change
// ═══════════════════════════════════════════════════════════════════

export function startBackgroundSync(userId: string): void {
  if (!userId || userId === 'demo_user') return;

  // Sync when app comes to foreground
  appStateListener = AppState.addEventListener('change', async (state: AppStateStatus) => {
    if (state === 'active') {
      console.log('[Sync] App foregrounded, syncing...');
      await fullSync(userId);
    }
  });

  // Sync when network comes back online
  netInfoUnsubscribe = NetInfo.addEventListener(async (state: NetInfoState) => {
    if (state.isConnected && state.isInternetReachable) {
      const unsyncedCount = await DB.getUnsyncedCount();
      if (unsyncedCount > 0) {
        console.log(`[Sync] Network restored, pushing ${unsyncedCount} items...`);
        await pushToCloud(userId);
      }
    }
  });

  // Subscribe to realtime
  subscribeToRealtime(userId);

  // Initial sync
  fullSync(userId);

  console.log('[Sync] Background sync started for user:', userId);
}

export function stopBackgroundSync(): void {
  if (appStateListener) {
    appStateListener.remove();
    appStateListener = null;
  }
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
  unsubscribeRealtime();
  console.log('[Sync] Background sync stopped');
}

// ═══════════════════════════════════════════════════════════════════
// PROFILE SYNC: Push user settings to Supabase profiles table
// ═══════════════════════════════════════════════════════════════════

export async function syncProfileToCloud(userId: string, updates: {
  preferred_lang?: string;
  pincode?: string;
}): Promise<void> {
  if (!isSupabaseReady() || !userId || userId === 'demo_user') return;

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates }, { onConflict: 'id' });

    if (error) {
      console.error('[Sync] Profile sync error:', error);
    }
  } catch (error) {
    console.error('[Sync] Profile sync failed:', error);
  }
}

// ─── Get Sync Status ────────────────────────────────────────────
export async function getSyncStatus(): Promise<{
  pendingCount: number;
  lastSync: string | null;
  isOnline: boolean;
}> {
  const pendingCount = await DB.getUnsyncedCount();
  const lastSync = await DB.getSetting('last_sync_at');
  const netState = await NetInfo.fetch();

  return {
    pendingCount,
    lastSync,
    isOnline: netState.isConnected === true,
  };
}
