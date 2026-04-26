import * as SQLite from 'expo-sqlite';
import { COLORS } from '../constants';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// Initialize database
export async function initDatabase(): Promise<void> {
  try {
    db = await SQLite.openDatabaseAsync('vaani.db');
    
    // Create tables
    await db.execAsync(`
      -- Users table (local cache)
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone TEXT,
        email TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      
      -- Expenses table
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        description TEXT,
        amount REAL,
        category TEXT,
        type TEXT,
        date TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      -- Budgets table
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        category TEXT,
        monthly_limit REAL,
        spent REAL,
        month TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      -- Savings goals table
      CREATE TABLE IF NOT EXISTS savings_goals (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        target_amount REAL,
        current_amount REAL,
        deadline TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      -- FD investments table
      CREATE TABLE IF NOT EXISTS fd_investments (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        bank TEXT,
        principal REAL,
        current_value REAL,
        rate REAL,
        maturity_date TEXT,
        tenure_months INTEGER,
        start_date TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      -- SIP investments table
      CREATE TABLE IF NOT EXISTS sip_investments (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        fund TEXT,
        principal REAL,
        current_value REAL,
        monthly REAL,
        units REAL,
        nav REAL,
        start_date TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      -- Crypto wallets table
      CREATE TABLE IF NOT EXISTS crypto_wallets (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        coin TEXT,
        symbol TEXT,
        amount REAL,
        current_value REAL,
        buy_price REAL,
        blockchain TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      -- Gold holdings table
      CREATE TABLE IF NOT EXISTS gold_holdings (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        grams REAL,
        buy_price REAL,
        current_price REAL,
        updated_at TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      -- Chat messages table
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        role TEXT,
        content TEXT,
        audio_url TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      -- Pending sync queue
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT,
        operation TEXT,
        data TEXT,
        created_at TEXT
      );
      
      -- Settings table
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Get database instance
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Expense operations
export async function addExpense(expense: {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  type: 'credit' | 'debit';
  date: string;
}): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `INSERT INTO expenses (id, user_id, description, amount, category, type, date, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    [expense.id, expense.user_id, expense.description, expense.amount, expense.category, expense.type, expense.date]
  );
}

export async function getExpenses(userId: string, limit = 50): Promise<any[]> {
  const database = getDatabase();
  const result = await database.getAllAsync(
    `SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC LIMIT ?`,
    [userId, limit]
  );
  return result;
}

// Budget operations
export async function setBudget(budget: {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  month: string;
}): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO budgets (id, user_id, category, monthly_limit, spent, month, synced)
     VALUES (?, ?, ?, ?, 0, ?, 0)`,
    [budget.id, budget.user_id, budget.category, budget.monthly_limit, budget.month]
  );
}

export async function getBudgets(userId: string, month: string): Promise<any[]> {
  const database = getDatabase();
  const result = await database.getAllAsync(
    `SELECT * FROM budgets WHERE user_id = ? AND month = ?`,
    [userId, month]
  );
  return result;
}

// FD operations
export async function addFD(fd: {
  id: string;
  user_id: string;
  bank: string;
  principal: number;
  rate: number;
  maturity_date: string;
  tenure_months: number;
  start_date: string;
}): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `INSERT INTO fd_investments (id, user_id, bank, principal, current_value, rate, maturity_date, tenure_months, start_date, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    [fd.id, fd.user_id, fd.bank, fd.principal, fd.principal, fd.rate, fd.maturity_date, fd.tenure_months, fd.start_date]
  );
}

export async function getFDs(userId: string): Promise<any[]> {
  const database = getDatabase();
  const result = await database.getAllAsync(
    `SELECT * FROM fd_investments WHERE user_id = ? ORDER BY maturity_date`,
    [userId]
  );
  return result;
}

// SIP operations
export async function addSIP(sip: {
  id: string;
  user_id: string;
  fund: string;
  monthly: number;
  start_date: string;
}): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `INSERT INTO sip_investments (id, user_id, fund, principal, current_value, monthly, units, nav, start_date, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, 0, datetime('now'))`,
    [sip.id, sip.user_id, sip.fund, sip.monthly, sip.monthly, sip.monthly, sip.start_date]
  );
}

export async function getSIPs(userId: string): Promise<any[]> {
  const database = getDatabase();
  const result = await database.getAllAsync(
    `SELECT * FROM sip_investments WHERE user_id = ? ORDER BY start_date DESC`,
    [userId]
  );
  return result;
}

// Settings operations
export async function setSetting(key: string, value: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    [key, value]
  );
}

export async function getSetting(key: string): Promise<string | null> {
  const database = getDatabase();
  const result = await database.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`,
    [key]
  );
  return result?.value || null;
}

// Sync queue operations
export async function addToSyncQueue(operation: string, tableName: string, data: any): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    `INSERT INTO sync_queue (id, table_name, operation, data, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [Date.now().toString(), tableName, operation, JSON.stringify(data)]
  );
}

export async function getSyncQueue(): Promise<any[]> {
  const database = getDatabase();
  const result = await database.getAllAsync(
    `SELECT * FROM sync_queue ORDER BY created_at`
  );
  return result;
}

export async function clearSyncQueue(): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`DELETE FROM sync_queue`);
}
