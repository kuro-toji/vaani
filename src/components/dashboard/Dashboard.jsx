import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import StatCards from './StatCards.jsx';
import PortfolioChart from './PortfolioChart.jsx';
import FDLadderTimeline from './FDLadderTimeline.jsx';
import SIPTracker from './SIPTracker.jsx';
import CryptoWallet from './CryptoWallet.jsx';
import TransactionList from './TransactionList.jsx';
import QuickActions from './QuickActions.jsx';
import CommandCenter from './CommandCenter.jsx';
import TaxIntelligence from './TaxIntelligence.jsx';
import FreelancerOS from './FreelancerOS.jsx';
import IdleMoney from './IdleMoney.jsx';
import CryptoExplorer from '../../pages/CryptoExplorer.jsx';
import FDExplorer from '../../pages/FDExplorer.jsx';
import SIPExplorer from '../../pages/SIPExplorer.jsx';
import { getTopFDs } from '../../services/fdRatesService.js';
import { getPopularSIPFunds } from '../../services/amfiService.js';
import { getMultiplePrices, POPULAR_SYMBOLS, formatCryptoPrice, formatChange } from '../../services/binanceService.js';

const DEV_MODE = import.meta.env.VITE_DEV_AUTH === 'true';
const SUPABASE_OK = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

async function fetchUserPortfolio(userId) {
  if (!SUPABASE_OK || DEV_MODE) return null;
  try {
    const { data } = await supabase.from('portfolios').select('*').eq('user_id', userId);
    return { fd: (data||[]).filter(p=>p.type==='fd'), sip: (data||[]).filter(p=>p.type==='sip'), crypto: (data||[]).filter(p=>p.type==='crypto') };
  } catch { return null; }
}

async function fetchUserTransactions(userId) {
  if (!SUPABASE_OK || DEV_MODE) return null;
  try {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(20);
    return data || [];
  } catch { return null; }
}

function SectionLabel({ label }) {
  return (
    <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <span style={{ width: '20px', height: '1px', background: 'var(--gold)', display: 'block' }} />
      {label}
    </div>
  );
}

/* ─── Market Preview Card (clickable → opens explorer) ─── */
function MarketPreview({ icon, title, accentColor, onViewAll, children }) {
  return (
    <div style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.3s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = accentColor || 'var(--gold)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
    >
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{icon}</span>
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: accentColor || 'var(--gold)' }}>{title}</span>
        </div>
        <button onClick={onViewAll} style={{
          background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '16px',
          padding: '4px 12px', fontSize: '10px', color: accentColor || 'var(--gold)',
          cursor: 'pointer', letterSpacing: '0.1em', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = accentColor || 'var(--gold)'; e.currentTarget.style.color = 'var(--bg-base)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = accentColor || 'var(--gold)'; }}
        >View All →</button>
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  );
}

