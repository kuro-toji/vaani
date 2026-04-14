/**
 * Lead configuration — product categories and partner types.
 * These determine what "interest tags" are captured.
 */

export const PRODUCT_CATEGORIES = {
  fd: {
    id: 'fd',
    name: { hi: 'FD (Fixed Deposit)', en: 'Fixed Deposit' },
    icon: '🏦',
    questions: [
      { id: 'amount', question: { hi: 'आप कितना invest करना चाहते हैं?', en: 'How much do you want to invest?' }, type: 'text', optional: true },
    ],
  },
  savings: {
    id: 'savings',
    name: { hi: 'बचत योजना', en: 'Savings Scheme' },
    icon: '🏠',
    questions: [
      { id: 'goal', question: { hi: 'आपका goal क्या है?', en: 'What is your goal?' }, type: 'text', optional: true },
    ],
  },
  insurance: {
    id: 'insurance',
    name: { hi: 'बीमा', en: 'Insurance' },
    icon: '🛡️',
    questions: [
      { id: 'coverage', question: { hi: 'कितना coverage चाहिए?', en: 'How much coverage do you need?' }, type: 'text', optional: true },
    ],
  },
  pension: {
    id: 'pension',
    name: { hi: 'पेंशन', en: 'Pension' },
    icon: '👴',
    questions: [
      { id: 'retirement_age', question: { hi: 'आपकी उम्र क्या है?', en: 'What is your age?' }, type: 'text', optional: true },
    ],
  },
  loan: {
    id: 'loan',
    name: { hi: 'लोन/ऋण', en: 'Loan' },
    icon: '💳',
    questions: [
      { id: 'amount', question: { hi: 'कितना लोन चाहिए?', en: 'How much loan do you need?' }, type: 'text', optional: true },
    ],
  },
  scheme: {
    id: 'scheme',
    name: { hi: 'सरकारी योजना', en: 'Government Scheme' },
    icon: '📋',
    questions: [],
  },
  skill: {
    id: 'skill',
    name: { hi: 'स्किल ट्रेनिंग', en: 'Skill Training' },
    icon: '🎓',
    questions: [
      { id: 'interest', question: { hi: 'किस field में training चाहिए?', en: 'What field?' }, type: 'text', optional: true },
    ],
  },
};

export const PARTNER_TYPES = [
  { id: 'bank', name: { hi: 'बैंक', en: 'Bank' }, priority: 1 },
  { id: 'nbfc', name: { hi: 'NBFC (Non-Bank Finance Company)', en: 'NBFC' }, priority: 2 },
  { id: 'insurance_co', name: { hi: 'बीमा कंपनी', en: 'Insurance Company' }, priority: 3 },
  { id: 'govt', name: { hi: 'सरकारी एजेंसी', en: 'Government Agency' }, priority: 4 },
];

export default { PRODUCT_CATEGORIES, PARTNER_TYPES };
