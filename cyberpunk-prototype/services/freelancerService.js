// ═══════════════════════════════════════════════════════════════════
// VAANI Freelancer Service — Layer 6
// Real database writes for income tracking, GST invoices, TDS
// ═══════════════════════════════════════════════════════════════════

import { supabase } from '../lib/supabase.js';

// ─── Parse Income Message ──────────────────────────────────────────
// "Rahul ne ₹25,000 bheja project ke liye"
// Returns: { clientName, amount, type, description, date }
export function parseIncomeMessage(text) {
  const lower = text.toLowerCase();
  
  // Pattern: "X ne ₹Y bheja" or "X paid ₹Y"
  const bhejaMatch = text.match(/(\w+)\s+ne\s+₹?([\d,]+)/i);
  const paidMatch = text.match(/(\w+)\s+(paid|sent|transferred)\s+₹?([\d,]+)/i);
  
  if (!bhejaMatch && !paidMatch) return null;
  
  const clientName = bhejaMatch?.[1] || paidMatch?.[1];
  const amountStr = bhejaMatch?.[2] || paidMatch?.[3];
  const amount = parseInt(amountStr.replace(/,/g, ''));
  
  // Determine type
  let type = 'project_payment';
  if (lower.includes('retainer') || lower.includes('monthly')) type = 'retainer';
  if (lower.includes('consult') || lower.includes('advice')) type = 'consultation';
  
  // Extract description
  let description = '';
  const afterAmount = text.replace(/₹?[\d,]+/i, '').trim();
  if (afterAmount.includes('ke liye') || afterAmount.includes('for')) {
    const descMatch = afterAmount.match(/(?:ke liye|for)\s+(.+)/i);
    description = descMatch?.[1] || 'Project payment';
  }
  
  return {
    clientName,
    amount,
    type,
    description: description || 'Project payment',
    date: new Date().toISOString().split('T')[0],
  };
}

// ─── Record Freelance Income ────────────────────────────────────────
export async function recordIncome(userId, incomeData) {
  try {
    const { clientName, amount, type, description, date } = incomeData;
    
    // Find or create client
    let { data: existingClient } = await supabase
      .from('freelancer_clients')
      .select('*')
      .eq('user_id', userId)
      .ilike('client_name', clientName)
      .single();
    
    if (!existingClient) {
      const { data: newClient, error: clientErr } = await supabase
        .from('freelancer_clients')
        .insert({ user_id: userId, client_name: clientName })
        .select()
        .single();
      
      if (clientErr) throw clientErr;
      existingClient = newClient;
    }
    
    // Record income
    const { data: income, error: incomeErr } = await supabase
      .from('freelancer_incomes')
      .insert({
        user_id: userId,
        client_id: existingClient.id,
        amount,
        type,
        description,
        date,
      })
      .select()
      .single();
    
    if (incomeErr) throw incomeErr;
    
    // Update client's annual total
    const { data: allIncomes } = await supabase
      .from('freelancer_incomes')
      .select('amount')
      .eq('client_id', existingClient.id);
    
    const annualTotal = (allIncomes || []).reduce((s, i) => s + parseFloat(i.amount), 0);
    
    await supabase
      .from('freelancer_clients')
      .update({
        annual_total: annualTotal,
        last_payment_date: date,
      })
      .eq('id', existingClient.id);
    
    // Also record as transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      description: `${clientName} — ${description}`,
      amount: amount,
      type: 'credit',
      category: 'freelance',
    });
    
    return {
      success: true,
      income,
      client: existingClient,
      tdsAlert: annualTotal >= 100000 ? 'TDS threshold reached' : null,
    };
  } catch (error) {
    console.error('[Freelancer] Record income error:', error);
    return { success: false, error: error.message };
  }
}

