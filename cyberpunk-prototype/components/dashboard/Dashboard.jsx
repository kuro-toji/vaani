import { useState, useEffect } from 'react';
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
import { getMultiplePrices } from '../../services/binanceService.js';

const DEV_MODE = import.meta.env.VITE_DEV_AUTH === 'true';
const SUPABASE_CONFIGURED = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
// Supabase is configured but DEV_MODE bypasses it - suppress errors in DEV_MODE
const SUPABASE_READY = SUPABASE_CONFIGURED && !DEV_MODE;

// Example mock data — current April 2025 rates
const EXAMPLE_DATA = {
  fd: [
    { id: '1', type: 'fd', bank: 'Suryoday SFB', principal: 15000, current_value: 16365, rate: 9.10, maturity_date: '2025-06-01', tenure_months: 12, start_date: '2024-06-01' },
    { id: '2', type: 'fd', bank: 'Utkarsh SFB', principal: 12000, current_value: 13020, rate: 8.50, maturity_date: '2025-09-01', tenure_months: 12, start_date: '2024-09-01' },
  ],
  sip: [
    { id: '4', type: 'sip', fund: 'Mirae Asset Large Cap', principal: 24000, current_value: 28420, monthly: 2000, units: 45.23, nav: 89.4, start_date: '2024-01-01' },
    { id: '5', type: 'sip', fund: 'Axis Small Cap', principal: 12000, current_value: 13940, monthly: 1000, units: 12.1, nav: 134.2, start_date: '2024-03-01' },
  ],
  crypto: [
    { id: '7', type: 'crypto', coin: 'Bitcoin', symbol: 'BTC', amount: 0.0021, current_value: 8400, buy_price: 7350, blockchain: 'bitcoin', start_date: '2024-01-01' },
    { id: '8', type: 'crypto', coin: 'Ethereum', symbol: 'ETH', amount: 0.05, current_value: 5200, buy_price: 4800, blockchain: 'ethereum', start_date: '2024-02-01' },
  ],
  transactions: [
    { id: 101, date: new Date().toISOString(), description: 'FD Deposit — Suryoday', amount: -15000, type: 'debit', category: 'investment' },
    { id: 102, date: new Date().toISOString(), description: 'SIP — Mirae Asset', amount: -2000, type: 'debit', category: 'investment' },
  ],
};

// Demo user data for new features
const DEMO_USER_DATA = {
  totalBankBalance: 85000,
  emergencyFundBuffer: 50000,
  monthlyBudget: 25000,
  upcomingEMI: 0,
  savingsGoals: 0,
  lockedInvestments: 50000,
};

const DEMO_INCOME_DATA = {
  annualIncome: 600000,
  existingTDS: 25000,
  deductions80C: 100000,
  deductions80D: 15000,
  deductions80CCD1B: 0,
  otherDeductions: 0,
};

const DEMO_FIRE_DATA = {
  fireNumber: 9000000, // ₹90L target
};

// Helper: fetch user portfolio from Supabase
async function fetchUserPortfolio(userId) {
  if (DEV_MODE) return null; // Skip in DEV_MODE to avoid 404 errors
  try {
    const { data } = await supabase.from('portfolios').select('*').eq('user_id', userId);
    return {
      fd: (data || []).filter(p => p.type === 'fd'),
      sip: (data || []).filter(p => p.type === 'sip'),
      crypto: (data || []).filter(p => p.type === 'crypto'),
    };
  } catch (err) {
    console.warn('[Dashboard] Portfolio fetch skipped:', err.message);
    return null;
  }
}