/* ─── Rate Chip ─── */
function RateChip({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--bg-base)', borderRadius: '8px', padding: '12px 14px', minWidth: '130px', flex: '0 0 auto' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: color || 'var(--gold)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '10px', color: sub.startsWith('+') ? 'var(--success)' : sub.startsWith('-') ? 'var(--danger)' : 'var(--text-tertiary)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState({ fd: [], sip: [], crypto: [] });
  const [liveData, setLiveData] = useState({ fdRates: [], sipNav: [], cryptoPrices: [] });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [activePage, setActivePage] = useState(null); // 'crypto' | 'fd' | 'sip' | null

  const loadMarketData = useCallback(async () => {
    const [fdRes, sipRes, cryptoRes] = await Promise.allSettled([
      getTopFDs(), getPopularSIPFunds(), getMultiplePrices(POPULAR_SYMBOLS),
    ]);
    setLiveData({
      fdRates: fdRes.status === 'fulfilled' ? (fdRes.value || []) : [],
      sipNav: sipRes.status === 'fulfilled' ? (sipRes.value || []) : [],
      cryptoPrices: cryptoRes.status === 'fulfilled' ? (cryptoRes.value || []) : [],
    });
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      await loadMarketData();
      if (user?.id && SUPABASE_OK && !DEV_MODE) {
        const [p, t] = await Promise.allSettled([fetchUserPortfolio(user.id), fetchUserTransactions(user.id)]);
        if (!cancelled) {
          if (p?.status === 'fulfilled' && p.value) setPortfolio(p.value);
          if (t?.status === 'fulfilled' && t.value) setTransactions(t.value);
        }
      }
      if (!cancelled) setLoading(false);
    }
    loadAll();
    const interval = setInterval(loadMarketData, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.id, loadMarketData]);

  // Explorer pages
  if (activePage === 'crypto') return <CryptoExplorer onBack={() => setActivePage(null)} />;
  if (activePage === 'fd') return <FDExplorer onBack={() => setActivePage(null)} />;
  if (activePage === 'sip') return <SIPExplorer onBack={() => setActivePage(null)} />;

  const totalFD = portfolio.fd.reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalSIP = portfolio.sip.reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalCrypto = portfolio.crypto.reduce((s, c) => s + parseFloat(c.current_value || 0), 0);
  const totalPortfolio = totalFD + totalSIP + totalCrypto;
  const hasPortfolio = portfolio.fd.length > 0 || portfolio.sip.length > 0 || portfolio.crypto.length > 0;

  if (loading) return <DashboardSkeleton />;

  const { fdRates, sipNav, cryptoPrices } = liveData;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Refresh Status */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
          {lastRefresh ? `Updated: ${lastRefresh.toLocaleTimeString('en-IN')}` : ''} · Auto-refresh 60s
        </span>
      </div>

      {/* ═══ Live Market Previews ═══ */}
      <div style={{ marginBottom: '32px' }}>
        <SectionLabel label="Live Markets" />
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 300, marginBottom: '16px' }}>
          Market <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Data</em>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {/* Crypto Preview */}
          <MarketPreview icon="₿" title="Crypto Prices" accentColor="var(--orange)" onViewAll={() => setActivePage('crypto')}>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {(cryptoPrices || []).slice(0, 5).map((p, i) => (
                <RateChip key={i}
                  label={p.coinName || p.baseAsset}
                  value={formatCryptoPrice(p.priceInINR)}
                  sub={p.change24h != null ? `${p.change24h >= 0 ? '+' : ''}${p.change24h.toFixed(2)}%` : ''}
                  color={p.change24h >= 0 ? 'var(--success)' : 'var(--danger)'}
                />
              ))}
            </div>
          </MarketPreview>

          {/* FD Preview */}
          <MarketPreview icon="🏦" title="Top FD Rates (1Y)" accentColor="var(--accent)" onViewAll={() => setActivePage('fd')}>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {(fdRates || []).slice(0, 4).map((fd, i) => (
                <RateChip key={i}
                  label={fd.bankShort || fd.bankName?.split(' ').slice(0, 2).join(' ')}
                  value={`${(fd.displayRate || fd.rate)}%`}
                  sub={fd.type === 'sfb' ? 'SFB' : fd.type === 'psu' ? 'PSU' : 'Private'}
                  color="var(--accent)"
                />
              ))}
            </div>
          </MarketPreview>

          {/* SIP Preview */}
          <MarketPreview icon="📈" title="SIP Fund NAV" accentColor="var(--success)" onViewAll={() => setActivePage('sip')}>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {(sipNav || []).slice(0, 4).map((sip, i) => (
                <RateChip key={i}
                  label={sip.schemeName?.split(' - ')[0]?.substring(0, 16)}
                  value={`₹${sip.nav?.toFixed(2)}`}
                  color="var(--success)"
                />
              ))}
            </div>
          </MarketPreview>
        </div>
      </div>

      {/* ═══ Your Portfolio ═══ */}
      <div style={{ marginBottom: '32px' }}>
        <SectionLabel label="Your Portfolio" />
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 300, marginBottom: '16px' }}>
          Investment <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Overview</em>
        </h2>

        {hasPortfolio ? (
          <>
            <StatCards totalPortfolio={totalPortfolio} totalFD={totalFD} totalSIP={totalSIP} totalCrypto={totalCrypto} vaaniScore={0} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <PortfolioChart fd={totalFD} sip={totalSIP} crypto={totalCrypto} />
              <QuickActions />
            </div>
            <div style={{ marginTop: '24px' }}>
              {portfolio.fd.length > 0 && <div style={{ marginBottom: '16px' }}><FDLadderTimeline fds={portfolio.fd} /></div>}
              {portfolio.sip.length > 0 && <div style={{ marginBottom: '16px' }}><SIPTracker sips={portfolio.sip} /></div>}
              {portfolio.crypto.length > 0 && <div style={{ marginBottom: '16px' }}><CryptoWallet wallets={portfolio.crypto} /></div>}
              {transactions.length > 0 && <TransactionList transactions={transactions} />}
            </div>
          </>
        ) : (
          <div style={{
            textAlign: 'center', padding: '60px 40px',
            background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 300, marginBottom: '8px' }}>
              No Portfolio <em style={{ color: 'var(--gold)' }}>Yet</em>
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Start by adding your first FD, SIP, or Crypto investment.<br />
              Talk to VAANI to add investments via voice!
            </p>
            <QuickActions />
          </div>
        )}
      </div>

      {/* ═══ Financial Intelligence ═══ */}
      <div style={{ marginBottom: '32px' }}>
        <SectionLabel label="Financial Intelligence" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          <CommandCenter portfolio={portfolio} fireData={{ fireNumber: 9000000 }} />
          <TaxIntelligence incomeData={{ annualIncome: 600000, existingTDS: 25000, deductions80C: 100000, deductions80D: 15000, deductions80CCD1B: 0, otherDeductions: 0 }} />
          <FreelancerOS incomes={[]} />
          <IdleMoney userData={{ totalBankBalance: 85000, emergencyFundBuffer: 50000, monthlyBudget: 25000, upcomingEMI: 0, savingsGoals: 0, lockedInvestments: 50000 }} />
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="skeleton" style={{ height: '24px', width: '200px', marginBottom: '24px', borderRadius: '4px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />)}
      </div>
      <div className="skeleton" style={{ height: '300px', borderRadius: '12px', marginBottom: '24px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
      </div>
    </div>
  );
}