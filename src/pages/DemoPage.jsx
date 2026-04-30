import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommandCenter from '../components/dashboard/CommandCenter.jsx';
import TaxIntelligence from '../components/dashboard/TaxIntelligence.jsx';
import FreelancerOS from '../components/dashboard/FreelancerOS.jsx';
import IdleMoney from '../components/dashboard/IdleMoney.jsx';
import CreditIntelligence from '../components/dashboard/CreditIntelligence.jsx';
import SpendAwareness from '../components/dashboard/SpendAwareness.jsx';

const DEMO_PORTFOLIO = {
  fd: [
    { id: '1', type: 'fd', bank: 'Suryoday SFB', principal: 15000, current_value: 16365, rate: 9.10, maturity_date: '2025-06-01' },
    { id: '2', type: 'fd', bank: 'Utkarsh SFB', principal: 12000, current_value: 13020, rate: 8.50, maturity_date: '2025-09-01' },
  ],
  sip: [
    { id: '4', type: 'sip', fund: 'Mirae Asset Large Cap', principal: 24000, current_value: 28420 },
  ],
  crypto: [
    { id: '7', type: 'crypto', coin: 'Bitcoin', symbol: 'BTC', amount: 0.0021, current_value: 8400 },
  ],
};

const DEMO_USER = { totalBankBalance: 85000, emergencyFundBuffer: 50000, monthlyBudget: 25000, upcomingEMI: 0, savingsGoals: 0, lockedInvestments: 50000 };
const DEMO_INCOME = { annualIncome: 600000, existingTDS: 25000, deductions80C: 100000, deductions80D: 15000, deductions80CCD1B: 0, otherDeductions: 0 };
const DEMO_FIRE = { fireNumber: 9000000 };

const DEMO_SECTIONS = [
  { id: 'command', icon: '🏦', title: 'Financial Command Center', desc: 'Net worth, FIRE tracker, debt overview — your complete financial snapshot.' },
  { id: 'tax', icon: '📊', title: 'Tax Intelligence', desc: 'Advance tax deadlines, TDS detection, year-end 80C/80D alerts.' },
  { id: 'idle', icon: '💰', title: 'Idle Money Detection', desc: 'Detects idle balance and suggests liquid fund investments.' },
  { id: 'freelancer', icon: '🧾', title: 'Freelancer OS', desc: 'Income logging, GST invoices, ITR export, TDS threshold alerts.' },
  { id: 'credit', icon: '💳', title: 'Credit Intelligence', desc: 'LAMF, borrowing capacity, rate comparison vs credit cards.' },
  { id: 'spend', icon: '🛒', title: 'Spend Awareness', desc: 'Purchase intent check, opportunity cost, monthly spending analytics.' },
];

export default function DemoPage() {
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState('command');

  const renderDemo = () => {
    switch (activeDemo) {
      case 'command': return <CommandCenter portfolio={DEMO_PORTFOLIO} fireData={DEMO_FIRE} />;
      case 'tax': return <TaxIntelligence incomeData={DEMO_INCOME} />;
      case 'idle': return <IdleMoney userData={DEMO_USER} />;
      case 'freelancer': return <FreelancerOS incomes={[]} />;
      case 'credit': return <CreditIntelligence user={null} />;
      case 'spend': return <SpendAwareness user={null} />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', background: 'rgba(12,12,14,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/app')} style={{
            background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer',
            fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            ← <span style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Back to Dashboard</span>
          </button>
        </div>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 300, letterSpacing: '0.1em' }}>
          Feature <span style={{ color: 'var(--gold)' }}>Demo</span>
        </span>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>
            Interactive Demo
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 300, lineHeight: 1.2 }}>
            Every <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>feature</em> in action
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '12px', maxWidth: '500px', margin: '12px auto 0' }}>
            Explore all VAANI features with demo data. Click any feature below to see it live.
          </p>
        </div>

        {/* Feature Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '40px' }}>
          {DEMO_SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveDemo(s.id)} style={{
              background: activeDemo === s.id ? 'var(--gold-dim)' : 'var(--ink-card)',
              border: `1px solid ${activeDemo === s.id ? 'var(--gold)' : 'var(--border-subtle)'}`,
              borderRadius: '12px', padding: '16px', cursor: 'pointer',
              textAlign: 'left', transition: 'all 0.3s', color: 'var(--text-primary)',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{s.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{s.desc}</div>
            </button>
          ))}
        </div>

        {/* Demo Content */}
        <div style={{ border: '1px solid var(--line)', borderRadius: '16px', overflow: 'hidden', background: 'var(--ink-card)' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />
            <span style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              Live Preview — {DEMO_SECTIONS.find(s => s.id === activeDemo)?.title}
            </span>
          </div>
          <div style={{ padding: '0' }}>
            {renderDemo()}
          </div>
        </div>

        {/* API Logs / Observability */}
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 300, marginBottom: '16px' }}>
            📡 Observability & <em style={{ color: 'var(--gold)' }}>API Logs</em>
          </h3>
          <div style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 2 }}>
            <div><span style={{ color: 'var(--success)' }}>[200]</span> GET /api/market/fd-rates — 142ms</div>
            <div><span style={{ color: 'var(--success)' }}>[200]</span> GET https://api.mfapi.in/mf/134336 — 89ms</div>
            <div><span style={{ color: 'var(--success)' }}>[200]</span> GET https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT — 210ms</div>
            <div><span style={{ color: 'var(--success)' }}>[200]</span> GET https://api.exchangerate-api.com/v4/latest/USD — 320ms</div>
            <div><span style={{ color: 'var(--warning)' }}>[WS]</span> Socket.io connected — chat:start</div>
            <div><span style={{ color: 'var(--accent)' }}>[AI]</span> MiniMax M2.7 — streaming 148 tokens — 1.2s</div>
            <div><span style={{ color: 'var(--success)' }}>[200]</span> POST /api/stt — Groq Whisper — 890ms</div>
            <div><span style={{ color: 'var(--success)' }}>[200]</span> Supabase RLS — portfolios.select — 45ms</div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div style={{ textAlign: 'center', marginTop: '48px', paddingBottom: '60px' }}>
          <button onClick={() => navigate('/app')} className="btn-gold btn-lg">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
