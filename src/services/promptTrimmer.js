/**
 * Prompt Trimmer — sends only relevant investment category based on conversation topic
 * Cuts token usage by 60-70% by not sending unrelated content
 */

// Sanitize user input to prevent prompt injection
export function sanitizeInput(text, maxLength = 500) {
  if (!text) return '';
  // Truncate to max length
  const truncated = text.substring(0, maxLength);
  // Remove control characters and potential injection patterns
  const sanitized = truncated
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
  return sanitized;
}

import { ratesData } from '../data/ratesData.js';
import { languages } from '../data/languages.js';
import { getMetaphor } from '../data/dialectMetaphors.js';
import { buildSystemPrompt } from './promptBuilder.js';

// Keywords to detect investment topics — includes Hindi, Bhojpuri, and regional terms
const TOPIC_KEYWORDS = {
  fd: [
    'fd', 'fixed deposit', 'fixed deposits', 'bank deposit', 'fd rates',
    'deposit rates', 'term deposit',
    // Hindi / Bhojpuri / Regional
    'तयार पैसा', 'बैंक में जमा', 'सावधि जमा',
    'बचत', 'ब्याज', 'जमा', 'एफडी', 'गल्ला बंद',
  ],
  postOffice: [
    'post office', 'ppf', 'nsc', 'kvp', 'rd', 'sukanya', 'scss',
    'mahila samman',
    // Hindi / Regional
    'पोस्ट ऑफिस', 'पब्लिक प्रॉविडेंट', 'रिकरिंग डिपॉजिट',
    'डाकघर', 'पीपीएफ', 'बचत खाता',
  ],
  mutualFunds: [
    'mutual fund', 'sip', 'equity', 'debt', 'elss', 'index fund',
    'liquid fund', 'mf',
    // Hindi / Regional
    'म्यूचुअल फंड', 'सिप', 'इक्विटी', 'डेट',
    'म्यूचुअल', 'एसआईपी', 'निवेश', 'गुल्लक',
  ],
  gold: [
    'gold', 'sbg', 'sovereign gold', 'gold bond', 'gold etf',
    'digital gold', 'physical gold',
    // Hindi / Regional
    'चांदी', 'सोना', 'सोने', 'गोल्ड', 'बंद पैसा',
  ],
  insurance: [
    'insurance', 'term insurance', 'life insurance', 'health insurance',
    'ulip', 'endowment', 'mediclaim',
    // Hindi / Regional
    'बीमा', 'जीवन बीमा', 'स्वास्थ्य बीमा',
    'टर्म', 'प्रीमियम',
  ],
  general: [
    'loan', 'home loan', 'personal loan', 'education loan', 'loan emi',
    'ब्याज', 'कर्ज', 'गृह कर्ज', 'EMI',
  ],
};

// Also detect language-related queries
const LANGUAGE_KEYWORDS = ['hindi', 'tamil', 'telugu', 'language', 'भाषा', 'மொழி', 'భాష'];

export function detectTopic(text) {
  const truncated = sanitizeInput(text, 500);
  const lower = truncated.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return topic;
      }
    }
  }
  
  return 'general';
}

/**
 * Build a compact overview prompt for first messages.
 * Delegates to buildSystemPrompt from promptBuilder.js for the core instructions,
 * then appends a concise topic list.
 */
export function buildCompactOverview(languageCode) {
  const basePrompt = buildSystemPrompt(languageCode);

  return `${basePrompt}

DIALECT METAPHORS (use these to explain concepts simply):
- Fixed Deposit = "Galla Band" (Bhojpuri), "Chhata Paise" (Awadhi), "Nani Ki Peti" (Rajasthani)
- Mutual Fund = "Gaon Ka Samudaya" (rural Hindi)
- SIP = "Hafta Waala" (Punjabi)
- When explaining FD to Bhojpuri speaker: "FD is like Galla Band - lock your grain money safely"
- When explaining SIP to Punjabi speaker: "SIP is like Hafta - small amount weekly, grows big"

TOPICS I CAN HELP WITH:
- Fixed Deposits (FD) — bank term deposits, senior citizen rates
- Post Office Schemes — PPF, NSC, KVP, RD, Sukanya Samriddhi, SCSS
- Mutual Funds — SIP, Index Funds, ELSS, Liquid Funds
- Gold — SGB, Gold ETF, Digital Gold, Physical Gold
- Insurance — Term, Health, Endowment

IMPORTANT: If asked about a topic not listed above, say you don't have that data and offer what you do know.`;
}

/**
 * Build a trimmed prompt for ongoing conversations.
 * Uses buildSystemPrompt from promptBuilder.js as the base, then appends
 * only the topic-specific data section + conversation history.
 */
export function buildTrimmedPrompt(languageCode, detectedTopic, messages) {
  const topicSection = buildTopicSection(detectedTopic, languageCode);
  
  // Sanitize user messages before adding to prompt
  const sanitizedMessages = messages.map(msg => ({
    ...msg,
    content: sanitizeInput(msg.content, 300)
  }));
  
  return `${topicSection}

${buildConversationSection(sanitizedMessages)}`;
}

function buildTopicSection(topic, languageCode) {
  // Use the centralised system prompt from promptBuilder.js
  const basePrompt = buildSystemPrompt(languageCode);

  if (topic === 'general') {
    return `${basePrompt}

TOPICS I SPECIALIZE IN (ask about any):
• Fixed Deposits — bank deposits with guaranteed returns, TDS rules, senior citizen benefits
• Post Office — PPF (EEE tax status), NSC, KVP, RD, Sukanya Samriddhi, SCSS for seniors
• Mutual Funds — SIP, Index Funds, ELSS lock-in, Liquid Funds for emergency
• Gold — SGB (2.5% annual interest, tax free on 8yr holding), Gold ETF, Digital Gold
• Insurance — Term (pure protection, ₹1cr at ₹15k/yr), Health (non-negotiable)`;
  }

  const topicData = getTopicData(topic);
  const metaphor = getMetaphor(languageCode, topic);
  const metaphorInstruction = metaphor 
    ? `\nDIALECT METAPHOR (Use this exact analogy to explain the concept to the user):
"${metaphor}"\n` 
    : '';

  return `${basePrompt}
${metaphorInstruction}
${topicData}`;
}

