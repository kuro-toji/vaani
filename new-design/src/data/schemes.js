/**
 * Curated database of major Indian government financial schemes.
 * Data sourced from official government websites (pmkisan.gov.in, indiapost.gov.in, etc.)
 * Last updated: April 2026
 */

export const SCHEMES = [
  // === PM KISAN ===
  {
    id: 'pm_kisan',
    name: {
      hi: 'PM किसान सम्मान निधि',
      en: 'PM Kisan Samman Nidhi',
    },
    description: {
      hi: 'किसानों को प्रति वर्ष ₹6,000 की आर्थिक सहायता — 3 किस्तों में ₹2,000 प्रति किस्त',
      en: '₹6,000 annual financial support to farmer families — ₹2,000 per installment in 3 installments',
    },
    benefit: 6000,
    benefitUnit: 'year',
    benefitUnitHi: 'प्रति वर्ष',
    category: 'income_support',
    ministry: 'Agriculture',
    eligibility: {
      farmerTypes: ['small', 'marginal'],
      maxLandHolding: '2 hectares',
      excluded: ['income_tax_payers', 'government_employees', 'professionals'],
    },
    documents: ['Aadhaar', 'Land records', 'Bank account', 'Mobile number'],
    applicationMode: ['Online via PM Kisan portal', 'CSC center'],
    website: 'pmkisan.gov.in',
    schemes_by_state: true,
    keywords: ['kisan', 'farmer', 'crop', 'land', 'agriculture', 'pmkisan'],
  },

  // === SUKANYA SAMRIDDHI ===
  {
    id: 'sukanya_samriddhi',
    name: {
      hi: 'सुकन्या समृद्धि योजना',
      en: 'Sukanya Samriddhi Yojana',
    },
    description: {
      hi: 'बेटियों की शिक्षा और विवाह के लिए — 7.6% की गारंटीड ब्याज दर, टैक्स फ्री',
      en: 'For daughters education & marriage — 7.6% guaranteed interest rate, tax-free savings',
    },
    benefit: null,
    benefitUnit: 'savings',
    benefitUnitHi: 'बचत योजना',
    category: 'savings',
    ministry: 'Finance',
    eligibility: {
      gender: 'female_only',
      age: ['0-10 years'],
      parentIncome: null,
      maxAccounts: '2 per family',
    },
    documents: ['Birth certificate of girl child', 'Aadhaar of parent and child', 'Bank account'],
    applicationMode: ['Post Office', 'Authorized Banks'],
    website: 'indiapost.gov.in',
    interestRate: 7.6,
    interestRateText: { hi: '7.6% प्रति वर्ष', en: '7.6% per annum' },
    taxFree: true,
    keywords: ['beti', 'daughter', 'education', 'marriage', 'sukanya', 'savings', 'tax-free', 'girl child'],
  },

  // === JAN DHAN ===
  {
    id: 'jan_dhan',
    name: {
      hi: 'प्रधानमंत्री जन धन योजना',
      en: 'Pradhan Mantri Jan Dhan Yojana',
    },
    description: {
      hi: 'बैंक खाता — ₹0 बैलेंस, ₹50,000 का दुर्घटना बीमा, ओवरड्राफ्ट ₹10,000 तक',
      en: 'Zero-balance bank account with ₹50,000 accident insurance cover, overdraft up to ₹10,000',
    },
    benefit: null,
    benefitUnit: 'bank_account',
    benefitUnitHi: 'बैंक खाता',
    category: 'banking',
    ministry: 'Finance',
    eligibility: {
      age: '10+ years',
      noExistingBankAccount: true,
      onlyOnePerPerson: true,
    },
    documents: ['Aadhaar', 'Passport photo', 'Mobile number'],
    applicationMode: ['Any bank branch', 'CSC center'],
    website: 'pmjdy.gov.in',
    benefits: ['Zero balance account', '₹50,000 accident insurance', '₹30,000 life insurance (if age 18-59)', 'Overdraft facility ₹10,000'],
    keywords: ['bank', 'account', 'jana dhan', 'jan dhan', 'banking', 'bank account'],
  },

  // === PMJJBY ===
  {
    id: 'pmjjby',
    name: {
      hi: 'प्रधानमंत्री जीवन ज्योति बीमा योजना',
      en: 'Pradhan Mantri Jeevan Jyoti Bima Yojana',
    },
    description: {
      hi: '₹436 प्रति वर्ष प्रीमियम — ₹2 लाख की जीवन बीमा कवर',
      en: '₹436 per year premium — ₹2 lakh life insurance cover on death',
    },
    benefit: 200000,
    benefitUnit: 'insurance',
    benefitUnitHi: 'जीवन बीमा',
    category: 'insurance',
    ministry: 'Finance',
    eligibility: {
      age: [18, 50],
      bankAccount: true,
      autoDebitConsent: true,
    },
    documents: ['Bank account with auto-debit consent', 'Aadhaar'],
    applicationMode: ['Any bank with PMJJBY'],
    website: 'jansuraksha.gov.in',
    premium: { amount: 436, unit: 'year', text: { hi: '₹436 प्रति वर्ष', en: '₹436 per year' } },
    keywords: ['jeevan', 'jyoti', 'jiivan', 'insurance', 'life', 'death', 'term insurance', 'bima'],
  },

  // === PMSBY ===
  {
    id: 'pmsby',
    name: {
      hi: 'प्रधानमंत्री सुरक्षा बीमा योजना',
      en: 'Pradhan Mantri Suraksha Bima Yojana',
    },
    description: {
      hi: '₹20 प्रति वर्ष प्रीमियम — दुर्घटना में मृत्यु पर ₹2 लाख, अपंगता पर ₹2 लाख तक',
      en: '₹20 per year premium — ₹2 lakh on accidental death, ₹2 lakh on disability',
    },
    benefit: 200000,
    benefitUnit: 'insurance',
    benefitUnitHi: 'दुर्घटना बीमा',
    category: 'insurance',
    ministry: 'Finance',
    eligibility: {
      age: [18, 70],
      bankAccount: true,
    },
    documents: ['Bank account with auto-debit consent', 'Aadhaar'],
    applicationMode: ['Any bank with PMSBY'],
    website: 'jansuraksha.gov.in',
    premium: { amount: 20, unit: 'year', text: { hi: '₹20 प्रति वर्ष', en: '₹20 per year' } },
    keywords: ['suraksha', 'accident', 'disability', 'bima', 'insurance', 'accidental death'],
  },

  // === ATAL PENSION YOJANA ===
  {
    id: 'atal_pension',
    name: {
      hi: 'अटल पेंशन योजना',
      en: 'Atal Pension Yojana',
    },
    description: {
      hi: 'असंगठित क्षेत्र के workers के लिए — गारंटीड पेंशन ₹3,000-₹5,000/माह',
      en: 'For unorganized sector workers — guaranteed pension ₹3,000-₹5,000/month',
    },
    benefit: null,
    benefitUnit: 'pension',
    benefitUnitHi: 'पेंशन',
    category: 'pension',
    ministry: 'Finance',
    eligibility: {
      age: [18, 40],
      sector: ['unorganized', 'gig', 'contractor', 'hawker'],
      contributionYears: '20-40 years',
      notGovtPension: true,
    },
    documents: ['Aadhaar', 'Bank account', 'Mobile number'],
    applicationMode: ['Any bank', 'CSC center'],
    website: 'jansuraksha.gov.in',
    pensionRange: { min: 3000, max: 5000, unit: 'month', text: { hi: '₹3,000-₹5,000/माह', en: '₹3,000-₹5,000/month' } },
    keywords: ['pension', 'retirement', 'old age', 'atal', 'unorganized', 'worker', 'pension yojana'],
  },

  // === PM AWAS YOJANA (Rural) ===
  {
    id: 'pm_awas',
    name: {
      hi: 'प्रधानमंत्री आवास योजना - ग्रामीण',
      en: 'Pradhan Mantri Awas Yojana - Rural',
    },
    description: {
      hi: 'गरीबों के लिए पक्का मकान — ₹1.20 लाख तक की सब्सिडी',
      en: 'Pucca house for poor — subsidy up to ₹1.20 lakh on home loan',
    },
    benefit: 120000,
    benefitUnit: 'subsidy',
    benefitUnitHi: 'सब्सिडी',
    category: 'housing',
    ministry: 'Rural Development',
    eligibility: {
      income: { max: 300000 },
      caste: 'all',
      houseRequirement: 'no pucca house in family name',
    },
    documents: ['Aadhaar', 'Income certificate', 'Caste certificate', 'Bank account'],
    applicationMode: ['Common Service Centre', 'Bank'],
    website: 'pmaymis.gov.in',
    keywords: ['ghar', 'house', 'awas', 'home', 'pucca', 'rural', 'homestead'],
  },

  // === KAUSHAL VIKAS / SKILL INDIA ===
  {
    id: 'kaushal_vikas',
    name: {
      hi: 'प्रधानमंत्री कौशल विकास योजना',
      en: 'Pradhan Mantri Kaushal Vikas Yojana',
    },
    description: {
      hi: 'Free skill training — NSDC मान्यता प्राप्त training के साथ, job placement सहायता',
      en: 'Free skill training with NSDC certification, job placement assistance',
    },
    benefit: null,
    benefitUnit: 'training',
    benefitUnitHi: 'प्रशिक्षण',
    category: 'skill',
    ministry: 'Skill Development',
    eligibility: {
      age: [15, 45],
      education: '8th class pass minimum',
      employment: ['unemployed', 'school dropouts'],
    },
    documents: ['Aadhaar', 'Education certificate', 'Bank account'],
    applicationMode: ['Online at skillindia.gov.in', 'CSC center'],
    website: 'skillindia.gov.in',
    keywords: ['skill', 'training', 'job', 'naukri', 'kaushal', 'rozgar', 'employment', 'career'],
  },

  // === STAND UP INDIA ===
  {
    id: 'stand_up_india',
    name: {
      hi: 'स्टैंड अप इंडिया',
      en: 'Stand Up India',
    },
    description: {
      hi: 'SC/ST और महिला entrepreneurs के लिए — ₹10 लाख से ₹1 करोड़ तक का लोन',
      en: 'Loans from ₹10 lakh to ₹1 crore for SC/ST and women entrepreneurs',
    },
    benefit: null,
    benefitUnit: 'loan',
    benefitUnitHi: 'लोन/ऋण',
    category: 'loan',
    ministry: 'Finance',
    eligibility: {
      gender: ['female', 'sc_st'],
      age: [18, 65],
      businessType: ['manufacturing', 'services', 'trading'],
      existingBusiness: false,
    },
    documents: ['Caste certificate', 'Aadhaar', 'Business plan', 'Bank account', 'Shop Act/IUdyog Aadhaar'],
    applicationMode: ['Any bank branch'],
    website: 'standupupindia.gov.in',
    loanRange: { min: 1000000, max: 10000000, unit: 'loan', text: { hi: '₹10 लाख - ₹1 करोड़', en: '₹10 lakh - ₹1 crore' } },
    keywords: ['loan', 'udyami', 'stand up', 'entrepreneur', 'business', 'shishu', 'udyam', 'startup'],
  },

  // === MUDRALOAN (PM SVANIDHI) ===
  {
    id: 'mudra_loan',
    name: {
      hi: 'प्रधानमंत्री मुद्रा योजना',
      en: 'Pradhan Mantri Mudra Yojana',
    },
    description: {
      hi: 'छोटे व्यापारियों के लिए — शिशु ₹50,000, किशोर ₹5 लाख, तरूण ₹10 लाख तक',
      en: 'For small traders — Shishu ₹50,000, Kishore ₹5 lakh, Tarun ₹10 lakh',
    },
    benefit: null,
    benefitUnit: 'loan',
    benefitUnitHi: 'लोन/ऋण',
    category: 'loan',
    ministry: 'Finance',
    eligibility: {
      businessType: ['small_trader', 'vendor', 'hawker', 'micro'],
      annualTurnover: { max: 10000000 },
      existingMUDRA: false,
    },
    documents: ['Aadhaar', 'PAN', 'Shop Act / Udyog Aadhaar', 'Bank statement 6 months', 'Passport photo'],
    applicationMode: ['Any bank', 'MUDRA portal', 'CSC center'],
    website: 'mudra.gov.in',
    loanCategories: [
      { name: { hi: 'शिशु (Shishu)', en: 'Shishu' }, max: 50000 },
      { name: { hi: 'किशोर (Kishore)', en: 'Kishore' }, max: 500000 },
      { name: { hi: 'तरूण (Tarun)', en: 'Tarun' }, max: 1000000 },
    ],
    keywords: ['mudra', 'loan', 'व्यापार', 'trader', 'vendor', 'hawker', 'karyakarta', 'small business'],
  },

  // === PM VIDA ===
  {
    id: 'vida',
    name: {
      hi: 'PM विद्या',
      en: 'PM Vidyarthi',
    },
    description: {
      hi: 'विद्यार्थियों के लिए सस्ता एजुकेशन लोन — 4.5% की सब्सिडी दर',
      en: 'Education loan at subsidized rate — 4.5% interest subsidy for eligible students',
    },
    benefit: null,
    benefitUnit: 'loan',
    benefitUnitHi: 'शिक्षा ऋण',
    category: 'education',
    ministry: 'Education',
    eligibility: {
      admission: 'Indian institution only',
      income: { max: 800000 },
      course: ['graduation', 'post_graduation', 'professional'],
    },
    documents: ['Aadhaar', 'Admission letter', 'Income certificate', 'Fee structure', 'Bank account'],
    applicationMode: ['Any bank with education loan'],
    website: 'vidyalakshmi.co.in',
    keywords: ['vidya', 'education', 'student', 'college', 'university', 'loan', 'fee', 'padhai'],
  },

  // === NATIONAL PENSION SYSTEM (NPS) ===
  {
    id: 'nps',
    name: {
      hi: 'राष्ट्रीय पेंशन प्रणाली',
      en: 'National Pension System',
    },
    description: {
      hi: 'स्वैच्छिक पेंशन — 60% निकासी, 40% एन्युटी, EEE status में टैक्स बेनिफिट',
      en: 'Voluntary pension — 60% withdrawal at 60, 40% annuity, EEE tax status',
    },
    benefit: null,
    benefitUnit: 'pension',
    benefitUnitHi: 'पेंशन',
    category: 'pension',
    ministry: 'Finance',
    eligibility: {
      age: [18, 70],
      citizenship: 'Indian',
      sector: ['private', 'voluntary'],
    },
    documents: ['Aadhaar', 'PAN', 'Bank account', 'Photo'],
    applicationMode: ['Point of Presence (banks, post office)', 'eNPS portal'],
    website: 'npseraj.gov.in',
    keywords: ['pension', 'nps', 'retirement', 'old age savings', 'tax saving', 'eees'],
  },
];

/**
 * Get all scheme categories
 */
export const SCHEME_CATEGORIES = [
  { id: 'income_support', name: { hi: 'आय सहायता', en: 'Income Support' }, icon: '💰' },
  { id: 'savings', name: { hi: 'बचत योजना', en: 'Savings Scheme' }, icon: '🏦' },
  { id: 'banking', name: { hi: 'बैंकिंग', en: 'Banking' }, icon: '🏧' },
  { id: 'insurance', name: { hi: 'बीमा', en: 'Insurance' }, icon: '🛡️' },
  { id: 'pension', name: { hi: 'पेंशन', en: 'Pension' }, icon: '👴' },
  { id: 'housing', name: { hi: 'आवास', en: 'Housing' }, icon: '🏠' },
  { id: 'skill', name: { hi: 'कौशल प्रशिक्षण', en: 'Skill Training' }, icon: '🎓' },
  { id: 'loan', name: { hi: 'लोन/ऋण', en: 'Loans' }, icon: '💳' },
  { id: 'education', name: { hi: 'शिक्षा', en: 'Education' }, icon: '📚' },
];

export default SCHEMES;
