import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getTopFDs } from '../../services/fdRatesService.js';
import { getPopularSIPFunds } from '../../services/amfiService.js';
import { getMultiplePrices, POPULAR_SYMBOLS, formatCryptoPrice, formatMarketCap, formatChange } from '../../services/binanceService.js';

const DEV_MODE = import.meta.env.VITE_DEV_AUTH === 'true';
const SUPABASE_OK = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
const REFRESH_INTERVAL = 60000; // 60s auto-refresh

// ─── Supabase Data Fetch ─────────────────────────────────────────
async function fetchUserPortfolio(userId) {
  if (!SUPABASE_OK || DEV_MODE) return null;
  try {
    const { data } = await supabase.from('portfolios').select('*').eq('user_id', userId);
    return {
      fd: (data || []).filter(p => p.type === 'fd'),
      sip: (data || []).filter(p => p.type === 'sip'),
      crypto: (data || []).filter(p => p.type === 'crypto'),
    };
  } catch { return null; }
}

async function fetchUserTransactions(userId) {
  if (!SUPABASE_OK || DEV_MODE) return null;
  try {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(20);
    return data || [];
  } catch { return null; }
}

/* ═══════════════════════════════════════════════════════════════════
   MARKET DATA COMPONENTS — Real live data, no fake numbers
   ═══════════════════════════════════════════════════════════════════ */

function SectionLabel({ label }) {
  return (
    <div style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <span style={{ width: '20px', height: '1px', background: 'var(--gold)', display: 'block' }} />
      {label}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 300, marginBottom: '16px' }}>
      {children}
    </h2>
  );
}

