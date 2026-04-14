/**
 * Bank & CSC Locator Service
 * Finds nearby banks and CSCs by pincode/region.
 */

import { getRegionByPincode } from './pincodeService.js';
import { MAJOR_BANKS, BANK_BY_STATE, CSC_INFO } from '../data/bankBranches.js';

/**
 * Find banks and CSCs for a given pincode.
 * 
 * @param {Object} params
 * @param {string} params.pincode - 6-digit pincode
 * @param {string} params.language - Language code (hi/en)
 * @returns {Promise<Object>} Bank and CSC information
 */
export async function findNearbyBanksAndCSC({ pincode, language = 'hi' }) {
  const lang = language;
  
  // Get region from pincode
  let region = null;
  let state = null;
  let district = null;
  
  try {
    region = await getRegionByPincode(pincode);
    state = region?.state?.toLowerCase() || '';
    district = region?.district?.toLowerCase() || '';
  } catch {
    // Pincode lookup failed — use generic response
  }

  // Get banks available in this state
  const stateBanks = BANK_BY_STATE[state] || BANK_BY_STATE[getStateFromDistrict(district)] || ['sbi', 'pnb', 'central'];
  const bankList = MAJOR_BANKS.filter(b => stateBanks.includes(b.id)).slice(0, 5);

  // Get CSC info
  const cscData = CSC_INFO.by_state[state] || CSC_INFO.general;

  return {
    pincode,
    region: region?.region || district || null,
    state: region?.state || null,
    district,
    banks: bankList.map(b => ({
      id: b.id,
      name: b.name[lang] || b.name.en,
      short: b.short,
      phone: b.phone,
      website: `${b.id}.co.in`,
      howToApply: lang === 'hi'
        ? `${b.short} की nearest branch पे जाएं या ${b.phone} पर call करें। ATM से भी apply कर सकते हैं।`
        : `Visit your nearest ${b.short} branch or call ${b.phone}. You can also apply via ATM.`,
    })),
    csc: {
      name: cscData.name?.[lang] || cscData.name?.en || cscData.name,
      tagline: CSC_INFO.general.tagline?.[lang] || CSC_INFO.general.tagline.en,
      phone: cscData.phone || CSC_INFO.general.phone,
      website: CSC_INFO.general.website,
      howToFind: lang === 'hi'
        ? 'CSC Finder app डाउनलोड करें या Google Maps में "CSC Center" search करें। nearest CSC जानने के लिए SMS करें: "CSC <pincode>" को 7738299890 पर भेजें।'
        : 'Download CSC Finder app or search "CSC Center" on Google Maps. To find nearest CSC: SMS "CSC <pincode>" to 7738299890.',
    },
    tip: lang === 'hi'
      ? '💡 TIP: CSC center में जाकर सभी सरकारी योजनाओं की जानकारी FREE में मिलती है।'
      : '💡 TIP: CSC centers have FREE information on all government schemes.',
  };
}

/**
 * Get state name from district name (fallback).
 */
function getStateFromDistrict(district) {
  if (!district) return null;
  const d = district.toLowerCase();
  
  const districtToState = {
    'patna': 'bihar', 'muzaffarpur': 'bihar', 'gaya': 'bihar',
    'mumbai': 'maharashtra', 'pune': 'maharashtra', 'nagpur': 'maharashtra',
    'delhi': 'delhi', 'new delhi': 'delhi',
    'kolkata': 'west bengal', 'howrah': 'west bengal', 'darjeeling': 'west bengal',
    'chennai': 'tamil nadu', 'coimbatore': 'tamil nadu', 'madurai': 'tamil nadu',
    'bangalore': 'karnataka', 'bengaluru': 'karnataka', 'mysore': 'karnataka',
    'ahmedabad': 'gujarat', 'surat': 'gujarat', 'vadodara': 'gujarat',
    'jaipur': 'rajasthan', 'jodhpur': 'rajasthan', 'udaipur': 'rajasthan',
    'lucknow': 'uttar pradesh', 'kanpur': 'uttar pradesh', 'agra': 'uttar pradesh',
    'bhopal': 'madhya pradesh', 'indore': 'madhya pradesh', 'gwalior': 'madhya pradesh',
    'hyderabad': 'telangana', 'secunderabad': 'telangana', 'warangal': 'telangana',
    'visakhapatnam': 'andhra pradesh', 'vijayawada': 'andhra pradesh', 'tirupati': 'andhra pradesh',
    'kochi': 'kerala', 'thiruvananthapuram': 'kerala', 'kozhikode': 'kerala',
    'chandigarh': 'punjab', 'ludhiana': 'punjab', 'amritsar': 'punjab',
    'gurgaon': 'haryana', 'faridabad': 'haryana', 'panipat': 'haryana',
    'ranchi': 'jharkhand', 'jamshedpur': 'jharkhand', 'dhanbad': 'jharkhand',
    'raipur': 'chhattisgarh', 'bhilai': 'chhattisgarh', 'durg': 'chhattisgarh',
    'guwahati': 'assam', 'silchar': 'assam', 'dibrugarh': 'assam',
    'dehradun': 'uttarakhand', 'haridwar': 'uttarakhand', 'rishikesh': 'uttarakhand',
  };
  
  return districtToState[d] || null;
}

/**
 * Detect if user is asking about bank/CSC location.
 */
export function detectLocatorIntent(text) {
  const lower = text.toLowerCase();
  const locatorKeywords = [
    'bank', 'branch', 'csc', 'atmkiosk', 'atm', 'kiosk',
    'कैश', 'branch', 'nearest', 'पास', 'csc', 'sarkari',
    'where to apply', 'कहाँ apply करें', 'कहाँ जाएं', 'apply karna',
    'जाओ', 'जाकर', 'branch', 'bank branch',
  ];
  return locatorKeywords.some(k => lower.includes(k));
}

export default { findNearbyBanksAndCSC, detectLocatorIntent };
