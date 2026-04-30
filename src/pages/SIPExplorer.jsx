import { useState, useEffect, useCallback } from 'react';
import { getPopularSIPFunds } from '../services/amfiService.js';

// Top mutual fund categories with scheme codes for AMFI API
const FUND_CATEGORIES = {
  'Large Cap': [
    { code: '119598', name: 'Mirae Asset Large Cap Fund', amc: 'Mirae Asset', risk: 'Moderate', minSIP: 500 },
    { code: '118989', name: 'SBI Blue Chip Fund', amc: 'SBI MF', risk: 'Moderate', minSIP: 500 },
    { code: '112090', name: 'HDFC Top 100 Fund', amc: 'HDFC MF', risk: 'Moderate', minSIP: 500 },
    { code: '100034', name: 'ICICI Pru Bluechip Fund', amc: 'ICICI Pru MF', risk: 'Moderate', minSIP: 100 },
    { code: '118834', name: 'Axis Bluechip Fund', amc: 'Axis MF', risk: 'Moderate', minSIP: 500 },
  ],
  'Mid Cap': [
    { code: '119152', name: 'HDFC Mid-Cap Opportunities', amc: 'HDFC MF', risk: 'High', minSIP: 500 },
    { code: '100474', name: 'Kotak Emerging Equity Fund', amc: 'Kotak MF', risk: 'High', minSIP: 1000 },
    { code: '118987', name: 'SBI Magnum Midcap Fund', amc: 'SBI MF', risk: 'High', minSIP: 500 },
  ],
  'Small Cap': [
    { code: '125307', name: 'Axis Small Cap Fund', amc: 'Axis MF', risk: 'Very High', minSIP: 500 },
    { code: '130502', name: 'SBI Small Cap Fund', amc: 'SBI MF', risk: 'Very High', minSIP: 500 },
    { code: '120828', name: 'Nippon India Small Cap', amc: 'Nippon MF', risk: 'Very High', minSIP: 100 },
  ],
  'Flexi Cap': [
    { code: '112091', name: 'HDFC Flexi Cap Fund', amc: 'HDFC MF', risk: 'Moderate-High', minSIP: 500 },
    { code: '100119', name: 'Parag Parikh Flexi Cap', amc: 'PPFAS MF', risk: 'Moderate-High', minSIP: 1000 },
    { code: '118625', name: 'UTI Flexi Cap Fund', amc: 'UTI MF', risk: 'Moderate-High', minSIP: 500 },
  ],
  'Index Fund': [
    { code: '120716', name: 'UTI Nifty 50 Index Fund', amc: 'UTI MF', risk: 'Moderate', minSIP: 500 },
    { code: '140251', name: 'HDFC Index S&P BSE Sensex', amc: 'HDFC MF', risk: 'Moderate', minSIP: 500 },
    { code: '118989', name: 'SBI Nifty Index Fund', amc: 'SBI MF', risk: 'Moderate', minSIP: 500 },
  ],
  'ELSS (Tax Saver)': [
    { code: '119775', name: 'Mirae Asset Tax Saver', amc: 'Mirae Asset', risk: 'High', minSIP: 500 },
    { code: '100469', name: 'Axis Long Term Equity', amc: 'Axis MF', risk: 'High', minSIP: 500 },
    { code: '108827', name: 'SBI Long Term Equity', amc: 'SBI MF', risk: 'High', minSIP: 500 },
  ],
  'Debt': [
    { code: '119028', name: 'HDFC Short Term Debt', amc: 'HDFC MF', risk: 'Low-Moderate', minSIP: 500 },
    { code: '105758', name: 'SBI Magnum Medium Duration', amc: 'SBI MF', risk: 'Low-Moderate', minSIP: 500 },
  ],
  'Liquid': [
    { code: '119029', name: 'HDFC Liquid Fund', amc: 'HDFC MF', risk: 'Low', minSIP: 500 },
    { code: '118991', name: 'SBI Liquid Fund', amc: 'SBI MF', risk: 'Low', minSIP: 500 },
  ],
};

const RISK_COLORS = {
  'Low': 'var(--success)', 'Low-Moderate': '#10b981', 'Moderate': 'var(--gold)',
  'Moderate-High': 'var(--orange)', 'High': 'var(--danger)', 'Very High': '#dc2626',
};

