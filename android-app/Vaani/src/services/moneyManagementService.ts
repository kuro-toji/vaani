// ═══════════════════════════════════════════════════════════════════
// VAANI Money Management System — SQLite + Supabase Sync
// Offline-first with background sync
// ═══════════════════════════════════════════════════════════════════

import * as SQLite from 'expo-sqlite';
import * as NetworkState from 'expo-network';
import { syncService } from './syncService';

// ─── Database Schema ─────────────────────────────────────────────────
const DB_NAME = 'vani_money.db';

// ─── Tables ───────────────────────────────────────────────────────────
const CREATE_TABLES = `
-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0
);

-- Savings goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  deadline TEXT,
  priority INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  spent REAL DEFAULT 0,
  month TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0,
  UNIQUE(category, month)
);

-- FD investments table
CREATE TABLE IF NOT EXISTS fd_investments (
  id TEXT PRIMARY KEY,
  bank TEXT NOT NULL,
  amount REAL NOT NULL,
  interest_rate REAL NOT NULL,
  start_date TEXT NOT NULL,
  maturity_date TEXT NOT NULL,
  maturity_amount REAL,
  auto_renew INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0
);

-- SIP investments table
CREATE TABLE IF NOT EXISTS sip_investments (
  id TEXT PRIMARY KEY,
  fund_name TEXT NOT NULL,
  fund_code TEXT,
  amount REAL NOT NULL,
  nav REAL,
  units REAL,
  start_date TEXT NOT NULL,
  last_invested TEXT,
  total_invested REAL DEFAULT 0,
  current_value REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0
);

-- Crypto holdings table
CREATE TABLE IF NOT EXISTS crypto_holdings (
  id TEXT PRIMARY KEY,
  coin TEXT NOT NULL,
  amount REAL NOT NULL,
  avg_buy_price REAL,
  current_price REAL,
  current_value REAL,
  pnl REAL,
  last_updated TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0
);

-- Gold holdings table
CREATE TABLE IF NOT EXISTS gold_holdings (
  id TEXT PRIMARY KEY,
  amount_grams REAL NOT NULL,
  avg_buy_price REAL,
  current_price REAL,
  current_value REAL,
  pnl REAL,
  last_updated TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0
);

-- Transactions table (for ledger)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- income, expense, investment, withdrawal
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  related_id TEXT, -- linked to expense, fd, sip, etc.
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Sync log table
CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- insert, update, delete
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0
);
`;

// ─── Database Instance ───────────────────────────────────────────────
let db: SQLite.SQLiteDatabase | null = null;

// ─── Initialize Database ─────────────────────────────────────────────
export async function initDatabase(): Promise<void> {
  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Create tables
    await db.execAsync(CREATE_TABLES);
    
    console.log('[MoneyDB] Database initialized');
  } catch (error) {
    console.error('[MoneyDB] Init error:', error);
    throw error;
  }
}

// ─── Helper: Generate ID ──────────────────────────────────────────────
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Helper: Get Current Date ─────────────────────────────────────────
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Helper: Get Current Month ───────────────────────────────────────
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Log Sync Action ───────────────────────────────────────────────────
async function logSyncAction(table: string, recordId: string, action: string): Promise<void> {
  if (!db) return;
  try {
    await db.runAsync(
      'INSERT INTO sync_log (table_name, record_id, action) VALUES (?, ?, ?)',
      [table, recordId, action]
    );
  } catch (error) {
    console.warn('[MoneyDB] Sync log error:', error);
  }
}

// ─── EXPENSES ────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  createdAt: string;
  synced: boolean;
}

export async function addExpense(
  amount: number,
  category: string,
  description?: string,
  date?: string
): Promise<Expense> {
  if (!db) throw new Error('Database not initialized');

  const expense: Expense = {
    id: generateId(),
    amount,
    category,
    description: description || '',
    date: date || getCurrentDate(),
    createdAt: new Date().toISOString(),
    synced: false,
  };

  await db.runAsync(
    'INSERT INTO expenses (id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)',
    [expense.id, expense.amount, expense.category, expense.description, expense.date]
  );

  // Update budget spent
  await updateBudgetSpent(category, amount, date || getCurrentDate());

  // Log sync action
  await logSyncAction('expenses', expense.id, 'insert');

  // Try sync if online
  if (await isOnline()) {
    syncService.syncExpenses();
  }

  return expense;
}

