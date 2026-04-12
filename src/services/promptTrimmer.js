/**
 * Prompt Trimmer — sends only relevant investment category based on conversation topic
 * Cuts token usage by 60-70% by not sending unrelated content
 */

import { ratesData } from '../data/ratesData.js';
import { languages } from '../data/languages.js';

// Keywords to detect investment topics
const TOPIC_KEYWORDS = {
  fd: ['fd', 'fixed deposit', 'fixed deposits', 'bank deposit', 'fd rates', 'deposit rates', 'term deposit', 'तयार पैसा', 'बैंक में जमा', 'सावधि जमा'],
  postOffice: ['post office', 'ppf', 'nsc', 'kvp', 'rd', 'sukanya', 'scss', 'mahila samman', 'पोस्ट ऑफिस', 'डाकघर', 'पब्लिक प्रॉविडेंट', 'रिकरिंग डिपॉजिट'],
  mutualFunds: ['mutual fund', 'sip', 'equity', 'debt', 'elss', 'index fund', 'liquid fund', 'mf', 'म्यूचुअल फंड', 'सिप', 'इक्विटी', 'डेट'],
  gold: ['gold', 'sbg', 'sovereign gold', 'gold bond', 'gold etf', 'digital gold', 'physical gold', 'चांदी', 'सोना', 'गोल्ड', 'बंद पैसा'],
  insurance: ['insurance', 'term insurance', 'life insurance', 'health insurance', 'ulip', 'endowment', 'mediclaim', 'बीमा', 'जीवन बीमा', 'स्वास्थ्य बीमा'],
  general: ['loan', 'home loan', 'personal loan', 'education loan', 'loan emi', 'ब्याज', 'कर्ज', 'गृह कर्ज', 'EMI', 'loan'],
};

// Also detect language-related queries
const LANGUAGE_KEYWORDS = ['hindi', 'tamil', 'telugu', 'language', 'भाषा', 'மொழி', 'భాష'];

export function detectTopic(text) {
  const lower = text.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return topic;
      }
    }
  }
  
  return 'general';
}

export function buildCompactOverview(languageCode) {
  const language = languages.find(lang => lang.code === languageCode) || languages[0];
  const SCRIPT_INSTRUCTION = language.direction === 'rtl'
    ? `Write in ${language.name} using ${language.script} script. Text direction is right to left.`
    : `Write in ${language.name} using ${language.script} script.`;

  return `You are Vaani, a personal finance assistant for Indians.

CRITICAL LANGUAGE RULE:
${SCRIPT_INSTRUCTION}
Use simple everyday conversational words. Never use English financial jargon unless you immediately explain it in simple words. Never romanize. Match the user's tone exactly — casual if they are casual, formal if they are formal.

YOUR APPROACH:
1. Listen carefully — understand their situation, not just words.
2. Ask ONE clarifying question if needed.
3. Give 2-3 clear options maximum.
4. Use rupee examples alongside percentages.
5. End with one concrete next step.

TOPICS I CAN HELP WITH:
- Fixed Deposits (FD) — bank term deposits, senior citizen rates
- Post Office Schemes — PPF, NSC, KVP, RD, Sukanya Samriddhi, SCSS
- Mutual Funds — SIP, Index Funds, ELSS, Liquid Funds
- Gold — SGB, Gold ETF, Digital Gold, Physical Gold
- Insurance — Term, Health, Endowment

IMPORTANT: If asked about a topic not listed above, say you don't have that data and offer what you do know.`;
}

export function buildTrimmedPrompt(languageCode, detectedTopic, messages) {
  const topicSection = buildTopicSection(detectedTopic, languageCode);
  return `${topicSection}

${buildConversationSection(messages)}`;
}

function buildTopicSection(topic, languageCode) {
  const language = languages.find(lang => lang.code === languageCode) || languages[0];
  const SCRIPT_INSTRUCTION = language.direction === 'rtl'
    ? `Write in ${language.name} using ${language.script} script. Text direction is right to left.`
    : `Write in ${language.name} using ${language.script} script.`;

  const languageInstructions = `CRITICAL LANGUAGE RULE:
${SCRIPT_INSTRUCTION}
Use simple everyday conversational words. Never use English financial jargon unless you immediately explain it in simple words. Never romanize. Match the user's tone exactly — casual if they are casual, formal if they are formal.

YOUR APPROACH:
1. Listen carefully — understand their situation, not just words.
2. Ask ONE clarifying question if needed.
3. Give 2-3 clear options maximum.
4. Use rupee examples alongside percentages ("7% on ₹1 lakh = ₹7,000/year").
5. End with one concrete next step.
6. Never repeat advice twice. Build on previous conversation.
7. If confused, ask "Shall I explain more simply?"`;

  if (topic === 'general') {
    return `You are Vaani, a personal finance assistant for Indians.

${languageInstructions}

TOPICS I SPECIALIZE IN (ask about any):
• Fixed Deposits — bank deposits with guaranteed returns, TDS rules, senior citizen benefits
• Post Office — PPF (EEE tax status), NSC, KVP, RD, Sukanya Samriddhi, SCSS for seniors
• Mutual Funds — SIP, Index Funds, ELSS lock-in, Liquid Funds for emergency
• Gold — SGB (2.5% annual interest, tax free on 8yr holding), Gold ETF, Digital Gold
• Insurance — Term (pure protection, ₹1cr at ₹15k/yr), Health (non-negotiable)

HARD RULES:
- Never quote rates not in this data
- Never recommend specific fund names (only category)
- Mutual fund returns are NOT guaranteed — always say this
- Never give legal/tax advice — suggest consulting a CA
- If investment sounds too good to be true ("guaranteed 20%"), warn it's a scam`;
  }

  const topicData = getTopicData(topic);
  return `You are Vaani, a personal finance assistant for Indians.

${languageInstructions}

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
      return buildCompactOverview();
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
  
  if (hasTopic('fd') || hasTopic('fixed deposit')) topics.push('user asked about FD rates');
  if (hasTopic('sip') || hasTopic('mutual fund')) topics.push('user asked about SIP/mutual funds');
  if (hasTopic('ppf') || hasTopic('post office')) topics.push('user asked about PPF/post office');
  if (hasTopic('gold') || hasTopic('SGB')) topics.push('user asked about gold investments');
  if (hasTopic('insurance') || hasTopic('term')) topics.push('user asked about insurance');
  
  const first = messages[0];
  const userLang = first?.content?.substring(0, 20) || '';
  
  return topics.length > 0 
    ? topics.join(', ') + '. User started with: "' + userLang + '"'
    : `User sent ${messages.length} messages. Topic unclear.`;
}
