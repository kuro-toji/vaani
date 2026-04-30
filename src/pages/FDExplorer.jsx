import { useState } from 'react';
import { BANKS, getBestFDRates, getBankDetail, calculateFDMaturity, formatFDRate } from '../../services/fdRatesService.js';

const TENURES = ['7d','30d','90d','180d','1y','2y','3y','5y'];
const TENURE_LABELS = { '7d':'7 Days','30d':'30 Days','90d':'3 Months','180d':'6 Months','1y':'1 Year','2y':'2 Years','3y':'3 Years','5y':'5 Years' };
const TYPE_LABELS = { psu: 'Public Sector', private: 'Private', sfb: 'Small Finance' };

export default function FDExplorer({ onBack }) {
  const [selectedTenure, setSelectedTenure] = useState('1y');
  const [isSenior, setIsSenior] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [calcAmount, setCalcAmount] = useState(100000);
  const [filterType, setFilterType] = useState('all');

  const rates = getBestFDRates(selectedTenure, isSenior, 20);
  const filtered = filterType === 'all' ? rates : rates.filter(r => r.type === filterType);

  if (selectedBank) return <BankDetail bankId={selectedBank} isSenior={isSenior} onBack={() => setSelectedBank(null)} />;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={onBack} className="link-gold">← Back</button>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)' }}>Fixed Deposit Rates</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 300 }}>
            FD Rate <em style={{ color: 'var(--gold)' }}>Comparison</em>
          </h2>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={isSenior} onChange={e => setIsSenior(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Senior Citizen (+0.5%)
          </label>
        </div>
      </div>

      {/* Tenure Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto' }}>
        {TENURES.map(t => (
          <button key={t} onClick={() => setSelectedTenure(t)} style={{
            padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            border: selectedTenure === t ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
            background: selectedTenure === t ? 'var(--gold-dim)' : 'var(--ink-card)',
            color: selectedTenure === t ? 'var(--gold)' : 'var(--text-secondary)',
          }}>{TENURE_LABELS[t]}</button>
        ))}
      </div>

      {/* Type Filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[['all','All Banks'],['psu','PSU'],['private','Private'],['sfb','SFB (Highest)']].map(([k,l]) => (
          <button key={k} onClick={() => setFilterType(k)} style={{
            padding: '6px 14px', borderRadius: '16px', fontSize: '11px', cursor: 'pointer',
            border: filterType === k ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
            background: filterType === k ? 'rgba(99,102,241,0.1)' : 'transparent',
            color: filterType === k ? 'var(--accent)' : 'var(--text-tertiary)',
          }}>{l}</button>
        ))}
      </div>

      {/* Rates Table */}
      <div style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Bank', 'Type', 'Rate', 'Senior Rate', 'Min Deposit', 'Tax Saver', 'Maturity (₹1L)', 'Interest (₹1L)', ''].map(h => (
                <th key={h} style={{ padding: '12px', textAlign: h === 'Bank' ? 'left' : 'right', color: 'var(--text-tertiary)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((fd, i) => {
              const calc = calculateFDMaturity(100000, fd.displayRate, selectedTenure === '1y' ? 1 : selectedTenure === '2y' ? 2 : selectedTenure === '3y' ? 3 : selectedTenure === '5y' ? 5 : selectedTenure === '180d' ? 0.5 : selectedTenure === '90d' ? 0.25 : 30/365);
              return (
                <tr key={fd.bankId} onClick={() => setSelectedBank(fd.bankId)} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dim)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{fd.logo}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fd.bankShort}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{fd.bankName}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 500,
                      background: fd.type === 'sfb' ? 'rgba(16,185,129,0.1)' : fd.type === 'psu' ? 'rgba(99,102,241,0.1)' : 'rgba(201,168,76,0.1)',
                      color: fd.type === 'sfb' ? 'var(--success)' : fd.type === 'psu' ? 'var(--accent)' : 'var(--gold)',
                    }}>{TYPE_LABELS[fd.type]}</span>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontSize: '16px', fontWeight: 700, color: i === 0 ? 'var(--success)' : 'var(--gold)' }}>{fd.rate.toFixed(2)}%</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--success)', fontWeight: 500 }}>{fd.seniorRate.toFixed(2)}%</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>₹{fd.minDeposit?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right' }}>{fd.taxSaver ? '✅' : '—'}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>₹{calc.maturityValue.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>+₹{calc.totalInterest.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--gold)', fontSize: '12px' }}>View →</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* DICGC Note */}
      <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        🛡️ All deposits up to ₹5,00,000 per bank are insured by DICGC (Deposit Insurance and Credit Guarantee Corporation). Senior citizen rates shown are general +0.5% (may vary by bank).
      </div>
    </div>
  );
}

/* ─── Bank Detail View ─── */
function BankDetail({ bankId, isSenior, onBack }) {
  const bank = getBankDetail(bankId);
  const [amount, setAmount] = useState(100000);
  if (!bank) return <div>Bank not found</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} className="link-gold" style={{ marginBottom: '20px' }}>← Back to Comparison</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <span style={{ fontSize: '40px' }}>{bank.logo}</span>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, margin: 0 }}>{bank.name}</h1>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {TYPE_LABELS[bank.type]} · Min ₹{bank.minDeposit?.toLocaleString('en-IN')} · Premature: {bank.prematureWithdrawal}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {bank.features.map((f, i) => (
          <span key={i} style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '11px', background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.2)' }}>{f}</span>
        ))}
      </div>

      {/* Calculator */}
      <div style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '12px' }}>FD Calculator</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Amount: ₹</label>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value) || 0)} style={{
            background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
            padding: '8px 14px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, width: '160px',
          }} />
        </div>
      </div>

      {/* All Tenures Table */}
      <div style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: '12px', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Interest Rates — All Tenures
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Tenure', 'General Rate', 'Senior Rate', `Maturity (₹${(amount/100000).toFixed(0)}L)`, 'Interest Earned', 'TDS', 'Net Returns'].map(h => (
                <th key={h} style={{ padding: '12px', textAlign: h === 'Tenure' ? 'left' : 'right', color: 'var(--text-tertiary)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bank.allRates.map(r => {
              const rate = isSenior ? r.senior : r.general;
              const calc = calculateFDMaturity(amount, rate, r.tenureYears);
              return (
                <tr key={r.tenure} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 500, color: 'var(--text-primary)' }}>{r.tenureLabel}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--gold)' }}>{r.general.toFixed(2)}%</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--success)' }}>{r.senior.toFixed(2)}%</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>₹{calc.maturityValue.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>+₹{calc.totalInterest.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: calc.tds > 0 ? 'var(--danger)' : 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{calc.tds > 0 ? `-₹${calc.tds.toLocaleString('en-IN')}` : 'Nil'}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>₹{calc.netMaturity.toLocaleString('en-IN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
