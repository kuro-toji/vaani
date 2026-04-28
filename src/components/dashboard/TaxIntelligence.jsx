// ═══════════════════════════════════════════════════════════════════
// VAANI Web Dashboard — Tax Intelligence Component
// Tax harvesting, advance tax, 80C tracker
// Voice: "3 din ruko — LTCG ho jayega, ₹X bachenge"
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

/**
 * Tax Intelligence — Tax Harvesting, 80C, Advance Tax
 */
export default function TaxIntelligence({ user }) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('harvest');

  // Mock data
  const mockHarvestOpps = [
    { holding_id: 1, asset_name: 'Mirae Asset Large Cap', gain_type: 'STCG', gain_amount: 15000, tax_at_current: 3000, days_to_ltcg: 45, tax_if_wait: 1875, savings: 1125, recommendation: '45 din ruko — ₹1,125 tax bachega' },
  ];

  const mock80C = {
    used: 85000,
    remaining: 65000,
    total_limit: 150000,
    breakdown: { epf: 25000, ppf: 15000, elss: 30000, life_insurance: 10000, nsc: 5000 },
    suggestions: ['ELSS fund mein ₹30,000 daalo — 3 saal lock-in, tax bhi bachega', 'PPF mein ₹20,000 extra daal'],
  };

  const mockAdvanceTax = [
    { quarter: 1, tax_due: 45000, cumulative_percent: 15, already_paid: 45000, balance_due: 0, days_remaining: 0 },
    { quarter: 2, tax_due: 135000, cumulative_percent: 45, already_paid: 135000, balance_due: 0, days_remaining: 0 },
    { quarter: 3, tax_due: 225000, cumulative_percent: 75, already_paid: 200000, balance_due: 25000, days_remaining: 30 },
    { quarter: 4, tax_due: 300000, cumulative_percent: 100, already_paid: 200000, balance_due: 100000, days_remaining: 120 },
  ];

  const formatCurrency = (amount) => '₹' + amount.toLocaleString('en-IN');

  // Get text based on selected language
  const t = (key) => {
    const texts = {
      hi: {
        80c_speech: `Aapka ₹${mock80C.remaining.toLocaleString('en-IN')} 80C limit baaki hai. ELSS fund mein invest karo — 3 saal lock-in, tax bhi bachega.`,
      },
      en: {
        80c_speech: `You have ₹${mock80C.remaining.toLocaleString('en-IN')} remaining in your 80C limit. Invest in ELSS fund — 3 year lock-in, saves tax.`,
      },
    };
    return texts[language]?.[key] || texts.hi[key];
  };

  const speak80C = () => {
    const msg = new SpeechSynthesisUtterance(t('80c_speech'));
    msg.lang = language === 'en' ? 'en-IN' : 'hi-IN';
    speechSynthesis.speak(msg);
  };

  const getQuarterLabel = (q) => ['Q1 (Jun 15)', 'Q2 (Sep 15)', 'Q3 (Dec 15)', 'Q4 (Mar 15)'][q - 1];

  return (
    <div className="flex flex-col gap-6 p-6" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>📊 Tax Intelligence</h2>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Tax Harvesting, 80C, Advance Tax</p>
        </div>
        <button
          onClick={speak80C}
          className="btn btn-ghost flex items-center gap-2"
          style={{ padding: '8px 16px' }}
        >
          🔊 Speak
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {['harvest', 'advance', '80c'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, padding: '10px', fontSize: '13px' }}
          >
            {tab === 'harvest' ? '🌾 Harvest' : tab === 'advance' ? '📅 Advance' : '💰 80C'}
          </button>
        ))}
      </div>

      {/* Tax Harvesting */}
      {activeTab === 'harvest' && (
        <>
          {mockHarvestOpps.length === 0 ? (
            <div className="card text-center" style={{ padding: '40px', background: 'var(--bg-surface)', borderRadius: '16px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No harvesting needed</p>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Sab holdings theek hain</p>
            </div>
          ) : (
            mockHarvestOpps.map((opp, idx) => (
              <div key={idx} className="card" style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '16px' }}>
                <div className="flex justify-between items-center mb-4">
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{opp.asset_name}</p>
                  <span 
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{ background: opp.gain_type === 'LTCG' ? 'var(--success-bg)' : 'var(--warning-bg)', color: 'var(--text-primary)' }}
                  >
                    {opp.gain_type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Gain</p>
                    <p className="font-semibold">{formatCurrency(opp.gain_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Tax Now</p>
                    <p style={{ color: 'var(--danger)', fontWeight: '600' }}>{formatCurrency(opp.tax_at_current)}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Days to LTCG</p>
                    <p style={{ color: 'var(--warning)', fontWeight: '600' }}>{opp.days_to_ltcg} days</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Tax If Wait</p>
                    <p style={{ color: 'var(--success)', fontWeight: '600' }}>{formatCurrency(opp.tax_if_wait)}</p>
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ background: 'var(--success-bg)', marginBottom: '12px' }}>
                  <p className="text-xs" style={{ color: 'var(--success)' }}>You Save</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)' }}>{formatCurrency(opp.savings)}</p>
                </div>
                <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>{opp.recommendation}</p>
              </div>
            ))
          )}

          <div className="card p-4" style={{ background: 'var(--bg-surface)', borderRadius: '16px' }}>
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>💡 What is Tax Harvesting?</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Short-term gains (STCG) are taxed at 20% while long-term gains (LTCG) are taxed at 12.5%. 
              By waiting to cross the 1-year threshold, you can save significant tax.
            </p>
          </div>
        </>
      )}

      {/* Advance Tax */}
      {activeTab === 'advance' && (
        <>
          <div className="card" style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '16px' }}>
            {mockAdvanceTax.map((deadline, idx) => (
              <div 
                key={idx}
                className="flex justify-between items-center p-3 rounded-lg mb-2"
                style={{ 
                  background: deadline.days_remaining <= 30 && deadline.days_remaining > 0 ? 'var(--danger-bg)' : 'var(--bg-elevated)',
                  borderBottom: idx < 3 ? '1px solid var(--border-subtle)' : 'none'
                }}
              >
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{getQuarterLabel(deadline.quarter)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{deadline.cumulative_percent}% cumulative</p>
                </div>
                <div className="text-right">
                  <p style={{ fontWeight: '600' }}>{formatCurrency(deadline.tax_due)}</p>
                  {deadline.balance_due > 0 ? (
                    <p className="text-xs" style={{ color: 'var(--danger)' }}>Balance: {formatCurrency(deadline.balance_due)}</p>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--success)' }}>✓ Paid</p>
                  )}
                  {deadline.days_remaining > 0 && deadline.days_remaining <= 30 && (
                    <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--danger)', color: 'var(--text-primary)' }}>
                      ⏰ {deadline.days_remaining} days left
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="card p-4" style={{ background: 'var(--bg-surface)', borderRadius: '16px' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              📅 Advance Tax Deadlines: Jun 15 (15%) → Sep 15 (45%) → Dec 15 (75%) → Mar 15 (100%)
            </p>
          </div>
        </>
      )}

      {/* 80C Section */}
      {activeTab === '80c' && (
        <>
          <div className="card flex items-center gap-4 p-6" style={{ background: 'var(--primary)', borderRadius: '16px' }}>
            <div 
              className="flex items-center justify-center"
              style={{ 
                width: '80px', height: '80px', borderRadius: '50%', 
                background: 'rgba(255,255,255,0.2)', fontWeight: '700', fontSize: '20px'
              }}
            >
              {Math.round((mock80C.used / mock80C.total_limit) * 100)}%
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Used: {formatCurrency(mock80C.used)}</p>
              <p className="text-sm opacity-80" style={{ color: 'var(--text-primary)' }}>Remaining: {formatCurrency(mock80C.remaining)}</p>
            </div>
          </div>

          <div className="card p-4" style={{ background: 'var(--bg-surface)', borderRadius: '16px' }}>
            <p className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Breakdown</p>
            {Object.entries(mock80C.breakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between p-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-sm" style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                <span className="font-semibold">{formatCurrency(value)}</span>
              </div>
            ))}
          </div>

          {mock80C.suggestions.length > 0 && (
            <div className="card p-4" style={{ background: 'var(--success-bg)', borderRadius: '16px' }}>
              <p className="font-semibold mb-2" style={{ color: 'var(--success)' }}>💡 Suggestions</p>
              {mock80C.suggestions.map((sugg, idx) => (
                <p key={idx} className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>• {sugg}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}