/**
 * Bank branch data for major Indian banks by state.
 * In production, this would come from a real API (RBI BANKS directory).
 * For now, provides state-level bank presence data.
 */

export const MAJOR_BANKS = [
  { id: 'sbi', name: { hi: 'भारतीय स्टेट बैंक (SBI)', en: 'State Bank of India (SBI)' }, short: 'SBI', phone: '1800-1234-000', logo: '🏦' },
  { id: 'pnb', name: { hi: 'पंजाब नैशनल बैंक', en: 'Punjab National Bank' }, short: 'PNB', phone: '1800-180-2222', logo: '🏦' },
  { id: 'bob', name: { hi: 'बैंक ऑफ बड़ौदा', en: 'Bank of Baroda' }, short: 'BoB', phone: '1800-103-1000', logo: '🏦' },
  { id: 'canara', name: { hi: 'केनरा बैंक', en: 'Canara Bank' }, short: 'Canara', phone: '1800-425-0018', logo: '🏦' },
  { id: 'union', name: { hi: 'यूनियन बैंक', en: 'Union Bank of India' }, short: 'Union', phone: '1800-222-244', logo: '🏦' },
  { id: 'central', name: { hi: 'सेंट्रल बैंक', en: 'Central Bank of India' }, short: 'Central', phone: '1800-22-1911', logo: '🏦' },
  { id: 'hdfc', name: { hi: 'एचडीएफसी बैंक', en: 'HDFC Bank' }, short: 'HDFC', phone: '1800-202-6161', logo: '🏦' },
  { id: 'icici', name: { hi: 'आईसीआईसीआई बैंक', en: 'ICICI Bank' }, short: 'ICICI', phone: '1860-120-7777', logo: '🏦' },
  { id: 'axis', name: { hi: 'एक्सिस बैंक', en: 'Axis Bank' }, short: 'Axis', phone: '1800-419-5959', logo: '🏦' },
];

export const BANK_BY_STATE = {
  'delhi': ['sbi', 'pnb', 'bob', 'canara', 'central', 'hdfc', 'icici', 'axis'],
  'maharashtra': ['sbi', 'pnb', 'bob', 'canara', 'union', 'central', 'hdfc', 'icici', 'axis'],
  'uttar pradesh': ['sbi', 'pnb', 'bob', 'canara', 'union', 'central', 'hdfc', 'icici', 'axis'],
  'bihar': ['sbi', 'pnb', 'central', 'canara', 'union', 'hdfc'],
  'west bengal': ['sbi', 'pnb', 'bob', 'canara', 'central', 'hdfc', 'icici'],
  'tamil nadu': ['sbi', 'pnb', 'canara', 'union', 'central', 'hdfc', 'icici', 'axis'],
  'karnataka': ['sbi', 'pnb', 'bob', 'canara', 'union', 'central', 'hdfc', 'icici', 'axis'],
  'gujarat': ['sbi', 'pnb', 'bob', 'canara', 'central', 'hdfc', 'icici', 'axis'],
  'rajasthan': ['sbi', 'pnb', 'bob', 'canara', 'union', 'central', 'hdfc', 'icici'],
  'madhya pradesh': ['sbi', 'pnb', 'bob', 'canara', 'central', 'hdfc', 'icici'],
  'odisha': ['sbi', 'pnb', 'bob', 'canara', 'central', 'hdfc'],
  'telangana': ['sbi', 'pnb', 'canara', 'union', 'central', 'hdfc', 'icici', 'axis'],
  'andhra pradesh': ['sbi', 'pnb', 'canara', 'union', 'central', 'hdfc', 'icici'],
  'kerala': ['sbi', 'pnb', 'canara', 'union', 'central', 'hdfc', 'icici', 'axis'],
  'punjab': ['sbi', 'pnb', 'bob', 'canara', 'central', 'hdfc'],
  'haryana': ['sbi', 'pnb', 'bob', 'canara', 'central', 'hdfc', 'icici'],
  'jharkhand': ['sbi', 'pnb', 'central', 'canara', 'hdfc'],
  'chhattisgarh': ['sbi', 'pnb', 'central', 'canara', 'hdfc'],
  'assam': ['sbi', 'pnb', 'central', 'canara', 'hdfc'],
  'uttarakhand': ['sbi', 'pnb', 'central', 'canara', 'union', 'hdfc'],
};

/**
 * State to CSC toll-free numbers and website
 */
export const CSC_INFO = {
  general: {
    name: { hi: 'कॉमन सर्विस सेंटर (CSC)', en: 'Common Service Centre (CSC)' },
    tagline: { hi: 'आपके गाँव का digital सेवा केंद्र', en: 'Your village digital service center' },
    phone: '1800-123-4567',
    website: 'csccloud.in',
    app: 'CSC Teerth',
  },
  by_state: {
    // Most states follow the general CSC pattern
    // Special state CSCs with local numbers
    'delhi': { phone: '011-23365555', name: 'Delhi CSC' },
    'maharashtra': { phone: '1800-123-4567', name: 'Maha CSC' },
    'bihar': { phone: '0612-2215100', name: 'Bihar CSC' },
    'uttar pradesh': { phone: '1800-180-6565', name: 'UP CSC' },
    'west bengal': { phone: '1800-103-3636', name: 'West Bengal CSC' },
  },
};

export default { MAJOR_BANKS, BANK_BY_STATE, CSC_INFO };
