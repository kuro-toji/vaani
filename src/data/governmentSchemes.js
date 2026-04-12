/**
 * Government Schemes Database for India
 * Used by SchemeMatcher component to auto-match eligible schemes
 * based on user's pincode (state), age, gender, and income level.
 */

export const governmentSchemes = [
  {
    id: 'pm-kisan',
    name: 'PM Kisan Samman Nidhi',
    nameHindi: 'पीएम किसान सम्मान निधि',
    benefit: '₹6,000/year (₹2,000 every 4 months)',
    eligibility: { occupation: 'farmer', maxLandHectares: 2 },
    category: 'agriculture',
    emoji: '🌾',
    howToApply: 'Visit nearest CSC center or apply at pmkisan.gov.in',
    states: 'all'
  },
  {
    id: 'sukanya-samriddhi',
    name: 'Sukanya Samriddhi Yojana',
    nameHindi: 'सुकन्या समृद्धि योजना',
    benefit: '8.2% interest, tax-free (EEE), max ₹1.5L/year',
    eligibility: { gender: 'female', maxAge: 10, relationship: 'daughter' },
    category: 'savings',
    emoji: '👧',
    howToApply: 'Open account at any post office or authorized bank',
    states: 'all'
  },
  {
    id: 'scss',
    name: 'Senior Citizen Savings Scheme',
    nameHindi: 'वरिष्ठ नागरिक बचत योजना',
    benefit: '8.2% interest, quarterly payout, max ₹30L',
    eligibility: { minAge: 60 },
    category: 'savings',
    emoji: '🧓',
    howToApply: 'Apply at any post office or scheduled bank',
    states: 'all'
  },
  {
    id: 'pm-awas-gramin',
    name: 'PM Awas Yojana (Gramin)',
    nameHindi: 'पीएम आवास योजना (ग्रामीण)',
    benefit: '₹1.2L - ₹1.3L for house construction',
    eligibility: { area: 'rural', housing: 'homeless' },
    category: 'housing',
    emoji: '🏠',
    howToApply: 'Apply through Gram Panchayat',
    states: 'all'
  },
  {
    id: 'pm-awas-urban',
    name: 'PM Awas Yojana (Urban)',
    nameHindi: 'पीएम आवास योजना (शहरी)',
    benefit: 'Interest subsidy up to ₹2.67L on home loan',
    eligibility: { area: 'urban', maxIncome: 1800000 },
    category: 'housing',
    emoji: '🏢',
    howToApply: 'Apply through bank/HFC or pmay-urban.gov.in',
    states: 'all'
  },
  {
    id: 'ayushman-bharat',
    name: 'Ayushman Bharat (PM-JAY)',
    nameHindi: 'आयुष्मान भारत',
    benefit: '₹5L/year health cover per family',
    eligibility: { maxIncome: 300000 },
    category: 'health',
    emoji: '🏥',
    howToApply: 'Check eligibility at mera.pmjay.gov.in',
    states: 'all'
  },
  {
    id: 'pm-jeevan-jyoti',
    name: 'PM Jeevan Jyoti Bima Yojana',
    nameHindi: 'पीएम जीवन ज्योति बीमा योजना',
    benefit: '₹2L life cover at ₹436/year',
    eligibility: { minAge: 18, maxAge: 50 },
    category: 'insurance',
    emoji: '🛡️',
    howToApply: 'Enroll through any bank with savings account',
    states: 'all'
  },
  {
    id: 'pm-suraksha-bima',
    name: 'PM Suraksha Bima Yojana',
    nameHindi: 'पीएम सुरक्षा बीमा योजना',
    benefit: '₹2L accidental death cover at ₹20/year',
    eligibility: { minAge: 18, maxAge: 70 },
    category: 'insurance',
    emoji: '🔒',
    howToApply: 'Enroll through any bank with savings account',
    states: 'all'
  },
  {
    id: 'atal-pension',
    name: 'Atal Pension Yojana',
    nameHindi: 'अटल पेंशन योजना',
    benefit: '₹1,000-₹5,000/month pension after 60',
    eligibility: { minAge: 18, maxAge: 40, sector: 'unorganized' },
    category: 'pension',
    emoji: '💰',
    howToApply: 'Enroll through bank or post office',
    states: 'all'
  },
  {
    id: 'mudra-loan',
    name: 'PM Mudra Yojana',
    nameHindi: 'पीएम मुद्रा योजना',
    benefit: 'Loans up to ₹10L without collateral for business',
    eligibility: { purpose: 'business', sector: 'micro-enterprise' },
    category: 'business',
    emoji: '🏪',
    howToApply: 'Apply at any bank, NBFC, or MFI',
    states: 'all'
  },
  {
    id: 'stand-up-india',
    name: 'Stand Up India',
    nameHindi: 'स्टैंड अप इंडिया',
    benefit: 'Loans ₹10L-₹1Cr for SC/ST/Women entrepreneurs',
    eligibility: { category: ['SC', 'ST', 'women'], purpose: 'business' },
    category: 'business',
    emoji: '🚀',
    howToApply: 'Apply at any scheduled commercial bank',
    states: 'all'
  },
  {
    id: 'jan-dhan',
    name: 'PM Jan Dhan Yojana',
    nameHindi: 'पीएम जन धन योजना',
    benefit: 'Zero-balance bank account + ₹10,000 overdraft + RuPay card',
    eligibility: { hasAccount: false },
    category: 'banking',
    emoji: '🏦',
    howToApply: 'Visit any bank branch with Aadhaar/voter ID',
    states: 'all'
  },
  {
    id: 'kisan-credit-card',
    name: 'Kisan Credit Card',
    nameHindi: 'किसान क्रेडिट कार्ड',
    benefit: 'Crop loans at 4% interest (with subsidy)',
    eligibility: { occupation: 'farmer' },
    category: 'agriculture',
    emoji: '💳',
    howToApply: 'Apply at any bank with land records',
    states: 'all'
  },
  {
    id: 'pm-fasal-bima',
    name: 'PM Fasal Bima Yojana',
    nameHindi: 'पीएम फसल बीमा योजना',
    benefit: 'Crop insurance at 1.5-5% premium',
    eligibility: { occupation: 'farmer' },
    category: 'agriculture',
    emoji: '🌿',
    howToApply: 'Apply through bank or CSC at time of crop loan',
    states: 'all'
  },
  {
    id: 'national-pension',
    name: 'National Pension System (NPS)',
    nameHindi: 'राष्ट्रीय पेंशन प्रणाली',
    benefit: 'Tax-saving pension with market-linked returns',
    eligibility: { minAge: 18, maxAge: 70 },
    category: 'pension',
    emoji: '📊',
    howToApply: 'Open account online at enps.nsdl.com or through bank',
    states: 'all'
  },
  {
    id: 'mahila-samman',
    name: 'Mahila Samman Savings Certificate',
    nameHindi: 'महिला सम्मान बचत पत्र',
    benefit: '7.5% interest for women, max ₹2L, 2-year tenure',
    eligibility: { gender: 'female' },
    category: 'savings',
    emoji: '👩',
    howToApply: 'Apply at any post office or authorized bank',
    states: 'all'
  },
  {
    id: 'pm-vishwakarma',
    name: 'PM Vishwakarma Yojana',
    nameHindi: 'पीएम विश्वकर्मा योजना',
    benefit: 'Skill training + ₹3L loan at 5% for artisans',
    eligibility: { occupation: 'artisan' },
    category: 'business',
    emoji: '🔨',
    howToApply: 'Register at pmvishwakarma.gov.in',
    states: 'all'
  },
  {
    id: 'ujjwala',
    name: 'PM Ujjwala Yojana',
    nameHindi: 'पीएम उज्ज्वला योजना',
    benefit: 'Free LPG connection for BPL families',
    eligibility: { maxIncome: 200000, category: 'BPL' },
    category: 'welfare',
    emoji: '🔥',
    howToApply: 'Apply at nearest LPG distributor with BPL card',
    states: 'all'
  },
  {
    id: 'pm-svanidhi',
    name: 'PM SVANidhi',
    nameHindi: 'पीएम स्वनिधि',
    benefit: '₹10,000 working capital loan for street vendors',
    eligibility: { occupation: 'vendor' },
    category: 'business',
    emoji: '🛒',
    howToApply: 'Apply at pmsvanidhi.mohua.gov.in',
    states: 'all'
  },
  // State-specific schemes
  {
    id: 'ladli-behna',
    name: 'Ladli Behna Yojana',
    nameHindi: 'लाड़ली बहना योजना',
    benefit: '₹1,250/month for women',
    eligibility: { gender: 'female', minAge: 21, maxAge: 60, maxIncome: 250000 },
    category: 'welfare',
    emoji: '💐',
    howToApply: 'Apply at CM Helpline or local office',
    states: ['Madhya Pradesh']
  },
  {
    id: 'kalia',
    name: 'KALIA Scheme',
    nameHindi: 'कालिया योजना',
    benefit: '₹10,000/year for small farmers',
    eligibility: { occupation: 'farmer', maxLandAcres: 5 },
    category: 'agriculture',
    emoji: '🌾',
    howToApply: 'Apply through Gram Panchayat',
    states: ['Odisha']
  },
  {
    id: 'rythu-bandhu',
    name: 'Rythu Bandhu',
    nameHindi: 'रायथू बंधु',
    benefit: '₹10,000/acre/year for farmers',
    eligibility: { occupation: 'farmer' },
    category: 'agriculture',
    emoji: '🚜',
    howToApply: 'Apply through local agriculture office',
    states: ['Telangana']
  },
];

/**
 * Match eligible schemes based on user profile.
 * @param {Object} profile - { state, age, gender, income, occupation }
 * @returns {Array} matched schemes
 */
export function matchSchemes(profile = {}) {
  const { state, age, gender, income, occupation } = profile;

  return governmentSchemes.filter(scheme => {
    // Check state eligibility
    if (scheme.states !== 'all') {
      if (!state || !scheme.states.includes(state)) return false;
    }

    const e = scheme.eligibility;

    // Age checks
    if (e.minAge && age && age < e.minAge) return false;
    if (e.maxAge && age && age > e.maxAge) return false;

    // Gender checks
    if (e.gender && gender && e.gender !== gender) return false;

    // Income checks
    if (e.maxIncome && income && income > e.maxIncome) return false;

    return true;
  });
}

/**
 * Get schemes by category
 */
export function getSchemesByCategory(category) {
  return governmentSchemes.filter(s => s.category === category);
}

export default governmentSchemes;
