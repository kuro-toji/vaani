/**
 * Eligibility Checker Service
 * Step-by-step conversational eligibility check for gov insurance/pension schemes.
 * Uses a state machine approach: stores the check state and progresses through questions.
 */

import { captureLead, detectProductInterest } from './leadService.js';

/**
 * Eligibility check state keys stored in sessionStorage.
 */
const CHECK_STATE_KEY = 'vaani_eligibility_check';

/**
 * Start or continue an eligibility check.
 * 
 * @param {Object} params
 * @param {string} params.intent - 'pmjjby' | 'pmsby' | 'atal_pension' | 'mudra' | 'stand_up' | 'sukanya'
 * @param {string} params.userMessage - User's current message (may contain answers)
 * @param {string} params.language - Language code
 * @param {string} params.pincode - User's pincode
 * @returns {Promise<Object>} { step, question, eligibility, scheme, done, response }
 */
export async function checkEligibility({ intent, userMessage, language = 'hi', pincode }) {
  const lang = language;
  
  // Initialize or resume check state
  let state = loadState();
  
  // If new intent, start fresh
  if (intent && intent !== state.intent) {
    state = { intent, step: 0, answers: {}, started: true };
    saveState(state);
  }
  
  if (!state.started) {
    return { done: true, response: null };
  }

  // Process user's answer if provided
  if (userMessage && state.step > 0) {
    state.answers[getStepField(state.intent, state.step)] = userMessage;
    saveState(state);
  }

  // Get the next question or final result
  const nextStep = state.step + 1;
  const { questions, rules, resultText } = ELIGIBILITY_FLOWS[state.intent];
  
  if (nextStep > questions.length) {
    // Evaluate eligibility
    const eligible = evaluateEligibility(state.intent, state.answers, pincode);
    clearState();
    
    return {
      done: true,
      eligibility: eligible,
      response: formatEligibilityResponse(state.intent, eligible, state.answers, lang),
      scheme: state.intent,
      answers: state.answers,
    };
  }

  const question = questions[nextStep - 1];
  
  // Save updated step
  state.step = nextStep;
  saveState(state);

  return {
    done: false,
    step: nextStep,
    totalSteps: questions.length,
    question: question.text[lang] || question.text.en,
    questionHint: question.hint?.[lang] || question.hint?.en,
    field: question.field,
    response: null,
  };
}

/**
 * Cancel an ongoing eligibility check.
 */
export function cancelEligibilityCheck() {
  clearState();
}

/**
 * Eligibility flow definitions.
 */
