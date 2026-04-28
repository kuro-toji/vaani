// ═══════════════════════════════════════════════════════════════════
// VAANI Web Dashboard — Command Center Component
// Financial Command Center for Web
// Voice: "Meri total daulat kitni hai?" / "What's my net worth?"
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

/**
 * Command Center — Financial Dashboard
 * Shows: Net Worth, FIRE Progress, Debt Summary, All Accounts
 */
export default function CommandCenter({ user }) {
  const { language } = useLanguage();
  const [netWorth, setNetWorth] = useState(null);
  const [debt, setDebt] = useState(null);
  const [fire, setFire] = useState(null);

  // Mock data - in production, fetch from Supabase
  const mockNetWorth = {
    net_worth: 2450000,
    total_assets: 2850000,
    total_liabilities: 400000,
    monthly_income: 85000,
    monthly_expense: 42000,
    monthly_emi: 18000,
    breakdown: {
      bank_balances: 150000,
      fd: 450000,
      sip: 1200000,
      gold: 280000,
      crypto: 770000,
      ppf: 85000,
    },
  };

  const mockFire = {
    target_amount: 50000000,
    current_net_worth: 2450000,
    progress_percent: 4.9,
    monthly_savings_needed: 125000,
    current_age: 28,
    target_age: 50,
    years_remaining: 22,
    monthly_spending_impact: 3,
  };

  const mockDebt = {
    total_outstanding: 400000,
    total_monthly_emi: 18000,
    total_interest_remaining: 125000,
    debt_to_income_ratio: 21,
    prepayment_suggestion: {
      loan_type: 'Personal',
      interest_saved: 15000,
    },
    loans: [
      { id: 1, loan_type: 'personal', lender_name: 'HDFC Bank', emi_amount: 12000, outstanding: 250000, interest_rate: 14 },
      { id: 2, loan_type: 'car', lender_name: 'SBI', emi_amount: 6000, outstanding: 150000, interest_rate: 9 },
    ],
  };

  const formatCurrency = (amount) => '₹' + amount.toLocaleString('en-IN');
  const formatCrore = (amount) => (amount / 10000000).toFixed(2) + ' Cr';

  // Get text based on selected language
  const t = (key) => {
    const texts = {
      hi: {
        net_worth_label: 'आपकी कुल दौलत',
        net_worth_speech: `Aapki kul daulat ${formatCrore(mockNetWorth.net_worth)} hai. Assets ${formatCurrency(mockNetWorth.total_assets)}, liabilities ${formatCurrency(mockNetWorth.total_liabilities)}.`,
        assets: 'Assets',
        liabilities: 'Liabilities',
      },
      en: {
        net_worth_label: 'Your Total Wealth',
        net_worth_speech: `Your net worth is ${formatCrore(mockNetWorth.net_worth)}. Assets ${formatCurrency(mockNetWorth.total_assets)}, liabilities ${formatCurrency(mockNetWorth.total_liabilities)}.`,
        assets: 'Assets',
        liabilities: 'Liabilities',
      },
    };
    return texts[language]?.[key] || texts.hi[key];
  };

  const speakNetWorth = () => {
    const msg = new SpeechSynthesisUtterance(t('net_worth_speech'));
    msg.lang = language === 'en' ? 'en-IN' : 'hi-IN';
    speechSynthesis.speak(msg);
  };

  return (
    <div className="flex flex-col gap-6 p-6" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>🏦 Command Center</h2>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Financial Command Center</p>
        </div>
        <button
          onClick={speakNetWorth}
          className="btn btn-ghost flex items-center gap-2"
          style={{ padding: '8px 16px' }}
        >
          🔊 Speak
        </button>
      </div>

      {/* Net Worth Card */}
      <div className="card" style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '20px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>💰 आपकी कुल दौलत</h3>
          <button onClick={speakNetWorth} className="text-2xl hover:opacity-70">🔊</button>
        </div>
        
        <div className="text-center mb-6">
          <div style={{ fontSize: '48px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>
            {formatCrore(mockNetWorth.net_worth)}
          </div>
          <div className="flex justify-center gap-8 text-sm">
            <div>
              <span style={{ color: 'var(--success)', fontWeight: '600' }}>Assets</span>
              <div>{formatCurrency(mockNetWorth.total_assets)}</div>
            </div>
            <div>
              <span style={{ color: 'var(--danger)', fontWeight: '600' }}>Liabilities</span>
              <div>{formatCurrency(mockNetWorth.total_liabilities)}</div>
            </div>
          </div>
        </div>

        {/* Asset Breakdown */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Asset Breakdown</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <span>🏦 Bank: {formatCurrency(mockNetWorth.breakdown.bank_balances)}</span>
            <span>🗄️ FD: {formatCurrency(mockNetWorth.breakdown.fd)}</span>
            <span>📈 SIP: {formatCurrency(mockNetWorth.breakdown.sip)}</span>
            <span>🥇 Gold: {formatCurrency(mockNetWorth.breakdown.gold)}</span>
            <span>₿ Crypto: {formatCurrency(mockNetWorth.breakdown.crypto)}</span>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="flex justify-between text-center text-xs">
          <div>
            <p style={{ color: 'var(--text-tertiary)' }}>Monthly Income</p>
            <p style={{ color: 'var(--success)', fontWeight: '600' }}>{formatCurrency(mockNetWorth.monthly_income)}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-tertiary)' }}>Monthly Expense</p>
            <p style={{ color: 'var(--danger)', fontWeight: '600' }}>{formatCurrency(mockNetWorth.monthly_expense)}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-tertiary)' }}>EMI</p>
            <p style={{ color: 'var(--warning)', fontWeight: '600' }}>{formatCurrency(mockNetWorth.monthly_emi)}</p>
          </div>
        </div>
      </div>

      {/* FIRE Progress Card */}
      <div className="card" style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '20px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>🎯 FIRE Progress</h3>
          <span className="badge badge-primary">{mockFire.progress_percent}%</span>
        </div>

        <div className="flex items-center gap-6 mb-4">
          <div 
            className="flex items-center justify-center"
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              background: 'var(--primary)',
              color: 'var(--text-primary)',
              fontWeight: '700',
              fontSize: '18px',
            }}
          >
            {mockFire.progress_percent}%
          </div>
          <div>
            <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Goal: {formatCrore(mockFire.target_amount)}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Current: {formatCrore(mockFire.current_net_worth)}</p>
            <p className="text-sm" style={{ color: 'var(--primary)' }}>Monthly Savings Needed: {formatCurrency(mockFire.monthly_savings_needed)}</p>
          </div>
        </div>

        <div className="flex justify-around text-center text-xs">
          <div>
            <p style={{ color: 'var(--text-tertiary)' }}>Age</p>
            <p style={{ fontWeight: '600' }}>{mockFire.current_age} → {mockFire.target_age}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-tertiary)' }}>Years Left</p>
            <p style={{ fontWeight: '600' }}>{mockFire.years_remaining} yrs</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-tertiary)' }}>Extra Spending Impact</p>
            <p style={{ fontWeight: '600', color: 'var(--warning)' }}>+{mockFire.monthly_spending_impact} months</p>
          </div>
        </div>
      </div>

      {/* Debt Summary Card */}
      <div className="card" style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '20px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>💳 कुल कर्ज़</h3>
          <span style={{ fontSize: '28px', fontWeight: '700', color: 'var(--danger)' }}>
            {formatCurrency(mockDebt.total_outstanding)}
          </span>
        </div>

        {mockDebt.debt_to_income_ratio > 40 && (
          <div 
            className="mb-4 p-3 rounded-lg"
            style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
          >
            ⚠️ Income का {mockDebt.debt_to_income_ratio}% EMI में जा रहा है — risky है!
          </div>
        )}

        <div className="flex justify-around mb-4">
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Monthly EMI</p>
            <p style={{ fontWeight: '600' }}>{formatCurrency(mockDebt.total_monthly_emi)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Interest Left</p>
            <p style={{ fontWeight: '600' }}>{formatCurrency(mockDebt.total_interest_remaining)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>DTI Ratio</p>
            <p style={{ fontWeight: '600' }}>{mockDebt.debt_to_income_ratio}%</p>
          </div>
        </div>

        {mockDebt.prepayment_suggestion && (
          <div 
            className="p-3 rounded-lg mb-4"
            style={{ background: 'var(--success-bg)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
              💡 Prepayment Suggestion: {mockDebt.prepayment_suggestion.loan_type} loan pehle चुकाएं
            </p>
            <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
              Save ₹{mockDebt.prepayment_suggestion.interest_saved.toLocaleString('en-IN')}
            </p>
          </div>
        )}

        {/* Loans List */}
        <div>
          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Your Loans</p>
          {mockDebt.loans.map((loan) => (
            <div 
              key={loan.id}
              className="flex justify-between items-center p-3 rounded-lg mb-2"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {loan.loan_type === 'home' ? '🏠' : loan.loan_type === 'car' ? '🚗' : '💰'} {loan.lender_name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  EMI: {formatCurrency(loan.emi_amount)}
                </p>
              </div>
              <div className="text-right">
                <p style={{ fontWeight: '600' }}>{formatCurrency(loan.outstanding)}</p>
                <p className="text-xs" style={{ color: 'var(--warning)' }}>{loan.interest_rate}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <button 
          className="card hover:opacity-80 transition-opacity"
          style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Idle Money</p>
        </button>
        <button 
          className="card hover:opacity-80 transition-opacity"
          style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tax 80C</p>
        </button>
        <button 
          className="card hover:opacity-80 transition-opacity"
          style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Monthly</p>
        </button>
      </div>
    </div>
  );
}