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

// Check if Supabase is properly configured
const SUPABASE_CONFIGURED = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

// Example mock data — shown by default or when user clicks "View Example" button
const EXAMPLE_DATA = {
  fd: [
    { id: '1', type: 'fd', bank: 'Suryoday SFB', principal: 15000, current_value: 15800, rate: 9.1, maturity_date: '2025-06-01', tenure_months: 12, start_date: '2024-06-01' },
    { id: '2', type: 'fd', bank: 'Utkarsh SFB', principal: 12000, current_value: 12510, rate: 8.5, maturity_date: '2025-09-01', tenure_months: 12, start_date: '2024-09-01' },
    { id: '3', type: 'fd', bank: 'Jana SFB', principal: 20000, current_value: 21200, rate: 8.25, maturity_date: '2026-03-01', tenure_months: 18, start_date: '2024-09-01' },
  ],
  sip: [
    { id: '4', type: 'sip', fund: 'Mirae Asset Large Cap', principal: 24000, current_value: 28420, monthly: 2000, units: 45.23, nav: 89.4, start_date: '2024-01-01' },
    { id: '5', type: 'sip', fund: 'Axis Small Cap', principal: 12000, current_value: 13940, monthly: 1000, units: 12.1, nav: 134.2, start_date: '2024-03-01' },
    { id: '6', type: 'sip', fund: 'Nippon India Blue Chip', principal: 6000, current_value: 7280, monthly: 500, units: 28.5, nav: 76.8, start_date: '2024-06-01' },
  ],
  crypto: [
    { id: '7', type: 'crypto', coin: 'Bitcoin', symbol: 'BTC', amount: 0.0021, current_value: 8400, buy_price: 7350, blockchain: 'bitcoin', start_date: '2024-01-01' },
    { id: '8', type: 'crypto', coin: 'Ethereum', symbol: 'ETH', amount: 0.05, current_value: 5200, buy_price: 4800, blockchain: 'ethereum', start_date: '2024-02-01' },
  ],
  transactions: [
    { id: 101, date: new Date().toISOString(), description: 'FD Deposit — Suryoday', amount: -15000, type: 'debit', category: 'investment' },
    { id: 102, date: new Date().toISOString(), description: 'SIP — Mirae Asset', amount: -2000, type: 'debit', category: 'investment' },
    { id: 103, date: new Date(Date.now() - 86400000).toISOString(), description: 'Salary Credit', amount: 45000, type: 'credit', category: 'income' },
    { id: 104, date: new Date(Date.now() - 172800000).toISOString(), description: 'FD Maturity — SBI', amount: 22000, type: 'credit', category: 'investment' },
    { id: 105, date: new Date(Date.now() - 259200000).toISOString(), description: 'SIP — Axis Small Cap', amount: -1000, type: 'debit', category: 'investment' },
  ],
};