export async function getExpenses(
  startDate?: string,
  endDate?: string,
  category?: string
): Promise<Expense[]> {
  if (!db) throw new Error('Database not initialized');

  let query = 'SELECT * FROM expenses WHERE deleted = 0';
  const params: any[] = [];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY date DESC';

  const rows = await db.getAllAsync<any>(query, params);
  return rows.map(row => ({
    id: row.id,
    amount: row.amount,
    category: row.category,
    description: row.description,
    date: row.date,
    createdAt: row.created_at,
    synced: row.synced === 1,
  }));
}

export async function getTotalExpenses(month?: string): Promise<number> {
  if (!db) throw new Error('Database not initialized');

  const monthFilter = month || getCurrentMonth();
  const startDate = `${monthFilter}-01`;
  const endDate = `${monthFilter}-31`;

  const result = await db.getFirstAsync<{ total: number }>(
    'SELECT SUM(amount) as total FROM expenses WHERE deleted = 0 AND date >= ? AND date <= ?',
    [startDate, endDate]
  );

  return result?.total || 0;
}

// ─── BUDGETS ─────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  month: string;
}

export async function setBudget(
  category: string,
  monthlyLimit: number,
  month?: string
): Promise<Budget> {
  if (!db) throw new Error('Database not initialized');

  const monthValue = month || getCurrentMonth();
  const existing = await db.getFirstAsync<any>(
    'SELECT * FROM budgets WHERE category = ? AND month = ?',
    [category, monthValue]
  );

  if (existing) {
    await db.runAsync(
      'UPDATE budgets SET monthly_limit = ?, updated_at = CURRENT_TIMESTAMP, synced = 0 WHERE category = ? AND month = ?',
      [monthlyLimit, category, monthValue]
    );
  } else {
    await db.runAsync(
      'INSERT INTO budgets (id, category, monthly_limit, month) VALUES (?, ?, ?, ?)',
      [generateId(), category, monthlyLimit, monthValue]
    );
  }

  await logSyncAction('budgets', category, existing ? 'update' : 'insert');

  return {
    id: existing?.id || generateId(),
    category,
    monthlyLimit,
    spent: existing?.spent || 0,
    remaining: monthlyLimit - (existing?.spent || 0),
    month: monthValue,
  };
}

export async function updateBudgetSpent(
  category: string,
  amount: number,
  date: string
): Promise<void> {
  if (!db) return;

  const month = date.substring(0, 7);

  await db.runAsync(
    `INSERT INTO budgets (id, category, monthly_limit, spent, month) VALUES (?, ?, 0, ?, ?)
     ON CONFLICT(category, month) DO UPDATE SET 
     spent = spent + ?, updated_at = CURRENT_TIMESTAMP, synced = 0`,
    [generateId(), category, amount, month, amount]
  );
}

export async function getBudgets(month?: string): Promise<Budget[]> {
  if (!db) throw new Error('Database not initialized');

  const monthValue = month || getCurrentMonth();

  const rows = await db.getAllAsync<any>(
    'SELECT * FROM budgets WHERE month = ? AND deleted = 0',
    [monthValue]
  );

  return rows.map(row => ({
    id: row.id,
    category: row.category,
    monthlyLimit: row.monthly_limit,
    spent: row.spent || 0,
    remaining: row.monthly_limit - (row.spent || 0),
    month: row.month,
  }));
}

// ─── SAVINGS GOALS ──────────────────────────────────────────────────

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  deadline?: string;
  priority: number;
  createdAt: string;
  synced: boolean;
}

export async function createSavingsGoal(
  name: string,
  targetAmount: number,
  deadline?: string,
  priority: number = 1
): Promise<SavingsGoal> {
  if (!db) throw new Error('Database not initialized');

  const goal: SavingsGoal = {
    id: generateId(),
    name,
    targetAmount,
    currentAmount: 0,
    progress: 0,
    deadline,
    priority,
    createdAt: new Date().toISOString(),
    synced: false,
  };

  await db.runAsync(
    'INSERT INTO savings_goals (id, name, target_amount, deadline, priority) VALUES (?, ?, ?, ?, ?)',
    [goal.id, goal.name, goal.targetAmount, goal.deadline, goal.priority]
  );

  await logSyncAction('savings_goals', goal.id, 'insert');

  return goal;
}