// ─── Get Freelancer Dashboard Data ─────────────────────────────────
export async function getFreelancerDashboard(userId) {
  try {
    // Get clients
    const { data: clients } = await supabase
      .from('freelancer_clients')
      .select('*')
      .eq('user_id', userId)
      .order('annual_total', { ascending: false });
    
    // Get recent incomes
    const { data: incomes } = await supabase
      .from('freelancer_incomes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(20);
    
    // Calculate totals
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const thisMonthIncomes = (incomes || []).filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    
    const totalThisMonth = thisMonthIncomes.reduce((s, i) => s + parseFloat(i.amount), 0);
    const totalYTD = (incomes || []).reduce((s, i) => s + parseFloat(i.amount), 0);
    
    // TDS alerts
    const tdsAlerts = (clients || []).filter(c => c.annual_total >= 100000).map(c => ({
      client: c.client_name,
      total: c.annual_total,
      message: `₹${c.annual_total.toLocaleString('en-IN')} this year — ask client to deduct TDS`,
    }));
    
    return {
      success: true,
      clients: clients || [],
      recentIncomes: incomes || [],
      stats: {
        totalClients: clients?.length || 0,
        thisMonth: Math.round(totalThisMonth),
        ytd: Math.round(totalYTD),
      },
      tdsAlerts,
    };
  } catch (error) {
    console.error('[Freelancer] Dashboard error:', error);
    return { success: false, error: error.message };
  }
}

// ─── Generate Invoice Number ────────────────────────────────────────
export async function generateInvoiceNumber(userId) {
  const year = new Date().getFullYear();
  
  // Get count of existing invoices this year
  const { data: existing } = await supabase
    .from('freelancer_incomes')
    .select('invoice_number')
    .eq('user_id', userId)
    .not('invoice_number', 'is', null);
  
  const thisYearInvoices = (existing || []).filter(i => i.invoice_number?.includes(year.toString()));
  const nextNumber = thisYearInvoices.length + 1;
  
  return `INV-${year}-${String(nextNumber).padStart(3, '0')}`;
}

// ─── Generate Invoice ──────────────────────────────────────────────
// Requires: pdfkit, user GSTIN, client details
export async function generateInvoice(userId, incomeId, invoiceData) {
  try {
    const { clientName, amount, description, gstPercent = 18 } = invoiceData;
    
    const baseAmount = amount;
    const gstAmount = Math.round(baseAmount * (gstPercent / 100));
    const total = baseAmount + gstAmount;
    
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(userId);
    
    // Get user profile for GSTIN
    const { data: profile } = await supabase
      .from('profiles')
      .select('gstin, name, phone')
      .eq('id', userId)
      .single();
    
    // Update income record with invoice number
    await supabase
      .from('freelancer_incomes')
      .update({
        invoice_number: invoiceNumber,
        gst_amount: gstAmount,
      })
      .eq('id', incomeId);
    
    // Invoice content (returns object for PDF generation)
    const invoice = {
      invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      from: {
        name: profile?.name || 'Freelancer',
        gstin: profile?.gstin || '',
        phone: profile?.phone || '',
      },
      to: {
        name: clientName,
      },
      items: [{
        description,
        amount: baseAmount,
        gst: gstAmount,
        total,
      }],
      subtotal: baseAmount,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      total,
    };
    
    return { success: true, invoice };
  } catch (error) {
    console.error('[Freelancer] Generate invoice error:', error);
    return { success: false, error: error.message };
  }
}

// ─── Check TDS Threshold ────────────────────────────────────────────
export async function checkTDSThreshold(userId, clientId) {
  try {
    const { data: client } = await supabase
      .from('freelancer_clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (!client) return { exceeded: false };
    
    const threshold = 100000;
    const exceeded = client.annual_total >= threshold;
    const remaining = Math.max(0, threshold - client.annual_total);
    
    return {
      exceeded,
      annualTotal: client.annual_total,
      threshold,
      remaining,
      message: exceeded
        ? `₹${client.annual_total.toLocaleString('en-IN')} exceeds ₹1L — TDS applies`
        : `₹${remaining.toLocaleString('en-IN')} remaining before TDS threshold`,
    };
  } catch (error) {
    return { exceeded: false, error: error.message };
  }
}

export function getClientSummary(incomes) {
  // Group incomes by client name
  const clientMap = {};
  
  for (const income of (incomes || [])) {
    const clientName = income.clientName || income.client_name || income.description?.split('—')[0]?.trim() || 'Unknown';
    
    if (!clientMap[clientName]) {
      clientMap[clientName] = {
        name: clientName,
        count: 0,
        totalIncome: 0,
        totalTDS: 0,
      };
    }
    
    clientMap[clientName].count++;
    clientMap[clientName].totalIncome += parseFloat(income.amount || 0);
    clientMap[clientName].totalTDS += parseFloat(income.tds_deducted || 0) || 0;
  }
  
  // Sort by total income descending
  return Object.values(clientMap).sort((a, b) => b.totalIncome - a.totalIncome);
}

export default {
  parseIncomeMessage,
  recordIncome,
  getFreelancerDashboard,
  generateInvoiceNumber,
  generateInvoice,
  checkTDSThreshold,
  getClientSummary,
};