/* ─── Extended Crypto Table ─── */
function CryptoMarketTable({ coins }) {
  if (!coins?.length) return null;
  return (
    <div style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>₿</span>
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--orange)' }}>Crypto Market · {coins.length} Coins</span>
        </div>
        <span style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>● Live</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['#', 'Coin', 'Price (₹)', '1h', '24h', '7d', 'Market Cap', 'Volume 24h', 'Supply', 'ATH', 'Since'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Coin' ? 'left' : 'right', color: 'var(--text-tertiary)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coins.map((c, i) => (
              <tr key={c.symbol} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dim)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px', color: 'var(--text-tertiary)', textAlign: 'right' }}>{c.marketCapRank || i + 1}</td>
                <td style={{ padding: '12px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {c.image ? <img src={c.image} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} /> : <span>{c.icon}</span>}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.coinName}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{c.baseAsset} · {c.category} · {c.createdDate}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatCryptoPrice(c.priceInINR)}</td>
                <ChangeCell value={c.change1h} />
                <ChangeCell value={c.change24h} />
                <ChangeCell value={c.change7d} />
                <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{formatMarketCap(c.marketCap)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{formatMarketCap(c.totalVolume)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                  {c.circulatingSupply ? `${(c.circulatingSupply / 1e6).toFixed(1)}M` : '--'}
                  {c.maxSupply ? <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}> / {(c.maxSupply / 1e6).toFixed(0)}M</span> : ''}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: 'var(--gold)', fontVariantNumeric: 'tabular-nums', fontSize: '11px' }}>{c.ath ? formatCryptoPrice(c.ath) : '--'}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '11px' }}>
                  <span style={{ color: 'var(--danger)' }}>{c.athChangePercent ? `${c.athChangePercent.toFixed(0)}%` : '--'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChangeCell({ value }) {
  if (value == null) return <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-tertiary)' }}>--</td>;
  const color = value >= 0 ? 'var(--success)' : 'var(--danger)';
  const arrow = value >= 0 ? '▲' : '▼';
  return (
    <td style={{ padding: '12px', textAlign: 'right', color, fontWeight: 500, fontVariantNumeric: 'tabular-nums', fontSize: '12px' }}>
      {arrow} {Math.abs(value).toFixed(2)}%
    </td>
  );
}

/* ─── FD Comparison Table ─── */
function FDComparisonTable({ rates }) {
  if (!rates?.length) return null;
  return (
    <div style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏦</span>
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>FD Rates Comparison</span>
        </div>
        <span style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Apr 2026</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1px', background: 'var(--border-subtle)' }}>
        {rates.map((fd, i) => (
          <div key={i} style={{ background: 'var(--ink-card)', padding: '16px', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--ink-card)'}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {fd.bankName?.split(' ').slice(0, 2).join(' ')}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{fd.displayRate}%</div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '6px' }}>{fd.tenureLabel || '1 Year'}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Senior: +0.5% · DICGC ₹5L ✓
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── SIP Fund Cards ─── */
function SIPFundCards({ funds }) {
  if (!funds?.length) return null;
  return (
    <div style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📈</span>
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--success)' }}>Mutual Fund NAV</span>
        </div>
        <span style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>AMFI Live</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1px', background: 'var(--border-subtle)' }}>
        {funds.map((f, i) => (
          <div key={i} style={{ background: 'var(--ink-card)', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
              {f.schemeName?.split(' - ')[0]?.substring(0, 30)}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--success)', lineHeight: 1 }}>₹{f.nav?.toFixed(2)}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
              {f.schemeCode ? `Code: ${f.schemeCode}` : ''} · Updated: {f.date || 'Today'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState({ fd: [], sip: [], crypto: [] });
  const [liveData, setLiveData] = useState({ fdRates: [], sipNav: [], cryptoPrices: [] });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadMarketData = useCallback(async () => {
    const [fdRes, sipRes, cryptoRes] = await Promise.allSettled([
      getTopFDs(),
      getPopularSIPFunds(),
      getMultiplePrices(POPULAR_SYMBOLS), // All 20 coins now
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
      try {
        await loadMarketData();

        // Load user portfolio from Supabase (if available)
        if (user?.id && SUPABASE_OK && !DEV_MODE) {
          const [portRes, txRes] = await Promise.allSettled([
            fetchUserPortfolio(user.id),
            fetchUserTransactions(user.id),
          ]);
          if (!cancelled) {
            if (portRes?.status === 'fulfilled' && portRes.value) setPortfolio(portRes.value);
            if (txRes?.status === 'fulfilled' && txRes.value) setTransactions(txRes.value);
          }
        }
      } catch (err) {
        console.error('[Dashboard] Load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAll();

    // Auto-refresh market data every 60s
    const interval = setInterval(loadMarketData, REFRESH_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.id, loadMarketData]);

  const totalFD = portfolio.fd.reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalSIP = portfolio.sip.reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalCrypto = portfolio.crypto.reduce((s, c) => s + parseFloat(c.current_value || 0), 0);
  const totalPortfolio = totalFD + totalSIP + totalCrypto;
  const hasPortfolio = portfolio.fd.length > 0 || portfolio.sip.length > 0 || portfolio.crypto.length > 0;

  if (loading) return <DashboardSkeleton />;

  const { fdRates, sipNav, cryptoPrices } = liveData;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ─── Refresh Status ─── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
          {lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString('en-IN')}` : ''}
          {' '}· Auto-refreshes every 60s
        </span>
      </div>

      {/* ═══ SECTION: Live Crypto Market ═══ */}
      <div style={{ marginBottom: '32px' }}>
        <SectionLabel label="Live Markets" />
        <SectionTitle>Crypto <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Market</em></SectionTitle>
        <CryptoMarketTable coins={cryptoPrices} />
      </div>

      {/* ═══ SECTION: FD Rates + SIP NAV ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div>
          <SectionLabel label="Fixed Deposits" />
          <FDComparisonTable rates={fdRates} />
        </div>
        <div>
          <SectionLabel label="Mutual Funds" />
          <SIPFundCards funds={sipNav} />
        </div>
      </div>

      {/* ═══ SECTION: Your Portfolio ═══ */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <SectionLabel label="Your Portfolio" />
            <SectionTitle>Investment <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Overview</em></SectionTitle>
          </div>
          {hasPortfolio && <span className="badge badge-primary">{DEV_MODE ? 'Demo' : 'Live'}</span>}
        </div>

        {hasPortfolio ? (
          <>
            <StatCards totalPortfolio={totalPortfolio} totalFD={totalFD} totalSIP={totalSIP} totalCrypto={totalCrypto} vaaniScore={0} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <PortfolioChart fd={totalFD} sip={totalSIP} crypto={totalCrypto} />
              <QuickActions />
            </div>

            {/* Investment details */}
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
            background: 'var(--ink-card)', border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
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

      {/* ═══ SECTION: Financial Intelligence ═══ */}
      <div style={{ marginBottom: '32px' }}>
        <SectionLabel label="Financial Intelligence" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          <CommandCenter portfolio={portfolio} fireData={{ fireNumber: 9000000 }} />
          <TaxIntelligence incomeData={{ annualIncome: 600000, existingTDS: 25000, deductions80C: 100000, deductions80D: 15000, deductions80CCD1B: 0, otherDeductions: 0 }} />
          <FreelancerOS incomes={[]} />
          <IdleMoney userData={{ totalBankBalance: 85000, emergencyFundBuffer: 50000, monthlyBudget: 25000, upcomingEMI: 0, savingsGoals: 0, lockedInvestments: 50000 }} />
        </div>
      </div>

      {/* ─── Demo CTA ─── */}
      <div style={{ textAlign: 'center', padding: '60px 0 40px', borderTop: '1px solid var(--line)' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Explore All Features</div>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 300, marginBottom: '24px' }}>
          See every <em style={{ color: 'var(--gold)' }}>feature</em> in action
        </h3>
        <button onClick={() => navigate('/demo')} className="btn-gold btn-lg">View Full Demo</button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="skeleton" style={{ height: '24px', width: '200px', marginBottom: '24px', borderRadius: '4px' }} />
      <div className="skeleton" style={{ height: '400px', borderRadius: '12px', marginBottom: '24px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {[0, 1].map(i => <div key={i} className="skeleton" style={{ height: '250px', borderRadius: '12px' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}
      </div>
    </div>
  );
}