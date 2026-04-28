// ═══════════════════════════════════════════════════════════════════
// VAANI Spend Awareness Service
// Purchase intent check, opportunity cost, monthly summary
// Voice: "₹3,000 = 10 saal mein ₹18,000"
// ═══════════════════════════════════════════════════════════════════

import * as DB from '../database';
import type { PurchaseIntent, MonthlySpendSummary } from '../types';

const CAGR = 0.20; // 20% Indian equity average
const MIN_PURCHASE_CHECK = 500; // Only check purchases above ₹500
const ESSENTIAL_CATEGORIES = ['food', 'transport', 'utilities', 'health', 'rent', 'education'];

// ─── Purchase Intent Check ───────────────────────────────────────
export async function checkPurchaseIntent(userId: string, itemDescription: string, amount: number): Promise<{
  shouldAsk: boolean;
  opportunityCost10yr: number;
  voiceAlert: string;
  intentId: string;
}> {
  // Don't trigger for essentials or small amounts
  if (amount < MIN_PURCHASE_CHECK) {
    return { shouldAsk: false, opportunityCost10yr: 0, voiceAlert: '', intentId: '' };
  }

  // Check if category is essential
  const lower = itemDescription.toLowerCase();
  const isEssential = ESSENTIAL_CATEGORIES.some(c => {
    const keywords: Record<string, string[]> = {
      food: ['khana', 'grocery', 'doodh', 'sabzi', 'ration', 'food'],
      transport: ['petrol', 'diesel', 'bus', 'auto', 'metro', 'ticket'],
      utilities: ['bijli', 'pani', 'gas', 'recharge', 'wifi', 'bill'],
      health: ['dawai', 'doctor', 'hospital', 'medicine'],
      rent: ['kiraya', 'rent'],
      education: ['school', 'college', 'fees', 'book', 'tuition'],
    };
    return keywords[c]?.some(k => lower.includes(k));
  });

  if (isEssential) {
    return { shouldAsk: false, opportunityCost10yr: 0, voiceAlert: '', intentId: '' };
  }

  const opp10yr = Math.round(amount * Math.pow(1 + CAGR, 10));

  const intentId = await DB.addPurchaseIntent({
    user_id: userId, item_description: itemDescription, amount,
  });

  const voiceAlert = `Kya aap sure hain? Yeh ₹${amount.toLocaleString('en-IN')} agar 10 saal invest karo toh ₹${opp10yr.toLocaleString('en-IN')} ho jaata. Phir bhi kharidna hai?`;

  return { shouldAsk: true, opportunityCost10yr: opp10yr, voiceAlert, intentId };
}

// ─── Record Purchase Decision ────────────────────────────────────
export async function recordDecision(intentId: string, decision: 'bought' | 'skipped' | 'wishlist'): Promise<string> {
  let remindDate: string | undefined;
  if (decision === 'wishlist') {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    remindDate = d.toISOString().split('T')[0];
  }
  await DB.updatePurchaseDecision(intentId, decision, remindDate);

  if (decision === 'bought') return 'Theek hai, kharcha log kar diya.';
  if (decision === 'skipped') return 'Badhiya decision! Paisa bach gaya.';
  return 'Wishlist mein daal diya. 7 din baad yaad dilaaunga.';
}

// ─── Calculate Opportunity Cost ──────────────────────────────────
export function calculateOpportunityCost(amount: number, years: number = 10): {
  futureValue: number; multiplier: number; voiceExplanation: string;
} {
  const fv = Math.round(amount * Math.pow(1 + CAGR, years));
  const mult = Math.round((fv / amount) * 10) / 10;
  return {
    futureValue: fv, multiplier: mult,
    voiceExplanation: `₹${amount.toLocaleString('en-IN')} aaj = ₹${fv.toLocaleString('en-IN')} ${years} saal mein (${mult}x)`,
  };
}

// ─── Monthly Spend Summary ───────────────────────────────────────
export async function generateMonthlySummary(userId: string, month?: string): Promise<MonthlySpendSummary> {
  const now = new Date();
  const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Previous month
  const d = new Date(targetMonth + '-01');
  d.setMonth(d.getMonth() - 1);
  const prevMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  // Get category-wise spending
  const catSpend = await DB.getMonthlySpendByCategory(userId, targetMonth);
  const prevCatSpend = await DB.getMonthlySpendByCategory(userId, prevMonth);

  const totalSpent = catSpend.reduce((s: number, c: any) => s + (c.total || 0), 0);
  const prevTotal = prevCatSpend.reduce((s: number, c: any) => s + (c.total || 0), 0);

  // Get budgets
  const budgets = await DB.getBudgets(userId, targetMonth);

  // Get income
  const freelancerIncome = await DB.getFreelancerIncome(userId);
  const monthIncome = freelancerIncome
    .filter((i: any) => i.payment_date?.startsWith(targetMonth))
    .reduce((s: number, i: any) => s + i.amount, 0);

  const byCategory = catSpend.map((c: any) => {
    const budget = budgets.find((b: any) => b.category === c.category);
    const budgetLimit = budget?.monthly_limit || 0;
    return {
      category: c.category, amount: c.total, percent: totalSpent > 0 ? Math.round((c.total / totalSpent) * 100) : 0,
      vs_budget: budgetLimit > 0 ? (c.total > budgetLimit ? 'over' as const : c.total > budgetLimit * 0.8 ? 'on_track' as const : 'under' as const) : 'under' as const,
      budget_limit: budgetLimit,
    };
  });

  const topExpense = byCategory.length > 0 ? { category: byCategory[0].category, amount: byCategory[0].amount } : { category: 'none', amount: 0 };

  // Generate voice summary
  const catNames: Record<string, string> = {
    food: 'खाना-पीना', transport: 'यातायात', utilities: 'बिल', entertainment: 'मनोरंजन',
    health: 'स्वास्थ्य', shopping: 'खरीदारी', education: 'पढ़ाई', rent: 'किराया', other: 'अन्य',
  };

  const topCats = byCategory.slice(0, 3).map(c => `${catNames[c.category] || c.category} ₹${c.amount.toLocaleString('en-IN')}`).join(', ');
  const diff = totalSpent - prevTotal;
  const diffText = diff > 0 ? `₹${diff.toLocaleString('en-IN')} zyada` : `₹${Math.abs(diff).toLocaleString('en-IN')} kam`;

  const voiceSummary = `Pichle mahine aapne kul ₹${totalSpent.toLocaleString('en-IN')} kharch kiye. Sabse zyada: ${topCats}. Pichle mahine se ${diffText} hua.`;

  return {
    month: targetMonth, total_spent: totalSpent, total_income: monthIncome,
    total_saved: monthIncome - totalSpent, by_category: byCategory,
    vs_previous_month: diff, top_expense: topExpense, voice_summary: voiceSummary,
  };
}

// ─── Wishlist Reminders Check ────────────────────────────────────
export async function getWishlistReminders(userId: string): Promise<PurchaseIntent[]> {
  const intents = await DB.getPurchaseIntents(userId);
  const today = new Date().toISOString().split('T')[0];
  return intents.filter((i: any) => i.decision === 'wishlist' && i.wishlist_remind_date && i.wishlist_remind_date <= today) as PurchaseIntent[];
}

export default { checkPurchaseIntent, recordDecision, calculateOpportunityCost, generateMonthlySummary, getWishlistReminders };
