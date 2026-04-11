import { languages } from '../data/languages.js';
import { ratesData } from '../data/ratesData.js';

export function buildSystemPrompt(languageCode) {
  // Find the language object
  const language = languages.find(lang => lang.code === languageCode) || languages[0];

  // Build SCRIPT_INSTRUCTION based on direction
  const SCRIPT_INSTRUCTION = language.direction === 'rtl'
    ? `Write in ${language.name} using ${language.script} script. Text direction is right to left.`
    : `Write in ${language.name} using ${language.script} script.`;

  // Build RATES_BLOCK from ratesData
  const RATES_BLOCK = buildRatesBlock();

  // Return complete system prompt
  return `You are Vaani, a personal finance assistant for Indians. You are like a trusted, knowledgeable friend — warm, honest, patient. Not a banker. Not a salesperson. A friend who genuinely wants to help.

CRITICAL LANGUAGE RULE:
${SCRIPT_INSTRUCTION}
Use simple everyday conversational words. Never use English financial jargon unless you immediately explain it in simple words. Never romanize. Match the user's tone exactly — casual if they are casual, formal if they are formal.

YOUR APPROACH — FOLLOW THIS STRICTLY:
1. Read the user's message carefully. Understand their situation, not just their question.
2. If you need to know more before giving good advice — their timeline, their amount, their risk comfort, their age — ask ONE clarifying question. Only one. Never a list of questions.
3. Acknowledge any life context they mention (wedding, retirement, job loss, illness) with genuine warmth before giving financial advice.
4. Give 2-3 clear options maximum. Never overwhelm.
5. Always use real rupee examples alongside percentages. "7% on ₹1 lakh = ₹7,000 extra per year" is more useful than "7% per annum."
6. End every piece of advice with one simple, concrete next step the person can take today.
7. If someone seems confused, ask "shall I explain this more simply?"

ANALOGIES TO USE:
- SIP = planting a tree monthly. Small effort, big tree over time.
- Emergency fund = spare tyre. You hope you never need it, but you must always have it.
- Insurance = raincoat. Buy it before the rain, not during.
- Compound interest = snowball rolling downhill. Gets bigger the longer it rolls.
- FD = predictable salary from your savings. Fixed, safe, guaranteed.
- Mutual fund = a basket of many shares. If one falls, others may rise.

WHAT YOU KNOW — USE ONLY THESE FACTS, NEVER MAKE UP RATES:
${RATES_BLOCK}

HARD RULES:
- NEVER quote a rate not in your knowledge base above. If asked about a bank or scheme not listed, say you don't have that data and offer what you do know.
- NEVER recommend a specific mutual fund scheme by name (Nippon, HDFC, Axis etc). Recommend the category only.
- NEVER guarantee mutual fund returns. Always say returns are market-linked and not guaranteed.
- If someone describes a suspicious investment (guaranteed 20% returns, chit fund, pyramid scheme), warn them clearly and kindly. This is a scam pattern.
- NEVER give legal or tax advice. For tax questions, say they should consult a CA.
- Stay in personal finance only. If asked anything else, warmly redirect: respond in their language that you only help with money questions, and ask what financial question you can help with.
- NEVER repeat the same advice twice in a conversation. If you already recommended FD, don't recommend it again — build on previous advice.`;
}

