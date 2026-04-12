// India pincode to region/language mapping
// Curated list of major pincodes for demo

export const pincodeData = {
  // Delhi NCR
  '110001': { region: 'Central Delhi', language: 'Hindi', state: 'Delhi' },
  '110002': { region: 'New Delhi', language: 'Hindi', state: 'Delhi' },
  '110003': { region: 'Delhi', language: 'Hindi', state: 'Delhi' },
  // Mumbai
  '400001': { region: 'Mumbai Fort', language: 'Marathi', state: 'Maharashtra' },
  '400004': { region: 'Mumbai', language: 'Marathi', state: 'Maharashtra' },
  '400104': { region: 'Nagpur', language: 'Marathi', state: 'Maharashtra' },
  // Chennai
  '600001': { region: 'Chennai', language: 'Tamil', state: 'Tamil Nadu' },
  // Bangalore
  '560001': { region: 'Bangalore', language: 'Kannada', state: 'Karnataka' },
  '560095': { region: 'Bangalore', language: 'Kannada', state: 'Karnataka' },
  // Kolkata
  '700001': { region: 'Kolkata', language: 'Bengali', state: 'West Bengal' },
  // Hyderabad
  '500001': { region: 'Hyderabad', language: 'Telugu', state: 'Telangana' },
  // Pune
  '411001': { region: 'Pune', language: 'Marathi', state: 'Maharashtra' },
  // Gujarat
  '380001': { region: 'Ahmedabad', language: 'Gujarati', state: 'Gujarat' },
  '382481': { region: 'Gandhinagar', language: 'Gujarati', state: 'Gujarat' },
  // Lucknow
  '226001': { region: 'Lucknow', language: 'Awadhi', state: 'Uttar Pradesh' },
  // Bihar
  '800001': { region: 'Patna', language: 'Bhojpuri', state: 'Bihar' },
  '811201': { region: 'Munger', language: 'Bhojpuri', state: 'Bihar' },
  // Kerala
  '682001': { region: 'Kochi', language: 'Malayalam', state: 'Kerala' },
  // Rajasthan
  '302001': { region: 'Jaipur', language: 'Hindi', state: 'Rajasthan' },
  // Punjab
  '160001': { region: 'Chandigarh', language: 'Punjabi', state: 'Punjab' },
  // Odisha
  '751001': { region: 'Bhubaneswar', language: 'Odia', state: 'Odisha' },
  // Assam
  '781001': { region: 'Guwahati', language: 'Assamese', state: 'Assam' },
  // Maharashtra - Marathi strong
  '440001': { region: 'Nagpur', language: 'Marathi', state: 'Maharashtra' },
  '431001': { region: 'Aurangabad', language: 'Marathi', state: 'Maharashtra' },
  // West Bengal
  '713101': { region: 'Durgapur', language: 'Bengali', state: 'West Bengal' },
};

export function getRegionByPincode(pincode) {
  const normalized = pincode.trim();
  if (pincodeData[normalized]) {
    return pincodeData[normalized];
  }
  // Fuzzy match - check if first 3 digits match
  const prefix = normalized.substring(0, 3);
  for (const [key, value] of Object.entries(pincodeData)) {
    if (key.startsWith(prefix)) {
      return value;
    }
  }
  return { region: 'India', language: 'Hindi', state: 'Unknown' };
}
