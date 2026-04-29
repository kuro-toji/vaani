// ═══════════════════════════════════════════════════════════════════
// VAANI Idle Money Service — Production Ready
// Connects to Supabase for real user data
// ═══════════════════════════════════════════════════════════════════
import { supabase } from '../lib/supabase.js';

// ─── Calculate Idle Money from User's Bank Balance ──────────────
// idleMoney = totalBalance - emergencyFund - monthlyBudget - emiBuffer
export function calculateIdleMoney(userData) {
  const {
    totalBankBalance = 0,
    emergencyFundBuffer = 50000,
    monthlyBudget = 30000,
    upcomingEMI = 0,
    savingsGoals = 0,
    lockedInvestments = 0,
  } = userData;

  const reservedAmount = emergencyFundBuffer + (monthlyBudget * 2) + upcomingEMI + savingsGoals + lockedInvestments;
  const idleAmount = Math.max(0, totalBankBalance - reservedAmount);

  return {
    totalBalance: totalBankBalance,
    reservedAmount,
    idleAmount,
    suggestion: idleAmount > 5000 
      ? `₹${idleAmount.toLocaleString('en-IN')} ko liquid fund mein lagaayein toh ₹${Math.round(idleAmount * 0.06 / 12).toLocaleString('en-IN')}/mahina extra milega`
      : null,
  };
}

// ─── Get Liquid Fund Recommendation ──────────────────────────────
export function getLiquidFundRecommendation(idleAmount) {
  if (idleAmount < 5000) return null;

  return {
    fundName: 'SBI Liquid Fund',
    fundCode: 103438,
    expectedReturn: 6.5,
    risk: 'Very Low',
    minAmount: 500,
    link: 'https://groww.in/live-funds/sbi-liquid-fund-direct-growth',
  };
}

// ─── Save Idle Money Log to Supabase ────────────────────────────
export async function saveIdleMoneyLog(userId, idleData, actionTaken = 'pending') {
  try {
    const { data, error } = await supabase
      .from('idle_money_logs')
      .insert({
        user_id: userId,
        total_balance: idleData.totalBalance,
        reserved_amount: idleData.reservedAmount,
        idle_amount: idleData.idleAmount,
        suggestion_text: idleData.suggestion,
        action_taken: actionTaken,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[IdleMoney] Save error:', error);
    return { success: false, error };
  }
}

// ─── Get Idle Money History ─────────────────────────────────────
export async function getIdleMoneyHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('idle_money_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('[IdleMoney] Fetch error:', error);
    return { success: false, data: [] };
  }
}

// ─── Update Idle Money Action ────────────────────────────────────
export async function updateIdleMoneyAction(logId, action) {
  try {
    const { data, error } = await supabase
      .from('idle_money_logs')
      .update({ action_taken: action })
      .eq('id', logId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('[IdleMoney] Update error:', error);
    return { success: false, error };
  }
}

// ─── Format Idle Money Alert ─────────────────────────────────────
export function formatIdleMoneyAlert(idleData, lang = 'en') {
  if (!idleData.suggestion) return null;

  if (lang === 'hi') {
    return `💰 Aapke account mein ₹${idleData.idleAmount.toLocaleString('en-IN')} baith ke khaali hai. Liquid fund mein lagaayein toh mahine mein ₹${Math.round(idleData.idleAmount * 0.06 / 12).toLocaleString('en-IN')} extra milega!`;
  }

  return `💰 You have ₹${idleData.idleAmount.toLocaleString('en-IN')} idle. Put it in liquid fund to earn ₹${Math.round(idleData.idleAmount * 0.06 / 12).toLocaleString('en-IN')}/month extra!`;
}

export default {
  calculateIdleMoney,
  getLiquidFundRecommendation,
  saveIdleMoneyLog,
  getIdleMoneyHistory,
  updateIdleMoneyAction,
  formatIdleMoneyAlert,
};