export async function updateSavingsProgress(
  goalId: string,
  amount: number
): Promise<void> {
  if (!db) return;

  const goal = await db.getFirstAsync<any>('SELECT * FROM savings_goals WHERE id = ?', [goalId]);
  if (!goal) return;

  const newAmount = goal.current_amount + amount;
  const progress = (newAmount / goal.target_amount) * 100;

  await db.runAsync(
    'UPDATE savings_goals SET current_amount = ?, updated_at = CURRENT_TIMESTAMP, synced = 0 WHERE id = ?',
    [newAmount, goalId]
  );

  await logSyncAction('savings_goals', goalId, 'update');
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<any>('SELECT * FROM savings_goals WHERE deleted = 0 ORDER BY priority');

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    progress: (row.current_amount / row.target_amount) * 100,
    deadline: row.deadline,
    priority: row.priority,
    createdAt: row.created_at,
    synced: row.synced === 1,
  }));
}

// ─── FD INVESTMENTS ──────────────────────────────────────────────────

export interface FDInvestment {
  id: string;
  bank: string;
  amount: number;
  interestRate: number;
  startDate: string;
  maturityDate: string;
  maturityAmount: number;
  autoRenew: boolean;
  synced: boolean;
}

export async function addFDInvestment(
  bank: string,
  amount: number,
  interestRate: number,
  tenureMonths: number,
  autoRenew: boolean = false
): Promise<FDInvestment> {
  if (!db) throw new Error('Database not initialized');

  const startDate = new Date();
  const maturityDate = new Date(startDate);
  maturityDate.setMonth(maturityDate.getMonth() + tenureMonths);

  const maturityAmount = amount * (1 + (interestRate * tenureMonths) / 1200);

  const fd: FDInvestment = {
    id: generateId(),
    bank,
    amount,
    interestRate,
    startDate: startDate.toISOString().split('T')[0],
    maturityDate: maturityDate.toISOString().split('T')[0],
    maturityAmount: Math.round(maturityAmount * 100) / 100,
    autoRenew,
    synced: false,
  };

  await db.runAsync(
    'INSERT INTO fd_investments (id, bank, amount, interest_rate, start_date, maturity_date, maturity_amount, auto_renew) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [fd.id, fd.bank, fd.amount, fd.interestRate, fd.startDate, fd.maturityDate, fd.maturityAmount, autoRenew ? 1 : 0]
  );

  await logSyncAction('fd_investments', fd.id, 'insert');

  return fd;
}

export async function getFDInvestments(): Promise<FDInvestment[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<any>('SELECT * FROM fd_investments WHERE deleted = 0 ORDER BY start_date DESC');

  return rows.map(row => ({
    id: row.id,
    bank: row.bank,
    amount: row.amount,
    interestRate: row.interest_rate,
    startDate: row.start_date,
    maturityDate: row.maturity_date,
    maturityAmount: row.maturity_amount,
    autoRenew: row.auto_renew === 1,
    synced: row.synced === 1,
  }));
}

// ─── SIP INVESTMENTS ─────────────────────────────────────────────────

export interface SIPInvestment {
  id: string;
  fundName: string;
  fundCode?: string;
  amount: number;
  nav?: number;
  units?: number;
  startDate: string;
  lastInvested?: string;
  totalInvested: number;
  currentValue: number;
  synced: boolean;
}

export async function addSIPInvestment(
  fundName: string,
  amount: number,
  fundCode?: string,
  nav?: number,
  startDate?: string
): Promise<SIPInvestment> {
  if (!db) throw new Error('Database not initialized');

  const sip: SIPInvestment = {
    id: generateId(),
    fundName,
    fundCode,
    amount,
    nav,
    units: nav ? amount / nav : 0,
    startDate: startDate || getCurrentDate(),
    totalInvested: amount,
    currentValue: amount,
    synced: false,
  };

  await db.runAsync(
    'INSERT INTO sip_investments (id, fund_name, fund_code, amount, nav, units, start_date, total_invested, current_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [sip.id, sip.fundName, sip.fundCode, sip.amount, sip.nav, sip.units, sip.startDate, sip.totalInvested, sip.currentValue]
  );

  await logSyncAction('sip_investments', sip.id, 'insert');

  return sip;
}

