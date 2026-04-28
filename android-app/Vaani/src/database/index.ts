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

      -- ═══════════════════════════════════════════════════════════
      -- NEW FEATURE MODULE TABLES
      -- ═══════════════════════════════════════════════════════════

      -- Bank accounts (idle money detection)
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        bank_name TEXT NOT NULL,
        account_type TEXT DEFAULT 'savings',
        balance REAL DEFAULT 0,
        last_updated TEXT,
        is_primary INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Idle money detection log
      CREATE TABLE IF NOT EXISTS idle_money_detections (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        detected_amount REAL,
        total_balance REAL,
        upcoming_emis REAL DEFAULT 0,
        monthly_budget REAL DEFAULT 0,
        emergency_buffer REAL DEFAULT 0,
        detection_date TEXT,
        action_taken TEXT DEFAULT 'pending',
        reminder_count INTEGER DEFAULT 0,
        suggested_product TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Investment holdings (tax intelligence)
      CREATE TABLE IF NOT EXISTS investment_holdings (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        asset_type TEXT NOT NULL,
        asset_name TEXT NOT NULL,
        buy_date TEXT NOT NULL,
        buy_price REAL NOT NULL,
        current_price REAL DEFAULT 0,
        quantity REAL DEFAULT 1,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- TDS records
      CREATE TABLE IF NOT EXISTS tds_records (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        payer_name TEXT NOT NULL,
        amount REAL NOT NULL,
        tds_amount REAL DEFAULT 0,
        tds_rate REAL DEFAULT 10,
        payment_date TEXT,
        financial_year TEXT,
        form_26as_verified INTEGER DEFAULT 0,
        mismatch_amount REAL DEFAULT 0,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Section 80C entries
      CREATE TABLE IF NOT EXISTS tax_80c_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        financial_year TEXT NOT NULL,
        description TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Advance tax payments
      CREATE TABLE IF NOT EXISTS advance_tax_payments (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        quarter INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_date TEXT,
        financial_year TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Freelancer income
      CREATE TABLE IF NOT EXISTS freelancer_income (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        client_name TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        payment_date TEXT,
        payment_method TEXT DEFAULT 'bank_transfer',
        tds_deducted REAL DEFAULT 0,
        is_tds_applicable INTEGER DEFAULT 0,
        invoice_id TEXT,
        financial_year TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- GST invoices
      CREATE TABLE IF NOT EXISTS gst_invoices (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        invoice_number TEXT NOT NULL,
        client_name TEXT NOT NULL,
        client_gstin TEXT,
        service_description TEXT,
        amount REAL NOT NULL,
        gst_rate REAL DEFAULT 18,
        gst_amount REAL DEFAULT 0,
        total_amount REAL DEFAULT 0,
        invoice_date TEXT,
        due_date TEXT,
        status TEXT DEFAULT 'draft',
        your_gstin TEXT,
        your_bank_details TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Loans & EMIs
      CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        loan_type TEXT NOT NULL,
        lender_name TEXT NOT NULL,
        principal REAL NOT NULL,
        outstanding REAL NOT NULL,
        interest_rate REAL NOT NULL,
        emi_amount REAL NOT NULL,
        emi_date INTEGER DEFAULT 1,
        remaining_tenure_months INTEGER DEFAULT 0,
        start_date TEXT,
        total_interest_remaining REAL DEFAULT 0,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Purchase intents (spend awareness)
      CREATE TABLE IF NOT EXISTS purchase_intents (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        item_description TEXT NOT NULL,
        amount REAL NOT NULL,
        opportunity_cost_10yr REAL DEFAULT 0,
        decision TEXT DEFAULT 'pending',
        wishlist_remind_date TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- FIRE settings
      CREATE TABLE IF NOT EXISTS fire_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE,
        target_amount REAL NOT NULL,
        target_age INTEGER NOT NULL,
        current_age INTEGER NOT NULL,
        monthly_income REAL DEFAULT 0,
        synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
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

// ═══════════════════════════════════════════════════════════════════
// NEW FEATURE MODULE — CRUD Operations
// ═══════════════════════════════════════════════════════════════════

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Bank Accounts ───────────────────────────────────────────────
export async function addBankAccount(data: { user_id: string; bank_name: string; account_type?: string; balance?: number; is_primary?: boolean }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  await database.runAsync(
    `INSERT INTO bank_accounts (id, user_id, bank_name, account_type, balance, is_primary, last_updated, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 0, datetime('now'))`,
    [id, data.user_id, data.bank_name, data.account_type || 'savings', data.balance || 0, data.is_primary ? 1 : 0]
  );
  return id;
}

export async function getBankAccounts(userId: string): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(`SELECT * FROM bank_accounts WHERE user_id = ? ORDER BY is_primary DESC`, [userId]);
}

export async function updateBankBalance(id: string, balance: number): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`UPDATE bank_accounts SET balance = ?, last_updated = datetime('now'), synced = 0 WHERE id = ?`, [balance, id]);
}

// ─── Idle Money Detections ───────────────────────────────────────
export async function addIdleMoneyDetection(data: { user_id: string; detected_amount: number; total_balance: number; upcoming_emis?: number; monthly_budget?: number; emergency_buffer?: number; suggested_product?: string }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  await database.runAsync(
    `INSERT INTO idle_money_detections (id, user_id, detected_amount, total_balance, upcoming_emis, monthly_budget, emergency_buffer, detection_date, action_taken, reminder_count, suggested_product, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, date('now'), 'pending', 0, ?, 0, datetime('now'))`,
    [id, data.user_id, data.detected_amount, data.total_balance, data.upcoming_emis || 0, data.monthly_budget || 0, data.emergency_buffer || 0, data.suggested_product || '']
  );
  return id;
}

export async function getIdleMoneyDetections(userId: string): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(`SELECT * FROM idle_money_detections WHERE user_id = ? ORDER BY detection_date DESC LIMIT 20`, [userId]);
}

export async function updateIdleMoneyAction(id: string, action: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`UPDATE idle_money_detections SET action_taken = ?, synced = 0 WHERE id = ?`, [action, id]);
}

// ─── Investment Holdings ─────────────────────────────────────────
export async function addInvestmentHolding(data: { user_id: string; asset_type: string; asset_name: string; buy_date: string; buy_price: number; current_price?: number; quantity?: number }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  await database.runAsync(
    `INSERT INTO investment_holdings (id, user_id, asset_type, asset_name, buy_date, buy_price, current_price, quantity, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    [id, data.user_id, data.asset_type, data.asset_name, data.buy_date, data.buy_price, data.current_price || data.buy_price, data.quantity || 1]
  );
  return id;
}

export async function getInvestmentHoldings(userId: string): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(`SELECT * FROM investment_holdings WHERE user_id = ? ORDER BY buy_date DESC`, [userId]);
}

export async function updateHoldingPrice(id: string, currentPrice: number): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`UPDATE investment_holdings SET current_price = ?, synced = 0 WHERE id = ?`, [currentPrice, id]);
}

// ─── TDS Records ─────────────────────────────────────────────────
export async function addTDSRecord(data: { user_id: string; payer_name: string; amount: number; tds_amount: number; tds_rate?: number; payment_date: string; financial_year: string }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  await database.runAsync(
    `INSERT INTO tds_records (id, user_id, payer_name, amount, tds_amount, tds_rate, payment_date, financial_year, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    [id, data.user_id, data.payer_name, data.amount, data.tds_amount, data.tds_rate || 10, data.payment_date, data.financial_year]
  );
  return id;
}

export async function getTDSRecords(userId: string, fy?: string): Promise<any[]> {
  const database = getDatabase();
  if (fy) {
    return await database.getAllAsync(`SELECT * FROM tds_records WHERE user_id = ? AND financial_year = ? ORDER BY payment_date DESC`, [userId, fy]);
  }
  return await database.getAllAsync(`SELECT * FROM tds_records WHERE user_id = ? ORDER BY payment_date DESC`, [userId]);
}

export async function updateTDSVerification(id: string, verified: boolean, mismatch: number): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`UPDATE tds_records SET form_26as_verified = ?, mismatch_amount = ?, synced = 0 WHERE id = ?`, [verified ? 1 : 0, mismatch, id]);
}

// ─── Tax 80C Entries ─────────────────────────────────────────────
export async function addTax80CEntry(data: { user_id: string; category: string; amount: number; financial_year: string; description?: string }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  await database.runAsync(
    `INSERT INTO tax_80c_entries (id, user_id, category, amount, financial_year, description, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    [id, data.user_id, data.category, data.amount, data.financial_year, data.description || '']
  );
  return id;
}

export async function getTax80CEntries(userId: string, fy: string): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(`SELECT * FROM tax_80c_entries WHERE user_id = ? AND financial_year = ?`, [userId, fy]);
}

// ─── Advance Tax Payments ────────────────────────────────────────
export async function addAdvanceTaxPayment(data: { user_id: string; quarter: number; amount: number; financial_year: string; payment_date?: string }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  await database.runAsync(
    `INSERT INTO advance_tax_payments (id, user_id, quarter, amount, payment_date, financial_year, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    [id, data.user_id, data.quarter, data.amount, data.payment_date || new Date().toISOString().split('T')[0], data.financial_year]
  );
  return id;
}

export async function getAdvanceTaxPayments(userId: string, fy: string): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(`SELECT * FROM advance_tax_payments WHERE user_id = ? AND financial_year = ? ORDER BY quarter`, [userId, fy]);
}

// ─── Freelancer Income ───────────────────────────────────────────
export async function addFreelancerIncome(data: { user_id: string; client_name: string; amount: number; description?: string; payment_date?: string; payment_method?: string; tds_deducted?: number; financial_year?: string }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  const today = new Date().toISOString().split('T')[0];
  const fy = getFinancialYear(data.payment_date || today);
  const isTds = data.amount >= 30000 ? 1 : 0;
  await database.runAsync(
    `INSERT INTO freelancer_income (id, user_id, client_name, amount, description, payment_date, payment_method, tds_deducted, is_tds_applicable, financial_year, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    [id, data.user_id, data.client_name, data.amount, data.description || '', data.payment_date || today, data.payment_method || 'bank_transfer', data.tds_deducted || 0, isTds, data.financial_year || fy]
  );
  return id;
}

export async function getFreelancerIncome(userId: string, fy?: string): Promise<any[]> {
  const database = getDatabase();
  if (fy) {
    return await database.getAllAsync(`SELECT * FROM freelancer_income WHERE user_id = ? AND financial_year = ? ORDER BY payment_date DESC`, [userId, fy]);
  }
  return await database.getAllAsync(`SELECT * FROM freelancer_income WHERE user_id = ? ORDER BY payment_date DESC`, [userId]);
}

export async function getClientSummary(userId: string, fy?: string): Promise<any[]> {
  const database = getDatabase();
  const fyFilter = fy ? `AND financial_year = '${fy}'` : '';
  return await database.getAllAsync(
    `SELECT client_name, SUM(amount) as total_paid, COUNT(*) as payment_count, MAX(payment_date) as last_payment_date, SUM(tds_deducted) as tds_total
     FROM freelancer_income WHERE user_id = ? ${fyFilter} GROUP BY client_name ORDER BY total_paid DESC`,
    [userId]
  );
}

// ─── GST Invoices ────────────────────────────────────────────────
export async function addGSTInvoice(data: { user_id: string; client_name: string; service_description: string; amount: number; gst_rate?: number; client_gstin?: string; your_gstin?: string; your_bank_details?: string }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  const gstRate = data.gst_rate || 18;
  const gstAmount = data.amount * (gstRate / 100);
  const total = data.amount + gstAmount;
  const invoiceNum = `INV-${Date.now().toString().slice(-8)}`;
  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await database.runAsync(
    `INSERT INTO gst_invoices (id, user_id, invoice_number, client_name, client_gstin, service_description, amount, gst_rate, gst_amount, total_amount, invoice_date, due_date, status, your_gstin, your_bank_details, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, 0, datetime('now'))`,
    [id, data.user_id, invoiceNum, data.client_name, data.client_gstin || '', data.service_description, data.amount, gstRate, gstAmount, total, today, dueDate, data.your_gstin || '', data.your_bank_details || '']
  );
  return id;
}

export async function getGSTInvoices(userId: string): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(`SELECT * FROM gst_invoices WHERE user_id = ? ORDER BY invoice_date DESC`, [userId]);
}

export async function updateInvoiceStatus(id: string, status: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`UPDATE gst_invoices SET status = ?, synced = 0 WHERE id = ?`, [status, id]);
}

// ─── Loans ───────────────────────────────────────────────────────
export async function addLoan(data: { user_id: string; loan_type: string; lender_name: string; principal: number; outstanding: number; interest_rate: number; emi_amount: number; emi_date?: number; remaining_tenure_months: number; start_date?: string }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  const totalInterest = data.emi_amount * data.remaining_tenure_months - data.outstanding;
  await database.runAsync(
    `INSERT INTO loans (id, user_id, loan_type, lender_name, principal, outstanding, interest_rate, emi_amount, emi_date, remaining_tenure_months, start_date, total_interest_remaining, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    [id, data.user_id, data.loan_type, data.lender_name, data.principal, data.outstanding, data.interest_rate, data.emi_amount, data.emi_date || 1, data.remaining_tenure_months, data.start_date || new Date().toISOString().split('T')[0], totalInterest > 0 ? totalInterest : 0]
  );
  return id;
}

export async function getLoans(userId: string): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(`SELECT * FROM loans WHERE user_id = ? ORDER BY interest_rate DESC`, [userId]);
}

export async function updateLoanOutstanding(id: string, outstanding: number, remainingMonths: number): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`UPDATE loans SET outstanding = ?, remaining_tenure_months = ?, synced = 0 WHERE id = ?`, [outstanding, remainingMonths, id]);
}