function buildRatesBlock() {
  const { fd, postOffice, mutualFunds, gold, insurance } = ratesData;

  let block = '';

  // Fixed Deposits (Banks)
  block += '**Fixed Deposits (Banks):**\n';
  fd.banks.forEach(bank => {
    block += `- ${bank.name}: 1yr ${bank.rates['1yr']}%, 2yr ${bank.rates['2yr']}%, 3yr ${bank.rates['3yr']}%, 5yr ${bank.rates['5yr']}%`;
    if (bank.seniorExtra > 0) {
      block += ` (Senior citizens get +${bank.seniorExtra}% extra)`;
    }
    block += '\n';
  });
  block += `- TDS: ${fd.tdsRate}% deducted if interest earned exceeds ₹${fd.tdsThreshold}/yr (₹${fd.tdsThresholdSenior} for senior citizens)\n\n`;

  // Post Office Schemes
  block += '**Post Office Schemes:**\n';
  
  // PPF
  block += `- PPF (Public Provident Fund): ${postOffice.ppf.rate}% rate, ${postOffice.ppf.lockIn} lock-in, min ₹${postOffice.ppf.minAmount}, max ₹${postOffice.ppf.maxAmount}/yr, tax status: ${postOffice.ppf.taxStatus} (EEE means interest, maturity amount all tax free), partial withdrawal allowed from ${postOffice.ppf.partialWithdrawal}\n`;
  
  // NSC
  block += `- NSC (National Savings Certificate): ${postOffice.nsc.rate}% rate, ${postOffice.nsc.lockIn} lock-in, tax status: ${postOffice.nsc.taxStatus}\n`;
  
  // KVP
  block += `- KVP (Kisan Vikas Patra): ${postOffice.kvp.rate}% rate, doubles in ${postOffice.kvp.doublingMonths} months, ${postOffice.kvp.lockIn}\n`;
  
  // Sukanya Samriddhi
  block += `- Sukanya Samriddhi: ${postOffice.sukanyaSamridhi.rate}% rate, for ${postOffice.sukanyaSamridhi.forAge}, maturity ${postOffice.sukanyaSamridhi.maturity}, max ₹${postOffice.sukanyaSamridhi.maxAmount}/yr, tax status: ${postOffice.sukanyaSamridhi.taxStatus}\n`;
  
  // SCSS
  block += `- SCSS (Senior Citizens Savings Scheme): ${postOffice.scss.rate}% rate, age ${postOffice.scss.forAge}, tenure ${postOffice.scss.tenure}, max ₹${postOffice.scss.maxAmount}, payout ${postOffice.scss.payoutFrequency}, tax benefit: ${postOffice.scss.taxBenefit}\n`;
  
  // RD
  block += `- RD (Recurring Deposit): ${postOffice.rd.rate}% rate, tenure ${postOffice.rd.tenure}, interest ${postOffice.rd.compounding}, min ₹${postOffice.rd.minAmount}\n`;
  
  // Mahila Samman
  block += `- Mahila Samman: ${postOffice.mahilaSamman.rate}% rate, ${postOffice.mahilaSamman.forGender}, max ₹${postOffice.mahilaSamman.maxAmount}, tenure ${postOffice.mahilaSamman.tenure}\n\n`;

  // Mutual Funds
  block += '**Mutual Funds:**\n';
  block += `- SIP: min amount ₹${mutualFunds.sip.minAmount}, frequency ${mutualFunds.sip.frequency}\n\n`;
  
  block += '**Categories:**\n';
  mutualFunds.categories.forEach(cat => {
    block += `- ${cat.type}: Risk ${cat.risk}, horizon ${cat.horizon}`;
    if (cat.expectedReturn) block += `, expected return ${cat.expectedReturn}`;
    if (cat.expenseRatio) block += `, expense ratio ${cat.expenseRatio}`;
    if (cat.taxBenefit) block += `, tax benefit: ${cat.taxBenefit}`;
    block += `. ${cat.note}\n`;
  });
  block += `\n*${mutualFunds.importantDisclaimer}*\n\n`;

  // Gold
  block += '**Gold:**\n';
  gold.forEach(g => {
    block += `- ${g.type}`;
    if (g.additionalInterest) block += `: ${g.additionalInterest}`;
    if (g.storageRisk === false) block += ', no storage risk';
    if (g.makingCharges === false) block += ', no making charges';
    if (g.taxOnMaturity) block += `, ${g.taxOnMaturity}`;
    if (g.demat) block += ', demat account needed';
    if (g.expenseRatio) block += `, ${g.expenseRatio} expense ratio`;
    if (g.minAmount) block += `, can buy from ₹${g.minAmount}`;
    if (g.platformRisk) block += ', platform risk';
    if (g.makingCharges && typeof g.makingCharges === 'string') block += `, ${g.makingCharges} at purchase`;
    if (g.storageRisk === true) block += ', storage risk';
    if (g.recommendation) block += ` (${g.recommendation})`;
    block += '\n';
  });
  block += '\n';

  // Insurance
  block += '**Insurance:**\n';
  insurance.forEach(i => {
    block += `- ${i.type}: ${i.purpose}`;
    if (i.returns) block += `, ${i.returns}`;
    if (i.cost) block += `, cost: ${i.cost}`;
    if (i.charges) block += `, charges: ${i.charges}`;
    if (i.minimumCover) block += `, minimum ${i.minimumCover} recommended`;
    if (i.recommendation) block += `. ${i.recommendation}`;
    block += '\n';
  });

  return block;
}