const ELIGIBILITY_FLOWS = {
  pmjjby: {
    name: { hi: 'PM जीवन ज्योति बीमा', en: 'PM Jeevan Jyoti Bima' },
    questions: [
      { field: 'age', step: 1, text: { hi: 'आपकी उम्र क्या है?', en: 'What is your age?' }, hint: { hi: '18 से 50 साल के बीच बोलें', en: 'Speak a number between 18 and 50' } },
      { field: 'has_bank', step: 2, text: { hi: 'क्या आपका बैंक खाता है?', en: 'Do you have a bank account?' }, hint: { hi: 'हाँ या ना बोलें', en: 'Say yes or no' } },
      { field: 'has_existing', step: 3, text: { hi: 'क्या आपके पास पहले से कोई जीवन बीमा है?', en: 'Do you already have life insurance?' }, hint: { hi: 'हाँ या ना बोलें', en: 'Say yes or no' } },
    ],
    rules: (answers) => {
      const age = parseInt(answers.age);
      if (age < 18 || age > 50) return { eligible: false, reason: { hi: 'आयु सीमा 18-50 वर्ष है।', en: 'Age must be between 18-50 years.' } };
      if (answers.has_bank?.toLowerCase().includes('न') || answers.has_bank?.toLowerCase().includes('no')) {
        return { eligible: false, reason: { hi: 'बैंक खाता ज़रूरी है। Jan Dhan खाता खोलें।', en: 'Bank account is required. Open a Jan Dhan account first.' } };
      }
      return { eligible: true, reason: null };
    },
  },

  pmsby: {
    name: { hi: 'PM सुरक्षा बीमा', en: 'PM Suraksha Bima' },
    questions: [
      { field: 'age', step: 1, text: { hi: 'आपकी उम्र क्या है?', en: 'What is your age?' }, hint: { hi: '18 से 70 साल के बीच बोलें', en: 'Speak a number between 18 and 70' } },
      { field: 'has_bank', step: 2, text: { hi: 'क्या आपका बैंक खाता है?', en: 'Do you have a bank account?' }, hint: { hi: 'हाँ या ना बोलें', en: 'Say yes or no' } },
    ],
    rules: (answers) => {
      const age = parseInt(answers.age);
      if (age < 18 || age > 70) return { eligible: false, reason: { hi: 'आयु सीमा 18-70 वर्ष है।', en: 'Age must be between 18-70 years.' } };
      if (answers.has_bank?.toLowerCase().includes('न') || answers.has_bank?.toLowerCase().includes('no')) {
        return { eligible: false, reason: { hi: 'बैंक खाता ज़रूरी है।', en: 'Bank account is required.' } };
      }
      return { eligible: true, reason: null };
    },
  },

  atal_pension: {
    name: { hi: 'अटल पेंशन', en: 'Atal Pension Yojana' },
    questions: [
      { field: 'age', step: 1, text: { hi: 'आपकी उम्र क्या है?', en: 'What is your age?' }, hint: { hi: '18 से 40 साल के बीच बोलें', en: 'Between 18 and 40' } },
      { field: 'sector', step: 2, text: { hi: 'आप क्या काम करते हैं?', en: 'What do you do?' }, hint: { hi: 'जैसे: मजदूर, दुकानदार, किसान, नौकरी', en: 'Like: labourer, shopkeeper, farmer, employee' } },
      { field: 'govt_pension', step: 3, text: { hi: 'क्या आपको सरकारी पेंशन मिलती है?', en: 'Do you get a government pension?' }, hint: { hi: 'हाँ या ना बोलें', en: 'Say yes or no' } },
    ],
    rules: (answers) => {
      const age = parseInt(answers.age);
      if (age < 18 || age > 40) return { eligible: false, reason: { hi: 'आयु सीमा 18-40 वर्ष है।', en: 'Age must be between 18-40 years.' } };
      if (answers.govt_pension?.toLowerCase().includes('हा') || answers.govt_pension?.toLowerCase().includes('yes')) {
        return { eligible: false, reason: { hi: 'सरकारी पेंशनधारी इस योजना में नहीं आते।', en: 'Government pensioners are not eligible.' } };
      }
      return { eligible: true, reason: null };
    },
  },

  mudra: {
    name: { hi: 'प्रधानमंत्री मुद्रा योजना', en: 'PM MUDRA Yojana' },
    questions: [
      { field: 'business_type', step: 1, text: { hi: 'आपका व्यापार क्या है?', en: 'What is your business?' }, hint: { hi: 'जैसे: चाट की दुकान, कपड़ा, मवेशी, मरम्मत', en: 'Like: chat shop, clothes, cattle, repair' } },
      { field: 'turnover', step: 2, text: { hi: 'साल में कितना व्यापार होता है (रुपये में)?', en: 'Annual turnover in rupees?' }, hint: { hi: 'अनुमानित बताएं', en: 'Give your estimate' } },
      { field: 'existing_loan', step: 3, text: { hi: 'क्या पहले से MUDRA लोन लिया है?', en: 'Have you taken a MUDRA loan before?' }, hint: { hi: 'हाँ या ना', en: 'Yes or no' } },
    ],
    rules: (answers) => {
      // MUDRA available to all with small business, turnover < ₹10L
      const turnover = parseInt((answers.turnover || '0').replace(/[^\d]/g, ''));
      if (turnover > 10000000) {
        return { eligible: false, reason: { hi: 'वार्षिक टर्नओवर ₹10 लाख से कम होना चाहिए।', en: 'Annual turnover must be less than ₹10 lakh.' } };
      }
      return { eligible: true, reason: null };
    },
  },

  sukanya: {
    name: { hi: 'सुकन्या समृद्धि', en: 'Sukanya Samriddhi' },
    questions: [
      { field: 'daughter_age', step: 1, text: { hi: 'बेटी की उम्र क्या है?', en: "What is your daughter's age?" }, hint: { hi: '0 से 10 साल के बीच', en: 'Between 0 and 10 years' } },
      { field: 'already_account', step: 2, text: { hi: 'पहले से सुकन्या खाता है?', en: 'Do you already have a Sukanya account?' }, hint: { hi: 'हाँ या ना', en: 'Yes or no' } },
    ],
    rules: (answers) => {
      const age = parseInt(answers.daughter_age);
      if (age < 0 || age > 10) return { eligible: false, reason: { hi: 'बेटी की उम्र 0-10 साल के बीच होनी चाहिए।', en: "Daughter must be between 0-10 years old." } };
      if (answers.already_account?.toLowerCase().includes('हा') || answers.already_account?.toLowerCase().includes('yes')) {
        return { eligible: false, reason: { hi: 'एक परिवार से अधिकतम 2 सुकन्या खाते।', en: 'Maximum 2 Sukanya accounts per family.' } };
      }
      return { eligible: true, reason: null };
    },
  },
};

