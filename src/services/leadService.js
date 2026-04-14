/**
 * Lead Capture Service
 * Stores user interest in financial products for B2B lead sharing.
 * For demo: localStorage + optional server save.
 */

const LEAD_STORAGE_KEY = 'vaani_leads';

/**
 * Generate a unique lead ID.
 */
function generateLeadId() {
  return `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Capture a lead — stores in localStorage and optionally sends to server.
 * 
 * @param {Object} params
 * @param {string} params.name - User's name (optional)
 * @param {string} params.phone - User's phone number (required for submission)
 * @param {string} params.pincode - User's pincode
 * @param {string} params.productCategory - Product category (fd, insurance, pension, etc.)
 * @param {string} params.productId - Specific product/scheme ID (optional)
 * @param {string} params.language - User's language
 * @param {Array} params.answers - Extra answers from product questions
 * @param {string} params.source - 'chat' | 'landing' | 'dashboard'
 * @returns {Promise<Object>} Saved lead object
 */
export async function captureLead({ name, phone, pincode, productCategory, productId, language, answers = [], source = 'chat' }) {
  const lead = {
    id: generateLeadId(),
    name: name || null,
    phone: phone || null,
    pincode: pincode || localStorage.getItem('vaani_pincode') || null,
    productCategory,
    productId: productId || null,
    language: language || localStorage.getItem('vaani_language') || 'hi',
    answers,
    source,
    status: phone ? 'contactable' : 'interested',
    createdAt: new Date().toISOString(),
    createdAtRelative: getRelativeTime(),
  };

  // Store in localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(LEAD_STORAGE_KEY) || '[]');
    // Don't duplicate leads for same category + pincode combo (within same session)
    const isDuplicate = existing.some(l => 
      l.productCategory === productCategory && 
      l.pincode === pincode &&
      l.status !== 'contactable'
    );
    
    if (!isDuplicate) {
      existing.push(lead);
      localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(existing));
    }
  } catch (e) {
    console.warn('Failed to save lead locally:', e);
  }

  // Validate phone before sending
  if (phone && !/^[6-9]\d{9}$/.test(phone)) {
    // Invalid format — skip server save, keep local only
    return { id: lead.id, status: 'invalid_phone' };
  }

  // Try to send to server (don't block if it fails)
  if (phone && pincode) {
    try {
      await fetch((import.meta.env.VITE_API_URL || '') + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
    } catch (e) {
      // Server not available — localStorage is enough for demo
    }
  }

  return lead;
}

/**
 * Get all captured leads (for dashboard/admin view).
 */
export function getLeads() {
  try {
    return JSON.parse(localStorage.getItem(LEAD_STORAGE_KEY) || '[]');
  } catch (e) { console.warn('[leadService] Could not get leads:', e); return []; }
}

/**
 * Get lead count by category.
 */
export function getLeadStats() {
  const leads = getLeads();
  const stats = {
    total: leads.length,
    contactable: leads.filter(l => l.status === 'contactable').length,
    byCategory: {},
  };
  
  for (const lead of leads) {
    stats.byCategory[lead.productCategory] = (stats.byCategory[lead.productCategory] || 0) + 1;
  }
  
  return stats;
}

/**
 * Delete a lead.
 */
export function deleteLead(leadId) {
  try {
    const existing = JSON.parse(localStorage.getItem(LEAD_STORAGE_KEY) || '[]');
    const filtered = existing.filter(l => l.id !== leadId);
    localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) { console.warn('[leadService] Could not delete lead:', e); }
}

/**
 * Detect product interest from text and auto-capture lead.
 * @param {string} text - User message text
 * @param {Object} options - { language }
 */
export async function detectAndCaptureLead(text, { language } = {}) {
  const category = detectProductInterest(text);
  if (!category) return null;
  
  // Don't capture for skill/scheme categories (too noisy)
  if (['skill', 'scheme'].includes(category)) return null;
  
  return captureLead({ productCategory: category, language });
}

/**
 * Format relative time in Hindi/English.
 */
function getRelativeTime() {
  const now = new Date();
  const istOffset = 5.5 * 60; // IST = UTC+5:30
  const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (istOffset * 60000));
  return istTime.toLocaleString('hi-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Detect if user is showing product interest from their message.
 */
export function detectProductInterest(text) {
  const lower = text.toLowerCase();
  
  const interestMap = {
    fd: /fd|fixed deposit|सावधि|savdhi|bank deposit/i,
    insurance: /बीमा|insurance|jeevan|suraksha|bima/i,
    pension: /पेंशन|pension|retirement|old age/i,
    loan: /लोन|loan|कर्ज|karj|mudra/i,
    savings: /बचत|saving|deposit|sukanya/i,
    skill: /skill|training|naukri|job|rozgar/i,
    scheme: /scheme|योजना|scam|स्कीम|govt|government/i,
  };

  for (const [category, pattern] of Object.entries(interestMap)) {
    if (pattern.test(lower)) {
      return category;
    }
  }
  return null;
}

export default { captureLead, getLeads, getLeadStats, deleteLead, detectProductInterest, detectAndCaptureLead };
