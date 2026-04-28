// ═══════════════════════════════════════════════════════════════════
// VAANI Freelancer OS Service
// Income logging, client tagging, GST invoice, ITR export, TDS alerts
// ═══════════════════════════════════════════════════════════════════

import * as DB from '../database';
import type { FreelancerIncome, ClientTracker, GSTInvoice, ITRExportData } from '../types';

function getCurrentFY(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

// ─── Log Income by Voice ─────────────────────────────────────────
export async function logIncome(userId: string, clientName: string, amount: number, description?: string, paymentMethod?: string): Promise<{
  id: string; tdsAlert: string; voiceConfirmation: string;
}> {
  const fy = getCurrentFY();
  
  // Check existing from this client for TDS
  const clients = await DB.getClientSummary(userId, fy);
  const existingClient = clients.find((c: any) => c.client_name.toLowerCase() === clientName.toLowerCase());
  const totalFromClient = (existingClient?.total_paid || 0) + amount;

  // Auto-detect TDS
  let tdsDeducted = 0;
  let tdsAlert = '';
  if (amount >= 30000) {
    tdsDeducted = Math.round(amount * 0.10);
    tdsAlert = `Is payment pe TDS kata hoga — lagbhag ₹${tdsDeducted.toLocaleString('en-IN')}. Form 26AS mein check karna.`;
  } else if (totalFromClient >= 100000) {
    tdsAlert = `${clientName} se ab ₹${totalFromClient.toLocaleString('en-IN')} aa gaya hai — ₹1 lakh se zyada. Unhe aapka PAN dedo taaki TDS kaatein.`;
  }

  const id = await DB.addFreelancerIncome({
    user_id: userId, client_name: clientName, amount,
    description: description || '', payment_method: paymentMethod || 'bank_transfer',
    tds_deducted: tdsDeducted, financial_year: fy,
  });

  const voiceConfirmation = `Done! ${clientName} se ₹${amount.toLocaleString('en-IN')} ka payment log kar diya.${tdsAlert ? ' ' + tdsAlert : ''}`;

  return { id, tdsAlert, voiceConfirmation };
}

// ─── Get Client Summary ──────────────────────────────────────────
export async function getClientTracker(userId: string): Promise<ClientTracker[]> {
  const fy = getCurrentFY();
  const clients = await DB.getClientSummary(userId, fy);
  const today = new Date();

  return clients.map((c: any) => ({
    client_name: c.client_name,
    total_paid: c.total_paid || 0,
    total_pending: 0, // Can be enhanced with invoice tracking
    last_payment_date: c.last_payment_date || '',
    payment_count: c.payment_count || 0,
    tds_total: c.tds_total || 0,
    days_since_last_payment: c.last_payment_date
      ? Math.floor((today.getTime() - new Date(c.last_payment_date).getTime()) / 86400000)
      : 0,
  }));
}

// ─── Payment Reminder Check ─────────────────────────────────────
export async function checkPendingPayments(userId: string): Promise<{ client: string; days: number; voiceAlert: string }[]> {
  const clients = await getClientTracker(userId);
  return clients
    .filter(c => c.days_since_last_payment >= 30)
    .map(c => ({
      client: c.client_name,
      days: c.days_since_last_payment,
      voiceAlert: `${c.client_name} ka payment ${c.days_since_last_payment} din se pending hai. Remind karna chahoge?`,
    }));
}

// ─── Generate GST Invoice ────────────────────────────────────────
export async function generateInvoice(userId: string, clientName: string, amount: number, serviceDesc: string, opts?: {
  gstRate?: number; clientGstin?: string; yourGstin?: string; bankDetails?: string;
}): Promise<{ id: string; invoiceNumber: string; total: number; voiceConfirmation: string }> {
  const gstRate = opts?.gstRate || 18;
  const gstAmount = Math.round(amount * gstRate / 100);
  const total = amount + gstAmount;

  const id = await DB.addGSTInvoice({
    user_id: userId, client_name: clientName,
    service_description: serviceDesc, amount,
    gst_rate: gstRate, client_gstin: opts?.clientGstin,
    your_gstin: opts?.yourGstin, your_bank_details: opts?.bankDetails,
  });

  // Get invoice number
  const invoices = await DB.getGSTInvoices(userId);
  const invoice = invoices.find((i: any) => i.id === id);

  return {
    id,
    invoiceNumber: invoice?.invoice_number || `INV-${Date.now().toString().slice(-8)}`,
    total,
    voiceConfirmation: `Invoice ban gaya! ${clientName} ke liye ₹${amount.toLocaleString('en-IN')} + GST ₹${gstAmount.toLocaleString('en-IN')} = kul ₹${total.toLocaleString('en-IN')}. Share karna hai?`,
  };
}

// ─── ITR Data Export ─────────────────────────────────────────────
export async function generateITRExport(userId: string, fy?: string): Promise<ITRExportData> {
  const financialYear = fy || getCurrentFY();
  const income = await DB.getFreelancerIncome(userId, financialYear);

  // Group by client
  const byClient: Record<string, number> = {};
  let totalTDS = 0;
  for (const i of income) {
    byClient[i.client_name] = (byClient[i.client_name] || 0) + i.amount;
    totalTDS += i.tds_deducted || 0;
  }

  const totalIncome = Object.values(byClient).reduce((s, v) => s + v, 0);

  // Get advance tax paid
  const advanceTax = await DB.getAdvanceTaxPayments(userId, financialYear);
  const advanceTaxPaid = advanceTax.reduce((s: number, p: any) => s + p.amount, 0);

  // Simple tax calc
  const taxableIncome = totalIncome; // Simplified — no deductions applied here
  const estimatedTax = Math.round(taxableIncome * 0.15); // Approximate

  return {
    financial_year: financialYear,
    total_income: totalIncome,
    income_by_client: Object.entries(byClient).map(([client, amount]) => ({ client, amount })),
    total_expenses: 0,
    tds_deducted: totalTDS,
    advance_tax_paid: advanceTaxPaid,
    taxable_income: taxableIncome,
    estimated_tax: estimatedTax,
  };
}

// ─── TDS Threshold Detection ─────────────────────────────────────
export async function checkTDSThresholds(userId: string): Promise<{ client: string; total: number; alert: string }[]> {
  const clients = await getClientTracker(userId);
  const alerts: { client: string; total: number; alert: string }[] = [];

  for (const c of clients) {
    if (c.total_paid >= 100000 && c.tds_total === 0) {
      alerts.push({
        client: c.client_name, total: c.total_paid,
        alert: `${c.client_name} ne ab ₹${c.total_paid.toLocaleString('en-IN')} diya hai — ₹1 lakh se zyada. Unhe PAN dedo taaki Form 16A dein.`,
      });
    }
  }
  return alerts;
}

// ─── Voice-Friendly Income Summary ───────────────────────────────
export async function getIncomeSummaryVoice(userId: string): Promise<string> {
  const fy = getCurrentFY();
  const income = await DB.getFreelancerIncome(userId, fy);
  const total = income.reduce((s: number, i: any) => s + i.amount, 0);
  const clients = await DB.getClientSummary(userId, fy);
  const topClient = clients[0];

  if (total === 0) return 'Is financial year mein abhi tak koi income log nahi ki hai.';

  return `Is saal aapki kul income ₹${total.toLocaleString('en-IN')} hai, ${clients.length} clients se. Sabse zyada ${topClient?.client_name || 'N/A'} se ₹${(topClient?.total_paid || 0).toLocaleString('en-IN')} aaya.`;
}

export default { logIncome, getClientTracker, checkPendingPayments, generateInvoice, generateITRExport, checkTDSThresholds, getIncomeSummaryVoice };
