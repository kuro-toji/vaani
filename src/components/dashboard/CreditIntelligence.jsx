// ═══════════════════════════════════════════════════════════════════
// VAANI Web Dashboard — Credit Intelligence Component
// Portfolio-backed loans, borrowing capacity, rate comparison
// Voice: "₹1,40,000 loan — 10.5% pe, credit card se 75% sasta"
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

/**
 * Credit Intelligence — LAMF, Borrowing Capacity, Rate Comparison
 */
export default function CreditIntelligence({ user }) {
  const [activeTab, setActiveTab] = useState('portfolio');

  // Mock data
  const mockPortfolio = {
    total_value: 200000,
    breakdown: {
      mf: 120000,
      fd: 50000,
      gold: 30000,
    },
  };

  const mockLoanOptions = [
    { type: 'LAMF', name: 'Loan Against Mutual Fund', max_amount: 140000, rate: 10.5, min_amount: 25000, collateral: 'Mutual Funds' },
    { type: 'gold', name: 'Gold Loan', max_amount: 90000, rate: 9, min_amount: 10000, collateral: 'Gold' },
    { type: 'personal', name: 'Personal Loan', max_amount: 100000, rate: 18, min_amount: 50000, collateral: 'None' },
    { type: 'cc', name: 'Credit Card', max_amount: 50000, rate: 36, min_amount: 5000, collateral: 'None' },
  ];

  const mockBorrowingCapacity = {
    monthly_income: 85000,
    existing_emis: 18000,
    available_emi_capacity: 16000,
    max_personal_loan: 400000,
    max_home_loan: 2200000,
    credit_score: 750,
  };

  const formatCurrency = (amount) => '₹' + amount.toLocaleString('en-IN');

  const speakCreditLine = () => {
    const msg = new SpeechSynthesisUtterance(
      `Aapke ₹${mockPortfolio.total_value.toLocaleString('en-IN')} ke mutual funds pe aap ₹${(mockPortfolio.total_value * 0.7).toLocaleString('en-IN')} tak loan le sakte ho at 10.5%. Credit card se 75% sasta.`
    );
    msg.lang = 'hi-IN';
    speechSynthesis.speak(msg);
  };

  const getSavingsVsCC = (loanType) => {
    const ccRate = 36;
    const loanRate = mockLoanOptions.find(l => l.type === loanType)?.rate || 18;
    const yearlySavings = 50000 * (ccRate - loanRate) / 100;
    return yearlySavings;
  };

  return (
    <div className="flex flex-col gap-6 p-6" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>💳 Credit Intelligence</h2>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Portfolio-backed loans, borrowing capacity</p>
        </div>
        <button onClick={speakCreditLine} className="btn btn-ghost" style={{ padding: '8px 16px' }}>🔊 Speak</button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {['portfolio', 'capacity', 'compare'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, padding: '10px', fontSize: '13px' }}
          >
            {tab === 'portfolio' ? '📈 Portfolio' : tab === 'capacity' ? '📊 Capacity' : '⚖️ Compare'}
          </button>
        ))}
      </div>

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <>
          <div className="card p-6" style={{ background: 'var(--primary)', borderRadius: '16px', textAlign: 'center' }}>
            <p className="text-sm opacity-80 mb-2">Your Portfolio Value</p>
            <p style={{ fontSize: '36px', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(mockPortfolio.total_value)}</p>
          </div>

          <div className="card p-4" style={{ background: 'var(--bg-surface)', borderRadius: '16px' }}>
            <p className="font-semibold mb-3">Breakdown</p>
            {Object.entries(mockPortfolio.breakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="flex items-center gap-2">
                  <span>{key === 'mf' ? '📈' : key === 'fd' ? '🗄️' : '🥇'}</span>
                  <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{key === 'mf' ? 'Mutual Funds' : key === 'fd' ? 'Fixed Deposits' : 'Gold'}</span>
                </span>
                <span className="font-semibold">{formatCurrency(value)}</span>
              </div>
            ))}
          </div>

          <div className="card p-4" style={{ background: 'var(--success-bg)', borderRadius: '16px' }}>
            <p className="font-semibold mb-2" style={{ color: 'var(--success)' }}>💡 Available Credit Line</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--success)' }}>
              {formatCurrency(mockPortfolio.total_value * 0.7)} at 10.5%
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              70% of your MF portfolio as Loan Against Mutual Fund
            </p>
          </div>
        </>
      )}

      {/* Capacity Tab */}
      {activeTab === 'capacity' && (
        <>
          <div className="card p-6" style={{ background: 'var(--bg-surface)', borderRadius: '16px' }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Monthly Income</p>
                <p style={{ fontSize: '24px', fontWeight: '700' }}>{formatCurrency(mockBorrowingCapacity.monthly_income)}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Credit Score</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)' }}>{mockBorrowingCapacity.credit_score}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Existing EMI</p>
                <p className="font-bold" style={{ color: 'var(--danger)' }}>{formatCurrency(mockBorrowingCapacity.existing_emis)}</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Available EMI</p>
                <p className="font-bold" style={{ color: 'var(--success)' }}>{formatCurrency(mockBorrowingCapacity.available_emi_capacity)}</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>EMI Ratio</p>
                <p className="font-bold">{Math.round((mockBorrowingCapacity.existing_emis / mockBorrowingCapacity.monthly_income) * 100)}%</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="card p-4" style={{ background: 'var(--bg-surface)', borderRadius: '16px' }}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>🏠 Home Loan Eligibility</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>At current income & existing EMIs</p>
                </div>
                <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
                  {formatCurrency(mockBorrowingCapacity.max_home_loan)}
                </span>
              </div>
            </div>

            <div className="card p-4" style={{ background: 'var(--bg-surface)', borderRadius: '16px' }}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>💰 Personal Loan Eligibility</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Based on available EMI capacity</p>
                </div>
                <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
                  {formatCurrency(mockBorrowingCapacity.max_personal_loan)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <>
          <div className="card overflow-hidden" style={{ background: 'var(--bg-surface)', borderRadius: '16px' }}>
            <div className="grid grid-cols-4 p-4 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
              <p className="text-xs font-semibold">Type</p>
              <p className="text-xs font-semibold">Rate</p>
              <p className="text-xs font-semibold">Max Amount</p>
              <p className="text-xs font-semibold">Savings vs CC</p>
            </div>
            {mockLoanOptions.map((loan, idx) => (
              <div key={idx} className="grid grid-cols-4 p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '16px' }}>
                    {loan.type === 'LAMF' ? '📈' : loan.type === 'gold' ? '🥇' : loan.type === 'personal' ? '💰' : '💳'}
                  </span>
                  <span className="text-xs font-semibold">{loan.type}</span>
                </div>
                <div>
                  <span 
                    className={`font-bold ${loan.rate <= 12 ? 'text-success' : loan.rate <= 20 ? 'text-warning' : 'text-danger'}`}
                    style={{ fontSize: '16px' }}
                  >
                    {loan.rate}%
                  </span>
                </div>
                <span className="text-xs">{formatCurrency(loan.max_amount)}</span>
                <span className="text-xs font-semibold" style={{ color: loan.rate < 36 ? 'var(--success)' : 'var(--text-tertiary)' }}>
                  {loan.rate < 36 ? `Save ₹${getSavingsVsCC(loan.type).toLocaleString('en-IN')}/yr` : '-'}
                </span>
              </div>
            ))}
          </div>

          <div className="card p-4" style={{ background: 'var(--warning-bg)', borderRadius: '16px' }}>
            <p className="font-semibold mb-2" style={{ color: 'var(--warning)' }}>⚠️ Avoid Credit Card Loans</p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Credit card interest at 36% is 3x more expensive than LAMF at 10.5%. 
              On ₹50,000, you save ₹12,750 per year by using LAMF instead of credit card.
            </p>
          </div>

          <div className="card p-4" style={{ background: 'var(--bg-surface)', borderRadius: '16px' }}>
            <p className="font-semibold mb-2">💡 Why LAMF?</p>
            <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>• Low interest rate (10-12%) vs credit card (36%)</li>
              <li>• No processing fee in most cases</li>
              <li>• No lock-in period — repay anytime</li>
              <li>• Your MF holdings stay invested and continue earning</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}