// Helper: fetch user transactions from Supabase
async function fetchUserTransactions(userId) {
  if (DEV_MODE) return null; // Skip in DEV_MODE to avoid 404 errors
  try {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(20);
    return data || [];
  } catch (err) {
    console.warn('[Dashboard] Transactions fetch skipped:', err.message);
    return null;
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState({ fd: [], sip: [], crypto: [] });
  const [liveData, setLiveData] = useState({ fdRates: [], sipNav: [], cryptoPrices: {} });
  const [transactions, setTransactions] = useState([]);
  const [vaaniScore, setVaaniScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── COORDINATED DATA LOADER ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError(null);

      try {
        // Run all fetches in parallel
        const [fdRatesResult, sipNavResult, userPortfolioResult, userTxResult] = await Promise.allSettled([
          getTopFDs(),
          getPopularSIPFunds(),
          user?.id ? fetchUserPortfolio(user.id) : Promise.resolve(null),
          user?.id ? fetchUserTransactions(user.id) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        // Live market data — always load from market APIs
        const fdRates = fdRatesResult.status === 'fulfilled' ? (fdRatesResult.value || []) : [];
        const sipNav = sipNavResult.status === 'fulfilled' ? (sipNavResult.value || []) : [];
        setLiveData({ fdRates, sipNav, cryptoPrices: {} });

        // User portfolio — use real data if logged in, example if not
        let portfolioData;
        if (DEV_MODE || !SUPABASE_CONFIGURED) {
          portfolioData = EXAMPLE_DATA;
        } else if (userPortfolioResult?.status === 'fulfilled' && userPortfolioResult.value) {
          portfolioData = userPortfolioResult.value;
        } else {
          portfolioData = { fd: [], sip: [], crypto: [] };
        }
        setPortfolio(portfolioData);

        // Transactions
        const txData = (userTxResult?.status === 'fulfilled' && userTxResult.value)
          ? userTxResult.value
          : EXAMPLE_DATA.transactions;
        setTransactions(txData);

        // Fetch crypto prices only for coins user actually holds
        if (portfolioData.crypto?.length > 0) {
          const symbols = portfolioData.crypto.map(c => c.symbol + 'USDT');
          const pricesResult = await getMultiplePrices(symbols).catch(() => ({}));
          if (!cancelled) {
            setLiveData(prev => ({ ...prev, cryptoPrices: pricesResult }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[Dashboard] Error:', err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleShowExample = () => {
    setPortfolio({ fd: EXAMPLE_DATA.fd, sip: EXAMPLE_DATA.sip, crypto: EXAMPLE_DATA.crypto });
    setTransactions(EXAMPLE_DATA.transactions);
  };

  const totalFD = portfolio.fd.reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalSIP = portfolio.sip.reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalCrypto = portfolio.crypto.reduce((s, c) => s + parseFloat(c.current_value || 0), 0);
  const totalPortfolio = totalFD + totalSIP + totalCrypto;
  const hasData = portfolio.fd.length > 0 || portfolio.sip.length > 0 || portfolio.crypto.length > 0;
  const isDemoMode = DEV_MODE || !SUPABASE_CONFIGURED || !user;

  if (loading) return <DashboardSkeleton />;
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: '100%', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <h2 className="font-bold text-xl mb-2">No Portfolio Data Yet</h2>
        <button onClick={handleShowExample} className="btn btn-primary mt-4">View Example</button>
      </div>
    );
  }

  const fdRates = liveData?.fdRates || [];
  const sipNav = liveData?.sipNav || [];
  const cryptoPrices = liveData?.cryptoPrices || {};

  return (
    <div className="flex flex-col gap-6 p-6" style={{ maxWidth: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Your Portfolio</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isDemoMode ? '📌 Demo Mode' : 'Real-time tracking'}
          </p>
        </div>
        <span className="badge badge-primary text-xs">
          {loading ? 'Updating...' : 'Live'}
        </span>
      </div>

      {/* Demo Data Banner */}
      {!user && (
        <div style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '8px',
          padding: '8px 16px',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
        }}>
          📊 Demo data — <a href="/auth" style={{ color: 'var(--primary)' }}>Sign in</a> to see your real portfolio
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          color: 'var(--danger)',
        }}>
          ⚠️ Error loading data: {error}
        </div>
      )}

      {/* New Feature Cards - 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CommandCenter portfolio={portfolio} fireData={DEMO_FIRE_DATA} />
        <TaxIntelligence incomeData={DEMO_INCOME_DATA} />
        <FreelancerOS incomes={[]} />
        <IdleMoney userData={DEMO_USER_DATA} />
      </div>

      {/* Live Market Data Banner */}
      {fdRates.length > 0 && (
        <div className="card p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--primary-muted)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">📈 Live Market Rates</h3>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Auto-refreshes every 60s</span>
          </div>
          {/* FD Rates */}
          <div className="mb-3">
            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>🏦 Top FD Rates (1 Year)</p>
            <div className="flex gap-2 overflow-x-auto">
              {fdRates.slice(0, 4).map((fd, i) => (
                <div key={i} className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-base)', minWidth: '120px' }}>
                  <p className="font-bold text-sm">{fd.bankName?.split(' ').slice(0, 2).join(' ') || fd.bankName}</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{fd.displayRate}%</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{fd.tenureLabel}</p>
                </div>
              ))}
            </div>
          </div>
          {/* SIP NAV */}
          {sipNav.length > 0 && (
            <div className="mb-3">
              <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>📊 SIP Fund NAV</p>
              <div className="flex gap-2 overflow-x-auto">
                {sipNav.slice(0, 4).map((sip, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-base)', minWidth: '140px' }}>
                    <p className="font-medium text-xs truncate" style={{ maxWidth: '130px' }}>{sip.schemeName?.split(' - ')[0] || sip.schemeName}</p>
                    <p className="text-lg font-bold" style={{ color: 'var(--success)' }}>₹{sip.nav?.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Crypto Prices - getMultiplePrices returns ARRAY */}
          {Array.isArray(cryptoPrices) && cryptoPrices.length > 0 && (
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>₿ Crypto Prices</p>
              <div className="flex gap-2 overflow-x-auto">
                {cryptoPrices.slice(0, 5).map((price, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg" style={{ background: 'var(--bg-base)', minWidth: '100px' }}>
                    <p className="font-bold text-sm">{price.baseAsset || price.coinName || 'Unknown'}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--success)' }}>
                      ₹{typeof price.priceInINR === 'number' ? price.priceInINR.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 'N/A'}
                    </p>
                    <p className="text-xs" style={{ color: (price.change24h || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {typeof price.change24h === 'number' ? (price.change24h >= 0 ? '+' : '') + price.change24h.toFixed(2) + '%' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <StatCards totalPortfolio={totalPortfolio} totalFD={totalFD} totalSIP={totalSIP} totalCrypto={totalCrypto} vaaniScore={vaaniScore} />

      <div className="grid grid-cols-2 gap-4">
        <PortfolioChart fd={totalFD} sip={totalSIP} crypto={totalCrypto} />
        <QuickActions />
      </div>

      {portfolio.fd.length > 0 && <FDLadderTimeline fds={portfolio.fd} />}
      {portfolio.sip.length > 0 && <SIPTracker sips={portfolio.sip} />}
      {portfolio.crypto.length > 0 && <CryptoWallet wallets={portfolio.crypto} />}
      {transactions.length > 0 && <TransactionList transactions={transactions} />}

      <div style={{ height: '40px' }} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="skeleton h-6 w-48 rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
    </div>
  );
}