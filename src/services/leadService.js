/**
 * Lead Service — Captures financial product intent from conversations
 * for the B2B bank partner dashboard.
 */

const LEADS_KEY = 'vaani_leads';

const INTENT_PATTERNS = [
  { intent: 'open_fd', keywords: ['open fd', 'fd open', 'fd kholna', 'एफडी खोलना', 'fixed deposit open'], product: 'Fixed Deposit' },
  { intent: 'start_sip', keywords: ['start sip', 'sip start', 'sip shuru', 'सिप शुरू'], product: 'Mutual Fund SIP' },
  { intent: 'buy_insurance', keywords: ['buy insurance', 'insurance chahiye', 'बीमा लेना', 'term plan'], product: 'Insurance' },
  { intent: 'open_ppf', keywords: ['open ppf', 'ppf account', 'ppf kholna', 'पीपीएफ'], product: 'PPF Account' },
  { intent: 'home_loan', keywords: ['home loan', 'ghar ka loan', 'housing loan', 'गृह ऋण'], product: 'Home Loan' },
  { intent: 'gold_bond', keywords: ['gold bond', 'sgb', 'sovereign gold', 'सोने का बॉन्ड'], product: 'Sovereign Gold Bond' },
  { intent: 'health_insurance', keywords: ['health insurance', 'mediclaim', 'स्वास्थ्य बीमा'], product: 'Health Insurance' },
  { intent: 'savings_account', keywords: ['new account', 'bank account', 'jan dhan', 'खाता खोलना'], product: 'Savings Account' },
];

function loadLeads() {
  try {
    const data = localStorage.getItem(LEADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveLeads(leads) {
  try {
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  } catch (e) { console.warn('Failed to save leads:', e); }
}

/**
 * Scan a message for financial product intent and capture as a lead.
 */
export function detectAndCaptureLead(message, userProfile = {}) {
  const text = message.toLowerCase();
  
  for (const pattern of INTENT_PATTERNS) {
    if (pattern.keywords.some(kw => text.includes(kw))) {
      const lead = {
        id: Date.now().toString(),
        intent: pattern.intent,
        product: pattern.product,
        originalMessage: message.substring(0, 200),
        timestamp: new Date().toISOString(),
        region: userProfile.region || 'Unknown',
        language: userProfile.language || 'Hindi',
        status: 'new', // new → contacted → converted
      };
      
      const leads = loadLeads();
      // Avoid duplicates within 1 hour
      const recent = leads.find(l => 
        l.intent === lead.intent && 
        (Date.now() - new Date(l.timestamp).getTime()) < 3600000
      );
      if (!recent) {
        leads.push(lead);
        saveLeads(leads);
      }
      return lead;
    }
  }
  return null;
}

/**
 * Get all captured leads for the partner dashboard.
 */
export function getAllLeads() {
  return loadLeads();
}

/**
 * Get lead analytics summary.
 */
export function getLeadAnalytics() {
  const leads = loadLeads();
  
  // By product
  const byProduct = {};
  leads.forEach(l => {
    byProduct[l.product] = (byProduct[l.product] || 0) + 1;
  });
  
  // By region
  const byRegion = {};
  leads.forEach(l => {
    byRegion[l.region] = (byRegion[l.region] || 0) + 1;
  });
  
  // By day (last 7 days)
  const byDay = {};
  const now = Date.now();
  leads.forEach(l => {
    const day = l.timestamp.split('T')[0];
    const daysAgo = Math.floor((now - new Date(l.timestamp).getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo <= 7) {
      byDay[day] = (byDay[day] || 0) + 1;
    }
  });
  
  return {
    total: leads.length,
    byProduct,
    byRegion,
    byDay,
    conversionRate: leads.filter(l => l.status === 'converted').length / Math.max(1, leads.length),
  };
}

/**
 * Update lead status.
 */
export function updateLeadStatus(id, status) {
  const leads = loadLeads();
  const lead = leads.find(l => l.id === id);
  if (lead) {
    lead.status = status;
    saveLeads(leads);
  }
  return leads;
}

export default { detectAndCaptureLead, getAllLeads, getLeadAnalytics, updateLeadStatus };