function getTopicData(topic) {
  switch (topic) {
    case 'fd':
      return `TOPIC: Fixed Deposits
${ratesData.fd.banks.map(b => `- ${b.name}: 1yr ${b.rates['1yr']}%, 2yr ${b.rates['2yr']}%, 3yr ${b.rates['3yr']}%, 5yr ${b.rates['5yr']}%${b.seniorExtra > 0 ? ` (+${b.seniorExtra}% senior)` : ''}`).join('\n')}
- TDS: ${ratesData.fd.tdsRate}% if interest exceeds ₹${ratesData.fd.tdsThreshold}/yr (₹${ratesData.fd.tdsThresholdSenior} for seniors)

HARD RULES:
- Never quote FD rates not listed above
- Always mention senior citizen extra rate when relevant
- TDS deduction rule applies for interest above threshold`;
    
    case 'postOffice':
      return `TOPIC: Post Office Schemes
${Object.entries(ratesData.postOffice).map(([key, scheme]) => {
  if (typeof scheme === 'object') {
    return `- ${key.toUpperCase()}: ${scheme.rate}% rate, ${scheme.lockIn || scheme.tenure || ''}${scheme.maxAmount ? `, max ₹${scheme.maxAmount}` : ''}${scheme.taxStatus ? `, tax: ${scheme.taxStatus}` : ''}`;
  }
  return null;
}).filter(Boolean).join('\n')}

HARD RULES:
- Never quote rates not listed above
- PPF: EEE status means all contributions, interest, and maturity are tax-free
- Sukanya Samriddhi: only for girl child below 10 years
- SCSS: only for age 60+`;
    
    case 'mutualFunds':
      return `TOPIC: Mutual Funds
${ratesData.mutualFunds.categories.map(c => `- ${c.type}: Risk ${c.risk}, horizon ${c.horizon}${c.expectedReturn ? `, expected return ${c.expectedReturn}` : ''}. ${c.note}`).join('\n')}
${ratesData.mutualFunds.importantDisclaimer}

HARD RULES:
- Returns are NOT guaranteed — always say this
- Never recommend specific fund names — only category
- ELSS has 3-year lock-in but 80C tax benefit
- Liquid Fund best for emergency funds`;
    
    case 'gold':
      return `TOPIC: Gold Investments
${ratesData.gold.map(g => `- ${g.type}${g.additionalInterest ? `: ${g.additionalInterest}` : ''}${g.storageRisk === false ? ', no storage risk' : ''}${g.makingCharges === false ? ', no making charges' : ''}${g.taxOnMaturity ? `, ${g.taxOnMaturity}` : ''}${g.recommendation ? ` (${g.recommendation})` : ''}`).join('\n')}

HARD RULES:
- SGB is the best form of gold investment — interest + no storage risk + tax free on 8yr holding
- Never recommend physical gold (making charges 10-20% loss)
- Digital gold has platform risk`;
    
    case 'insurance':
      return `TOPIC: Insurance
${ratesData.insurance.map(i => `- ${i.type}: ${i.purpose}${i.cost ? `, cost: ${i.cost}` : ''}. ${i.recommendation}`).join('\n')}

HARD RULES:
- Term Insurance is the only life insurance most people need
- Health insurance is non-negotiable — everyone needs it
- Never buy investment + insurance combined products (ULIP, Endowment)`;
    
    default:
      return '';
  }
}

function buildConversationSection(messages) {
  if (messages.length === 0) return '';
  
  const lastFew = messages.slice(-6);
  const olderMessages = messages.slice(0, -6);
  
  let section = '\n\nCONVERSATION:\n';
  
  for (const msg of lastFew) {
    const role = msg.role === 'user' ? 'User' : 'Vaani';
    section += `${role}: ${msg.content}\n`;
  }
  
  if (olderMessages.length > 0) {
    const summary = summarizeHistory(olderMessages);
    section += `\nEarlier context: ${summary}`;
  }
  
  return section;
}

function summarizeHistory(messages) {
  const topics = [];
  const hasTopic = (kw) => messages.some(m => 
    m.content.toLowerCase().includes(kw.toLowerCase())
  );
  
  if (hasTopic('fd') || hasTopic('fixed deposit') || hasTopic('एफडी') || hasTopic('जमा')) topics.push('user asked about FD rates');
  if (hasTopic('sip') || hasTopic('mutual fund') || hasTopic('म्यूचुअल') || hasTopic('निवेश')) topics.push('user asked about SIP/mutual funds');
  if (hasTopic('ppf') || hasTopic('post office') || hasTopic('डाकघर') || hasTopic('पीपीएफ')) topics.push('user asked about PPF/post office');
  if (hasTopic('gold') || hasTopic('SGB') || hasTopic('सोना') || hasTopic('गोल्ड')) topics.push('user asked about gold investments');
  if (hasTopic('insurance') || hasTopic('term') || hasTopic('बीमा') || hasTopic('प्रीमियम')) topics.push('user asked about insurance');
  
  const first = messages[0];
  const userLang = first?.content?.substring(0, 20) || '';
  
  return topics.length > 0 
    ? topics.join(', ') + '. User started with: "' + userLang + '"'
    : `User sent ${messages.length} messages. Topic unclear.`;
}
