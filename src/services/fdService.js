// FD Rate Service - Stub implementation

const FD_RATES = [
  { bankId: 'suryoday', bankName: 'Suryoday Small Finance Bank', short: 'Suryoday SFB', type: 'sfb', rate: 9.10, seniorRate: 9.60, tenure: '1y', minDeposit: 5000 },
  { bankId: 'utkarsh', bankName: 'Utkarsh Small Finance Bank', short: 'Utkarsh SFB', type: 'sfb', rate: 8.50, seniorRate: 9.00, tenure: '1y', minDeposit: 1000 },
  { bankId: 'equitas', bankName: 'Equitas Small Finance Bank', short: 'Equitas SFB', type: 'sfb', rate: 8.25, seniorRate: 8.75, tenure: '1y', minDeposit: 5000 },
  { bankId: 'au', bankName: 'AU Small Finance Bank', short: 'AU SFB', type: 'sfb', rate: 8.00, seniorRate: 8.50, tenure: '1y', minDeposit: 1000 },
  { bankId: 'indusind', bankName: 'IndusInd Bank', short: 'IndusInd', type: 'private', rate: 7.99, seniorRate: 8.49, tenure: '1y', minDeposit: 10000 },
  { bankId: 'hdfc', bankName: 'HDFC Bank', short: 'HDFC', type: 'private', rate: 7.10, seniorRate: 7.60, tenure: '1y', minDeposit: 5000 },
  { bankId: 'sbi', bankName: 'State Bank of India', short: 'SBI', type: 'psu', rate: 6.80, seniorRate: 7.30, tenure: '1y', minDeposit: 1000 },
];

export function detectTenure(text) {
  const textLower = text.toLowerCase();
  if (textLower.includes('1') || textLower.includes('ek saal') || textLower.includes('one year')) return '1y';
  if (textLower.includes('2') || textLower.includes('do saal')) return '1y-2y';
  if (textLower.includes('3') || textLower.includes('teen saal')) return '2y-3y';
  if (textLower.includes('5') || textLower.includes('paanch saal')) return '3y-5y';
  return '1y';
}

export function compareFDRates({ tenure = '1y', language = 'en', maxResults = 5 }) {
  const sorted = [...FD_RATES].sort((a, b) => b.rate - a.rate);
  return sorted.slice(0, maxResults);
}