export default function SIPExplorer({ onBack }) {
  const [activeCategory, setActiveCategory] = useState('Large Cap');
  const [selectedFund, setSelectedFund] = useState(null);
  const [navData, setNavData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNAV() {
      setLoading(true);
      try {
        const funds = await getPopularSIPFunds();
        const map = {};
        for (const f of (funds || [])) {
          map[f.schemeCode] = f;
        }
        setNavData(map);
      } catch (e) { console.warn('[SIP] NAV fetch error:', e); }
      setLoading(false);
    }
    loadNAV();
  }, []);

  const currentFunds = FUND_CATEGORIES[activeCategory] || [];

  if (selectedFund) return <FundDetail fund={selectedFund} navInfo={navData[selectedFund.code]} onBack={() => setSelectedFund(null)} />;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={onBack} className="link-gold">← Back</button>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)' }}>Mutual Fund NAV</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 300 }}>
            SIP <em style={{ color: 'var(--gold)' }}>Explorer</em>
          </h2>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {Object.keys(FUND_CATEGORIES).map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            border: activeCategory === cat ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
            background: activeCategory === cat ? 'var(--gold-dim)' : 'var(--ink-card)',
            color: activeCategory === cat ? 'var(--gold)' : 'var(--text-secondary)',
          }}>{cat} ({FUND_CATEGORIES[cat].length})</button>
        ))}
      </div>

      {/* Funds Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {currentFunds.map(fund => {
          const nav = navData[fund.code];
          return (
            <div key={fund.code} onClick={() => setSelectedFund(fund)} style={{
              background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px',
              padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-dim)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--ink-card)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '4px' }}>{fund.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{fund.amc} · Code: {fund.code}</div>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 600,
                  background: `${RISK_COLORS[fund.risk]}15`, color: RISK_COLORS[fund.risk],
                }}>{fund.risk}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Current NAV</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--success)' }}>
                    {nav ? `₹${nav.nav?.toFixed(2)}` : loading ? '...' : '—'}
                  </div>
                  {nav?.date && <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>{nav.date}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Min SIP</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>₹{fund.minSIP}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>/month</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Fund Detail View ─── */
function FundDetail({ fund, navInfo, onBack }) {
  const [sipAmount, setSipAmount] = useState(5000);
  const [sipYears, setSipYears] = useState(10);
  const [returnRate, setReturnRate] = useState(12);

  // SIP Projection
  const months = sipYears * 12;
  const monthlyRate = returnRate / 12 / 100;
  const futureValue = sipAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  const totalInvested = sipAmount * months;
  const totalReturns = futureValue - totalInvested;

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} className="link-gold" style={{ marginBottom: '20px' }}>← Back to Funds</button>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 300, margin: '0 0 4px' }}>{fund.name}</h1>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          {fund.amc} · Scheme Code: {fund.code} · Risk: <span style={{ color: RISK_COLORS[fund.risk] }}>{fund.risk}</span>
        </div>
      </div>

      {/* NAV Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {[
          { label: 'Current NAV', value: navInfo ? `₹${navInfo.nav?.toFixed(4)}` : '—', icon: '📊' },
          { label: 'NAV Date', value: navInfo?.date || '—', icon: '📅' },
          { label: 'Min SIP', value: `₹${fund.minSIP}/month`, icon: '💰' },
          { label: 'Category', value: Object.entries(FUND_CATEGORIES).find(([, funds]) => funds.some(f => f.code === fund.code))?.[0] || '—', icon: '📁' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* SIP Calculator */}
      <div style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '20px' }}>SIP Calculator</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>Monthly SIP (₹)</label>
            <input type="number" value={sipAmount} onChange={e => setSipAmount(Number(e.target.value) || 0)} style={{
              width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
              borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600,
            }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>Duration (Years)</label>
            <input type="number" value={sipYears} onChange={e => setSipYears(Number(e.target.value) || 1)} style={{
              width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
              borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600,
            }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }}>Expected Return (%)</label>
            <input type="number" value={returnRate} onChange={e => setReturnRate(Number(e.target.value) || 1)} style={{
              width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
              borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600,
            }} />
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-base)', borderRadius: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Total Invested</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>₹{totalInvested.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-base)', borderRadius: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Estimated Returns</div>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--success)' }}>+₹{Math.round(totalReturns).toLocaleString('en-IN')}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(201,168,76,0.08)', borderRadius: '10px', border: '1px solid rgba(201,168,76,0.2)' }}>
            <div style={{ fontSize: '10px', color: 'var(--gold)', marginBottom: '6px' }}>Future Value</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold)' }}>₹{Math.round(futureValue).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: '12px 16px', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        ⚠️ Mutual fund investments are subject to market risks. Past performance is not indicative of future returns. The SIP calculator shows estimated returns based on assumed rate and does not guarantee actual returns. Please read the scheme document before investing.
      </div>
    </div>
  );
}