export async function deleteLoan(id: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`DELETE FROM loans WHERE id = ?`, [id]);
}

// ─── Purchase Intents ────────────────────────────────────────────
export async function addPurchaseIntent(data: { user_id: string; item_description: string; amount: number }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  const opp10yr = data.amount * Math.pow(1.20, 10); // 20% CAGR equity
  await database.runAsync(
    `INSERT INTO purchase_intents (id, user_id, item_description, amount, opportunity_cost_10yr, decision, synced, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, datetime('now'))`,
    [id, data.user_id, data.item_description, data.amount, Math.round(opp10yr)]
  );
  return id;
}

export async function getPurchaseIntents(userId: string): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(`SELECT * FROM purchase_intents WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`, [userId]);
}

export async function updatePurchaseDecision(id: string, decision: string, remindDate?: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`UPDATE purchase_intents SET decision = ?, wishlist_remind_date = ?, synced = 0 WHERE id = ?`, [decision, remindDate || null, id]);
}

// ─── FIRE Settings ───────────────────────────────────────────────
export async function setFIRESettings(data: { user_id: string; target_amount: number; target_age: number; current_age: number; monthly_income?: number }): Promise<void> {
  const database = getDatabase();
  const id = generateId();
  await database.runAsync(
    `INSERT OR REPLACE INTO fire_settings (id, user_id, target_amount, target_age, current_age, monthly_income, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    [id, data.user_id, data.target_amount, data.target_age, data.current_age, data.monthly_income || 0]
  );
}

export async function getFIRESettings(userId: string): Promise<any> {
  const database = getDatabase();
  return await database.getFirstAsync(`SELECT * FROM fire_settings WHERE user_id = ?`, [userId]);
}

// ─── Helper: Financial Year ──────────────────────────────────────
function getFinancialYear(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth(); // 0-11
  const year = d.getFullYear();
  if (month >= 3) { // Apr onwards
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

// ─── Get Net Worth Data (extended) ───────────────────────────────
export async function getNetWorthData(userId: string): Promise<any> {
  const database = getDatabase();
  const fdTotal = await database.getFirstAsync<{ total: number }>(`SELECT COALESCE(SUM(principal), 0) as total FROM fd_investments WHERE user_id = ?`, [userId]);
  const sipTotal = await database.getFirstAsync<{ total: number }>(`SELECT COALESCE(SUM(current_value), 0) as total FROM sip_investments WHERE user_id = ?`, [userId]);
  const bankTotal = await database.getFirstAsync<{ total: number }>(`SELECT COALESCE(SUM(balance), 0) as total FROM bank_accounts WHERE user_id = ?`, [userId]);
  const loanTotal = await database.getFirstAsync<{ total: number }>(`SELECT COALESCE(SUM(outstanding), 0) as total FROM loans WHERE user_id = ?`, [userId]);
  const emiTotal = await database.getFirstAsync<{ total: number }>(`SELECT COALESCE(SUM(emi_amount), 0) as total FROM loans WHERE user_id = ?`, [userId]);

  const totalAssets = (fdTotal?.total || 0) + (sipTotal?.total || 0) + (bankTotal?.total || 0);
  const totalLiabilities = loanTotal?.total || 0;

  return {
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    net_worth: totalAssets - totalLiabilities,
    breakdown: {
      bank_balances: bankTotal?.total || 0,
      fd: fdTotal?.total || 0,
      sip: sipTotal?.total || 0,
      ppf: 0,
      crypto: 0,
      gold: 0,
      savings_goals: 0,
    },
    monthly_emi: emiTotal?.total || 0,
  };
}

// ─── Savings Goals (extended) ────────────────────────────────────
export async function addSavingsGoal(data: { user_id: string; name: string; icon?: string; target_amount: number; deadline?: string }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  await database.runAsync(
    `INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, deadline, synced, created_at)
     VALUES (?, ?, ?, ?, 0, ?, 0, datetime('now'))`,
    [id, data.user_id, data.name, data.target_amount, data.deadline || null]
  );
  return id;
}

export async function getSavingsGoals(userId: string): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(`SELECT * FROM savings_goals WHERE user_id = ?`, [userId]);
}

export async function addToSavingsGoal(goalId: string, amount: number): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`UPDATE savings_goals SET current_amount = current_amount + ?, synced = 0 WHERE id = ?`, [amount, goalId]);
}

// ─── Crypto (extended) ───────────────────────────────────────────
export async function addCrypto(data: { user_id: string; coin: string; symbol?: string; amount: number; buy_price?: number }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  await database.runAsync(
    `INSERT INTO crypto_wallets (id, user_id, coin, symbol, amount, current_value, buy_price, blockchain, synced, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, '', 0, datetime('now'))`,
    [id, data.user_id, data.coin, data.symbol || data.coin, data.amount, data.buy_price || 0]
  );
  return id;
}

export async function getCryptos(userId: string): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(`SELECT * FROM crypto_wallets WHERE user_id = ?`, [userId]);
}

// ─── Gold (extended) ─────────────────────────────────────────────
export async function addGold(data: { user_id: string; grams: number; buy_price_per_gram: number }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  await database.runAsync(
    `INSERT INTO gold_holdings (id, user_id, grams, buy_price, current_price, synced, updated_at)
     VALUES (?, ?, ?, ?, 0, 0, datetime('now'))`,
    [id, data.user_id, data.grams, data.buy_price_per_gram]
  );
  return id;
}

export async function getGold(userId: string): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(`SELECT * FROM gold_holdings WHERE user_id = ?`, [userId]);
}

// ─── Chat Messages (extended) ────────────────────────────────────
export async function addChatMessage(data: { user_id: string; role: string; content: string; language?: string }): Promise<string> {
  const database = getDatabase();
  const id = generateId();
  await database.runAsync(
    `INSERT INTO chat_messages (id, user_id, role, content, synced, created_at)
     VALUES (?, ?, ?, ?, 0, datetime('now'))`,
    [id, data.user_id, data.role, data.content]
  );
  return id;
}

export async function getChatMessages(userId: string, limit: number = 50): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(`SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`, [userId, limit]);
}

export async function clearChatMessages(userId: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`DELETE FROM chat_messages WHERE user_id = ?`, [userId]);
}

// ─── Expense (extended) ──────────────────────────────────────────
export async function deleteExpense(id: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`DELETE FROM expenses WHERE id = ?`, [id]);
}

// ─── FD (extended) ───────────────────────────────────────────────
export async function deleteFD(id: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync(`DELETE FROM fd_investments WHERE id = ?`, [id]);
}

// ─── Monthly Spend Summary Query ─────────────────────────────────
export async function getMonthlySpendByCategory(userId: string, month: string): Promise<any[]> {
  const database = getDatabase();
  return await database.getAllAsync(
    `SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? AND date LIKE ? AND type = 'debit' GROUP BY category ORDER BY total DESC`,
    [userId, `${month}%`]
  );
}