/**
 * Dashboard — 60% right panel on desktop.
 * Shows: Stats, Portfolio allocation, FD/SIP trackers, Crypto, Transactions.
 * Only shows real data from Supabase — click "View Example" to see demo data.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState({ fd: [], sip: [], crypto: [] });
  const [transactions, setTransactions] = useState([]);
  const [vaaniScore, setVaaniScore] = useState(0);
  const [loading, setLoading] = useState(true);
  // Always show example data by default (real Supabase data requires tables to exist)
  const [showExample, setShowExample] = useState(true);

  // Load portfolio + transactions from Supabase
  useEffect(() => {
    // If Supabase is not configured or showing example, skip loading
    if (!SUPABASE_CONFIGURED || !user || showExample) {
      if (!SUPABASE_CONFIGURED) {
        // Auto-load example data if Supabase is not configured
        setPortfolio({ fd: EXAMPLE_DATA.fd, sip: EXAMPLE_DATA.sip, crypto: EXAMPLE_DATA.crypto });
        setTransactions(EXAMPLE_DATA.transactions);
        setShowExample(true);
      }
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);

      const [pfRes, txRes] = await Promise.all([
        supabase.from('portfolios').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(20),
      ]);

      if (pfRes.data && pfRes.data.length > 0) {
        setPortfolio({
          fd: pfRes.data.filter(p => p.type === 'fd'),
          sip: pfRes.data.filter(p => p.type === 'sip'),
          crypto: pfRes.data.filter(p => p.type === 'crypto'),
        });
      } else {
        setPortfolio({ fd: [], sip: [], crypto: [] });
      }

      if (txRes.data && txRes.data.length > 0) {
        setTransactions(txRes.data);
      } else {
        setTransactions([]);
      }

      setLoading(false);
    }

    load();
  }, [user, showExample]);

  // Load example data for demo
  const handleShowExample = () => {
    setPortfolio({ fd: EXAMPLE_DATA.fd, sip: EXAMPLE_DATA.sip, crypto: EXAMPLE_DATA.crypto });
    setTransactions(EXAMPLE_DATA.transactions);
    setShowExample(true);
  };

  // Go back to real data
  const handleShowReal = async () => {
    setShowExample(false);
    if (!user) return;
    setLoading(true);
    
    const [pfRes, txRes] = await Promise.all([
      supabase.from('portfolios').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(20),
    ]);

    if (pfRes.data && pfRes.data.length > 0) {
      setPortfolio({
        fd: pfRes.data.filter(p => p.type === 'fd'),
        sip: pfRes.data.filter(p => p.type === 'sip'),
        crypto: pfRes.data.filter(p => p.type === 'crypto'),
      });
    } else {
      setPortfolio({ fd: [], sip: [], crypto: [] });
    }

    if (txRes.data && txRes.data.length > 0) {
      setTransactions(txRes.data);
    } else {
      setTransactions([]);
    }

    setLoading(false);
  };

  // Calculate totals
  const totalFD = portfolio.fd.reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalSIP = portfolio.sip.reduce((s, s_) => s + parseFloat(s_.current_value || s_.principal || 0), 0);
  const totalCrypto = portfolio.crypto.reduce((s, c) => s + parseFloat(c.current_value || 0), 0);
  const totalPortfolio = totalFD + totalSIP + totalCrypto;

  // Check if we have any data
  const hasData = portfolio.fd.length > 0 || portfolio.sip.length > 0 || portfolio.crypto.length > 0 || transactions.length > 0;

  if (loading) return <DashboardSkeleton />;

  // No data state
  if (!hasData) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ fontFamily: 'var(--font-sans)', height: '100%', padding: '40px' }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <h2 className="font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
          No Portfolio Data Yet
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px' }}>
          Add your first investment using the chat or view an example of how your dashboard will look.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={handleShowExample}
            className="btn btn-primary"
            style={{ padding: '12px 24px' }}
          >
            View Example
          </button>
        </div>
        
        <div className="mt-8">
          <QuickActions compact />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-6 p-6"
      style={{ fontFamily: 'var(--font-sans)', maxWidth: '100%' }}
    >
      {/* Header with Demo toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Your Portfolio</h2>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {showExample ? '📌 Example Data (Demo)' : 'Real-time tracking'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showExample && (
            <button
              onClick={handleShowReal}
              className="btn btn-ghost text-xs"
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              Exit Demo
            </button>
          )}
          <span className="badge badge-primary text-xs">Live</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          </svg>
        </div>
      </div>

      {/* Stat cards row */}
      <StatCards
        totalPortfolio={totalPortfolio}
        totalFD={totalFD}
        totalSIP={totalSIP}
        totalCrypto={totalCrypto}
        vaaniScore={vaaniScore}
        transactionCount={transactions.length}
      />

      {/* Portfolio chart + Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <PortfolioChart fd={totalFD} sip={totalSIP} crypto={totalCrypto} />
        <QuickActions />
      </div>

      {/* FD Ladder Timeline */}
      {portfolio.fd.length > 0 && (
        <FDLadderTimeline fds={portfolio.fd} />
      )}

      {/* SIP Tracker */}
      {portfolio.sip.length > 0 && (
        <SIPTracker sips={portfolio.sip} />
      )}

      {/* Crypto Wallet */}
      {portfolio.crypto.length > 0 && (
        <CryptoWallet wallets={portfolio.crypto} />
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <TransactionList transactions={transactions} />
      )}

      {/* Bottom padding for scroll */}
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
      <div className="skeleton h-32 rounded-xl" />
    </div>
  );
}