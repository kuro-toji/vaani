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

/**
 * Dashboard — 60% right panel on desktop.
 * Shows: Stats, Portfolio allocation, FD/SIP trackers, Crypto, Transactions.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState({ fd: [], sip: [], crypto: [] });
  const [transactions, setTransactions] = useState([]);
  const [vaaniScore, setVaaniScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load portfolio + transactions from Supabase
  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);

      const [pfRes, txRes] = await Promise.all([
        supabase.from('portfolios').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(20),
      ]);

      if (pfRes.data) {
        setPortfolio({
          fd: pfRes.data.filter(p => p.type === 'fd'),
          sip: pfRes.data.filter(p => p.type === 'sip'),
          crypto: pfRes.data.filter(p => p.type === 'crypto'),
        });
      }

      if (txRes.data) {
        setTransactions(txRes.data);
      }

      setLoading(false);
    }

    load();
  }, [user]);

  // Calculate totals
  const totalFD = portfolio.fd.reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalSIP = portfolio.sip.reduce((s, s_) => s + parseFloat(s_.current_value || s_.principal || 0), 0);
  const totalCrypto = portfolio.crypto.reduce((s, c) => s + parseFloat(c.current_value || 0), 0);
  const totalPortfolio = totalFD + totalSIP + totalCrypto;

  if (loading) return <DashboardSkeleton />;

  return (
    <div
      className="flex flex-col gap-6 p-6"
      style={{ fontFamily: 'var(--font-sans)', maxWidth: '100%' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Your Portfolio</h2>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Track your investments in real time</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Empty state */}
      {portfolio.fd.length === 0 && portfolio.sip.length === 0 && portfolio.crypto.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-xl"
          style={{ background: 'var(--glass-bg)', border: '1px dashed var(--border-active)', textAlign: 'center' }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
          <h3 className="font-semibold mb-2">Start tracking your finances</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)', maxWidth: '280px' }}>
            Add your FD, SIP, or crypto holdings to see them here. Use voice — just say "add FD" to chat.
          </p>
          <QuickActions compact />
        </div>
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