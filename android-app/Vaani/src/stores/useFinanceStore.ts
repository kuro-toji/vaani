// ═══════════════════════════════════════════════════════════════════
// VAANI Finance Store — Zustand State Management
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import * as DB from '../database';
import { formatCurrency } from '../services/financeService';
import type { Expense, Budget, SavingsGoal, FDInvestment, SIPInvestment, CryptoWallet, GoldHolding, NetWorth } from '../types';

interface FinanceState {
  // Data
  expenses: Expense[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  fds: FDInvestment[];
  sips: SIPInvestment[];
  cryptos: CryptoWallet[];
  golds: GoldHolding[];
  netWorth: NetWorth;

  // UI State
  loading: boolean;
  refreshing: boolean;
  currentMonth: string;

  // Actions
  loadAll: (userId: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;

  // Expense actions
  addExpense: (userId: string, data: Omit<Expense, 'id' | 'user_id' | 'synced' | 'created_at'>) => Promise<string>;
  deleteExpense: (id: string) => Promise<void>;

  // Budget actions
  setBudget: (userId: string, category: string, limit: number) => Promise<void>;

  // Savings actions
  addSavingsGoal: (userId: string, name: string, icon: string, target: number, deadline?: string) => Promise<void>;
  addToGoal: (goalId: string, amount: number) => Promise<void>;

  // Investment actions
  addFD: (userId: string, data: any) => Promise<void>;
  deleteFD: (id: string) => Promise<void>;
  addSIP: (userId: string, data: any) => Promise<void>;
  addCrypto: (userId: string, data: any) => Promise<void>;
  addGold: (userId: string, grams: number, buyPrice: number) => Promise<void>;

  // Computed
  getMonthlySpend: () => number;
  getMonthlySavings: () => number;
  getExpenseSummary: () => { category: string; total: number; percentage: number }[];
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  expenses: [],
  budgets: [],
  savingsGoals: [],
  fds: [],
  sips: [],
  cryptos: [],
  golds: [],
  netWorth: { total: 0, breakdown: { fd: 0, sip: 0, ppf: 0, crypto: 0, gold: 0, savings: 0 }, monthly_income: 0, monthly_expense: 0, monthly_savings: 0 },
  loading: false,
  refreshing: false,
  currentMonth: getCurrentMonth(),

  loadAll: async (userId: string) => {
    set({ loading: true });
    try {
      const month = getCurrentMonth();
      const [expenses, budgets, goals, fds, sips, cryptos, golds, nw] = await Promise.all([
        DB.getExpenses(userId, 100),
        DB.getBudgets(userId, month),
        DB.getSavingsGoals(userId),
        DB.getFDs(userId),
        DB.getSIPs(userId),
        DB.getCryptos(userId),
        DB.getGold(userId),
        DB.getNetWorthData(userId),
      ]);

      const monthExpenses = expenses.filter((e: any) => e.date?.startsWith(month));
      const totalExpense = monthExpenses.filter((e: any) => e.type === 'expense').reduce((s: number, e: any) => s + e.amount, 0);
      const totalIncome = monthExpenses.filter((e: any) => e.type === 'income').reduce((s: number, e: any) => s + e.amount, 0);

      set({
        expenses: expenses as any,
        budgets: budgets as any,
        savingsGoals: goals as any,
        fds: fds as any,
        sips: sips as any,
        cryptos: cryptos as any,
        golds: golds as any,
        netWorth: {
          ...nw,
          monthly_income: totalIncome,
          monthly_expense: totalExpense,
          monthly_savings: totalIncome - totalExpense,
        },
        loading: false,
        currentMonth: month,
      });
    } catch (error) {
      console.error('[Store] Load failed:', error);
      set({ loading: false });
    }
  },

  refresh: async (userId: string) => {
    set({ refreshing: true });
    await get().loadAll(userId);
    set({ refreshing: false });
  },

  addExpense: async (userId, data) => {
    const id = await DB.addExpense({
      user_id: userId,
      description: data.description,
      amount: data.amount,
      category: data.category,
      type: data.type || 'expense',
      date: data.date,
      voice_transcript: data.voice_transcript,
    });

    // Update local state
    const newExpense = { ...data, id, user_id: userId, synced: false, created_at: new Date().toISOString() };
    set(s => ({
      expenses: [newExpense as any, ...s.expenses],
      netWorth: {
        ...s.netWorth,
        monthly_expense: s.netWorth.monthly_expense + data.amount,
        monthly_savings: s.netWorth.monthly_savings - data.amount,
      },
    }));

    return id;
  },

  deleteExpense: async (id) => {
    const expense = get().expenses.find(e => e.id === id);
    await DB.deleteExpense(id);
    set(s => ({
      expenses: s.expenses.filter(e => e.id !== id),
      netWorth: expense ? {
        ...s.netWorth,
        monthly_expense: s.netWorth.monthly_expense - expense.amount,
      } : s.netWorth,
    }));
  },

  setBudget: async (userId, category, limit) => {
    const month = getCurrentMonth();
    await DB.setBudget({ user_id: userId, category, monthly_limit: limit, month });
    const budgets = await DB.getBudgets(userId, month);
    set({ budgets: budgets as any });
  },

  addSavingsGoal: async (userId, name, icon, target, deadline) => {
    await DB.addSavingsGoal({ user_id: userId, name, icon, target_amount: target, deadline });
    const goals = await DB.getSavingsGoals(userId);
    set({ savingsGoals: goals as any });
  },

  addToGoal: async (goalId, amount) => {
    await DB.addToSavingsGoal(goalId, amount);
    set(s => ({
      savingsGoals: s.savingsGoals.map(g =>
        g.id === goalId ? { ...g, current_amount: g.current_amount + amount } : g
      ),
    }));
  },

  addFD: async (userId, data) => {
    await DB.addFD({ user_id: userId, ...data });
    const fds = await DB.getFDs(userId);
    const nw = await DB.getNetWorthData(userId);
    set({ fds: fds as any, netWorth: { ...get().netWorth, ...nw } });
  },

  deleteFD: async (id) => {
    await DB.deleteFD(id);
    set(s => ({ fds: s.fds.filter(f => f.id !== id) }));
  },

  addSIP: async (userId, data) => {
    await DB.addSIP({ user_id: userId, ...data });
    const sips = await DB.getSIPs(userId);
    set({ sips: sips as any });
  },

  addCrypto: async (userId, data) => {
    await DB.addCrypto({ user_id: userId, ...data });
    const cryptos = await DB.getCryptos(userId);
    set({ cryptos: cryptos as any });
  },

  addGold: async (userId, grams, buyPrice) => {
    await DB.addGold({ user_id: userId, grams, buy_price_per_gram: buyPrice });
    const golds = await DB.getGold(userId);
    set({ golds: golds as any });
  },

  getMonthlySpend: () => {
    const month = getCurrentMonth();
    return get().expenses
      .filter(e => e.date?.startsWith(month) && e.type === 'expense')
      .reduce((s, e) => s + e.amount, 0);
  },

  getMonthlySavings: () => {
    const month = getCurrentMonth();
    const expenses = get().expenses.filter(e => e.date?.startsWith(month));
    const income = expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const spent = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return income - spent;
  },

  getExpenseSummary: () => {
    const month = getCurrentMonth();
    const monthExpenses = get().expenses.filter(e => e.date?.startsWith(month) && e.type === 'expense');
    const total = monthExpenses.reduce((s, e) => s + e.amount, 0);

    const byCategory: Record<string, number> = {};
    for (const e of monthExpenses) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    }

    return Object.entries(byCategory)
      .map(([category, catTotal]) => ({
        category,
        total: catTotal,
        percentage: total > 0 ? Math.round((catTotal / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  },
}));