export async function getSIPInvestments(): Promise<SIPInvestment[]> {
  if (!db) throw new Error('Database not initialized');

  const rows = await db.getAllAsync<any>('SELECT * FROM sip_investments WHERE deleted = 0 ORDER BY start_date DESC');

  return rows.map(row => ({
    id: row.id,
    fundName: row.fund_name,
    fundCode: row.fund_code,
    amount: row.amount,
    nav: row.nav,
    units: row.units,
    startDate: row.start_date,
    lastInvested: row.last_invested,
    totalInvested: row.total_invested,
    currentValue: row.current_value,
    synced: row.synced === 1,
  }));
}

// ─── PORTFOLIO SUMMARY ────────────────────────────────────────────────

export interface PortfolioSummary {
  totalFD: number;
  totalSIP: number;
  totalCrypto: number;
  totalGold: number;
  monthlyExpenses: number;
  savingsBalance: number;
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const expenses = await getTotalExpenses();

  const fdInvestments = await getFDInvestments();
  const totalFD = fdInvestments.reduce((sum, fd) => sum + fd.amount, 0);

  const sipInvestments = await getSIPInvestments();
  const totalSIP = sipInvestments.reduce((sum, sip) => sum + sip.currentValue, 0);

  // Crypto holdings
  const cryptoRows = await db?.getAllAsync<any>('SELECT SUM(current_value) as total FROM crypto_holdings WHERE deleted = 0');
  const totalCrypto = cryptoRows?.[0]?.total || 0;

  // Gold holdings
  const goldRows = await db?.getAllAsync<any>('SELECT SUM(current_value) as total FROM gold_holdings WHERE deleted = 0');
  const totalGold = goldRows?.[0]?.total || 0;

  // Savings = FD + SIP + Crypto + Gold - totalExpenses
  const savingsBalance = totalFD + totalSIP + totalCrypto + totalGold - expenses;

  return {
    totalFD,
    totalSIP,
    totalCrypto,
    totalGold,
    monthlyExpenses: expenses,
    savingsBalance,
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────

async function isOnline(): Promise<boolean> {
  try {
    const networkState = await NetworkState.getNetworkStateAsync();
    return networkState.isConnected || false;
  } catch {
    return false;
  }
}

// ─── Delete Operations ───────────────────────────────────────────────

export async function deleteExpense(id: string): Promise<void> {
  if (!db) return;
  await db.runAsync('UPDATE expenses SET deleted = 1, updated_at = CURRENT_TIMESTAMP, synced = 0 WHERE id = ?', [id]);
  await logSyncAction('expenses', id, 'delete');
}

export async function deleteFDInvestment(id: string): Promise<void> {
  if (!db) return;
  await db.runAsync('UPDATE fd_investments SET deleted = 1, updated_at = CURRENT_TIMESTAMP, synced = 0 WHERE id = ?', [id]);
  await logSyncAction('fd_investments', id, 'delete');
}

export async function deleteSIPInvestment(id: string): Promise<void> {
  if (!db) return;
  await db.runAsync('UPDATE sip_investments SET deleted = 1, updated_at = CURRENT_TIMESTAMP, synced = 0 WHERE id = ?', [id]);
  await logSyncAction('sip_investments', id, 'delete');
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  if (!db) return;
  await db.runAsync('UPDATE savings_goals SET deleted = 1, updated_at = CURRENT_TIMESTAMP, synced = 0 WHERE id = ?', [id]);
  await logSyncAction('savings_goals', id, 'delete');
}

export default {
  initDatabase,
  addExpense,
  getExpenses,
  getTotalExpenses,
  setBudget,
  getBudgets,
  createSavingsGoal,
  updateSavingsProgress,
  getSavingsGoals,
  addFDInvestment,
  getFDInvestments,
  deleteFDInvestment,
  addSIPInvestment,
  getSIPInvestments,
  deleteSIPInvestment,
  getPortfolioSummary,
  deleteExpense,
  deleteSavingsGoal,
};