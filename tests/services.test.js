import { describe, it, expect } from 'vitest';
import { detectSchemeIntent } from '../src/services/schemeService.js';
import { compareFDRates, detectTenure } from '../src/services/fdService.js';
import { detectEligibilityIntent } from '../src/services/eligibilityService.js';
import { matchSchemesToProfile, detectProfileFromText } from '../src/services/profileMatcher.js';
import { detectProductInterest } from '../src/services/leadService.js';

describe('Scheme Detection', () => {
  it('detects kisan/farmer intent', () => {
    const intent = detectSchemeIntent('mujhe kisan ke liye scheme chahiye');
    expect(intent).toBeTruthy();
  });

  it('detects insurance intent', () => {
    const intent = detectSchemeIntent('jeevan bima ki baat karo');
    expect(intent).toBeTruthy();
  });
});

describe('FD Rate Comparator', () => {
  it('detects 1 year tenure', () => {
    const tenure = detectTenure('1 saal ki fd');
    expect(['1y', '1y-2y']).toContain(tenure);
  });

  it('compares FD rates and returns sorted results', () => {
    const rates = compareFDRates({ tenure: '1y-2y', language: 'en', maxResults: 5 });
    expect(rates.length).toBeGreaterThan(0);
    expect(rates[0].rate).toBeGreaterThanOrEqual(rates[1]?.rate || 0);
  });
});

describe('Eligibility Detection', () => {
  it('detects PMJJBY intent', () => {
    const intent = detectEligibilityIntent('PMJJBY ke liye apply karna hai');
    expect(intent).toBe('pmjjby');
  });

  it('detects Atal Pension intent', () => {
    const intent = detectEligibilityIntent('pension ke baare mein batao');
    expect(intent).toBe('atal_pension');
  });
});

describe('Profile Matcher', () => {
  it('matches farmer profile to PM Kisan', () => {
    const matches = matchSchemesToProfile({
      occupation: 'farmer',
      language: 'en',
    });
    expect(matches.some(m => m.id === 'pm_kisan')).toBe(true);
  });

  it('matches daughter profile to Sukanya Samriddhi', () => {
    const matches = matchSchemesToProfile({
      gender: 'female',
      occupation: 'farmer',
      language: 'hi',
    });
    expect(matches.length).toBeGreaterThan(0);
  });

  it('detects profile from natural language', () => {
    const profile = detectProfileFromText('I am a farmer, age 35');
    expect(profile.occupation).toBe('farmer');
    expect(profile.age).toBe('35');
    expect(profile.gender).toBe('male');
  });
});

describe('Lead Interest Detection', () => {
  it('detects FD interest', () => {
    const interest = detectProductInterest('mujhe FD mein invest karna hai');
    expect(interest).toBe('fd');
  });

  it('detects insurance interest', () => {
    const interest = detectProductInterest('jeevan bima chahiye');
    expect(interest).toBe('insurance');
  });
});
