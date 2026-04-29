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

// DEV_MODE - show example data without Supabase
const DEV_MODE = import.meta.env.VITE_DEV_AUTH === 'true';
const SUPABASE_CONFIGURED = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

// Example mock data
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

export default function Dashboard() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState({ fd: [], sip: [], crypto: [] });
  const [transactions, setTransactions] = useState([]);
  const [vaaniScore, setVaaniScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showExample, setShowExample] = useState(true);

  // Load data - always load example data in DEV_MODE
  useEffect(() => {
    if (DEV_MODE || !SUPABASE_CONFIGURED) {
      // DEV_MODE: Always show example data
      setPortfolio({ fd: EXAMPLE_DATA.fd, sip: EXAMPLE_DATA.sip, crypto: EXAMPLE_DATA.crypto });
      setTransactions(EXAMPLE_DATA.transactions);
      setShowExample(true);
      setLoading(false);
      return;
    }

    // Real Supabase loading
    if (!user) {
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
      }
      if (txRes.data && txRes.data.length > 0) {
        setTransactions(txRes.data);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleShowExample = () => {
    setPortfolio({ fd: EXAMPLE_DATA.fd, sip: EXAMPLE_DATA.sip, crypto: EXAMPLE_DATA.crypto });
    setTransactions(EXAMPLE_DATA.transactions);
    setShowExample(true);
  };

  const totalFD = portfolio.fd.reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalSIP = portfolio.sip.reduce((s, s_) => s + parseFloat(s_.current_value || s_.principal || 0), 0);
  const totalCrypto = portfolio.crypto.reduce((s, c) => s + parseFloat(c.current_value || 0), 0);
  const totalPortfolio = totalFD + totalSIP + totalCrypto;

  const hasData = portfolio.fd.length > 0 || portfolio.sip.length > 0 || portfolio.crypto.length > 0;

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

  return (
    <div className="flex flex-col gap-6 p-6" style={{ maxWidth: '100%' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Your Portfolio</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {showExample ? '📌 Example Data (Demo)' : 'Real-time tracking'}
          </p>
        </div>
        <span className="badge badge-primary text-xs">Live</span>
      </div>

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