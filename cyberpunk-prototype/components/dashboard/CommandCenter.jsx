// ═══════════════════════════════════════════════════════════════════
// VAANI Command Center Component
// Net worth, FIRE tracker, debt overview
// ═══════════════════════════════════════════════════════════════════
import { calculateFIRENumber, calculateFIREProgress, getDebtPayoffStrategy } from '../../services/commandCenterService';

export default function CommandCenter({ portfolio, fireData }) {
  // Calculate net worth from portfolio
  const totalFD = (portfolio?.fd || []).reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalSIP = (portfolio?.sip || []).reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalCrypto = (portfolio?.crypto || []).reduce((s, f) => s + parseFloat(f.current_value || 0), 0);
  const totalAssets = totalFD + totalSIP + totalCrypto + (portfolio?.bankBalance || 0);
  const totalLiabilities = (portfolio?.creditCardDues || 0) + (portfolio?.emis || []).reduce((s, e) => s + parseFloat(e.outstanding || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  // FIRE calculation
  const fireNumber = fireData?.fireNumber || calculateFIRENumber(50, 30, 30000).fireNumber;
  const fireProgress = calculateFIREProgress(netWorth, fireNumber);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">🏦 Financial Command Center</h3>
        <button className="btn btn-ghost btn-sm text-xs">⚙️ Settings</button>
      </div>
      
      {/* Net Worth */}
      <div className="text-center mb-4 p-4 rounded-xl" style={{ background: 'var(--bg-base)' }}>
        <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Net Worth</div>
        <div className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
          ₹{netWorth.toLocaleString('en-IN')}
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Assets: ₹{totalAssets.toLocaleString('en-IN')} | Liabilities: ₹{totalLiabilities.toLocaleString('en-IN')}
        </div>
      </div>
      
      {/* FIRE Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>FIRE Progress</span>
          <span className="text-xs font-bold" style={{ color: fireProgress.progress >= 50 ? 'var(--success)' : 'var(--warning)' }}>
            {fireProgress.status}
          </span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: 'var(--border-subtle)' }}>
          <div 
            className="h-2 rounded-full transition-all"
            style={{ 
              width: `${Math.min(fireProgress.progress, 100)}%`,
              background: fireProgress.progress >= 75 ? 'var(--success)' : fireProgress.progress >= 50 ? 'var(--primary)' : 'var(--warning)'
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs">₹{netWorth.toLocaleString('en-IN')}</span>
          <span className="text-xs">₹{fireProgress.fireNumber.toLocaleString('en-IN')}</span>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-base)' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Investments</div>
          <div className="font-bold text-sm">₹{(totalFD + totalSIP).toLocaleString('en-IN')}</div>
        </div>
        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-base)' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Liabilities</div>
          <div className="font-bold text-sm" style={{ color: totalLiabilities > 0 ? 'var(--danger)' : 'var(--success)' }}>
            ₹{totalLiabilities.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
      
      {/* FIRE Target */}
      <div className="p-3 rounded-lg" style={{ background: 'var(--primary-muted)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>FIRE Target</p>
            <p className="font-bold">₹{fireProgress.fireNumber.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Remaining</p>
            <p className="font-bold" style={{ color: 'var(--primary)' }}>₹{fireProgress.remaining.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}