function evaluateEligibility(intent, answers, pincode) {
  const flow = ELIGIBILITY_FLOWS[intent];
  if (!flow) return { eligible: false, reason: { hi: 'योजना नहीं मिली', en: 'Scheme not found' } };
  return flow.rules(answers, pincode);
}

function formatEligibilityResponse(intent, result, answers, lang) {
  const flow = ELIGIBILITY_FLOWS[intent];
  const name = flow.name[lang] || flow.name.en;
  
  if (result.eligible) {
    return lang === 'hi'
      ? `✅ आप ${name} के लिए पात्र हैं! आप nearest bank branch या CSC center जाकर apply कर सकते हैं। अपना Aadhaar और bank passbook ले जाएं।`
      : `✅ You are eligible for ${name}! Visit your nearest bank branch or CSC center to apply. Carry your Aadhaar and bank passbook.`;
  } else {
    const reason = result.reason?.[lang] || result.reason?.en || '';
    return lang === 'hi'
      ? `❌ ${name} के लिए पात्र नहीं। ${reason} और information के लिए अपने bank से contact करें।`
      : `❌ Not eligible for ${name}. ${reason} Contact your bank for more information.`;
  }
}

function getStepField(intent, step) {
  const flow = ELIGIBILITY_FLOWS[intent];
  if (!flow) return null;
  const q = flow.questions.find(q => q.step === step);
  return q?.field;
}

function loadState() {
  try {
    const saved = sessionStorage.getItem(CHECK_STATE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) { console.warn('[eligibilityService] Could not load state:', e); return {}; }
}

function saveState(state) {
  try {
    sessionStorage.setItem(CHECK_STATE_KEY, JSON.stringify(state));
  } catch (e) { console.warn('[eligibilityService] Could not save state:', e); }
}

function clearState() {
  try {
    sessionStorage.removeItem(CHECK_STATE_KEY);
  } catch (e) { console.warn('[eligibilityService] Could not clear state:', e); }
}

/**
 * Detect insurance/pension eligibility check from user message.
 */
export function detectEligibilityIntent(text) {
  const lower = text.toLowerCase();
  
  const intentMap = {
    pmjjby: ['pmjjby', 'जीवन ज्योति', 'jeevan jyoti', 'life insurance scheme', 'jiivan'],
    pmsby: ['pmsby', 'suraksha', 'सुरक्षा बीमा', 'accident insurance'],
    atal_pension: ['atal pension', 'अटल पेंशन', 'pension yojana', 'retirement scheme'],
    mudra: ['mudra loan', 'मुद्रा', 'small business loan', 'trader loan'],
    sukanya: ['sukanya', 'सुकन्या', 'daughter scheme', 'beti scheme'],
  };

  for (const [intent, keywords] of Object.entries(intentMap)) {
    if (keywords.some(k => lower.includes(k))) {
      return intent;
    }
  }
  return null;
}

export default { checkEligibility, cancelEligibilityCheck, detectEligibilityIntent };
