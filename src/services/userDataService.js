import { supabase } from '../lib/supabase';

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getUserFDs(userId) {
  const { data, error } = await supabase
    .from('fds')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('maturity_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getUserSIPs(userId) {
  const { data, error } = await supabase
    .from('sips')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');
  if (error) throw error;
  return data || [];
}

export async function getUserGoals(userId) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('target_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getUserCryptoWallets(userId) {
  const { data, error } = await supabase
    .from('crypto_wallets')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

export async function getMonthlyTransactions(userId, month) {
  const [year, monthNum] = month.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMonthlyBudget(userId, month) {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month);
  if (error) throw error;
  return data || [];
}

export async function getChatSessions(userId, limit = 10) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getChatMessages(sessionId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}