/**
 * FDLadderTimeline — shows FD maturities in a clean card layout.
 * Fixed: Uses correct field names (bank, rate, principal)
 */
function daysToMaturity(maturityDate) {
  if (!maturityDate) return null;
  const now = new Date();
  const maturity = new Date(maturityDate);
  const diff = Math.ceil((maturity - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function getMaturityLabel(days) {
  if (days === null) return '—';
  if (days < 0) return `Matured ${Math.abs(days)}d ago`;
  if (days === 0) return '📍 Due today!';
  if (days <= 30) return `⏰ ${days}d left`;
  if (days <= 90) return `${days}d`;
  return `${days}d`;
}

function getMaturityColor(days) {
  if (days === null) return 'var(--text-tertiary)';
  if (days < 0) return 'var(--text-tertiary)';
  if (days <= 30) return 'var(--danger)';
  if (days <= 90) return 'var(--warning)';
  return 'var(--success)';
}

function formatCurrency(num) {
  return parseFloat(num || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function FDLadderTimeline({ fds }) {
  if (!fds || fds.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="font-semibold text-sm mb-2">FD Ladder</h3>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No FDs yet. Add your first FD!</p>
      </div>
    );
  }

  // Sort by maturity date (nearest first)
  const sorted = [...fds].sort((a, b) => new Date(a.maturity_date) - new Date(b.maturity_date));

  // Calculate totals
  const totalInvested = fds.reduce((s, f) => s + parseFloat(f.principal || 0), 0);
  const totalCurrentValue = fds.reduce((s, f) => s + parseFloat(f.current_value || f.principal || 0), 0);
  const totalInterest = totalCurrentValue - totalInvested;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">🏦 FD Ladder</h3>
          <span className="badge badge-outline text-xs">{fds.length} FDs</span>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Value</div>
          <div className="font-bold" style={{ color: 'var(--primary)' }}>₹{formatCurrency(totalCurrentValue)}</div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-base)' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Invested</div>
          <div className="font-semibold text-sm">₹{formatCurrency(totalInvested)}</div>
        </div>
        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-base)' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Interest</div>
          <div className="font-semibold text-sm" style={{ color: 'var(--success)' }}>+₹{formatCurrency(totalInterest)}</div>
        </div>
        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-base)' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Maturity</div>
          <div className="font-semibold text-sm">{sorted.length > 0 ? sorted[sorted.length - 1].maturity_date?.split('-')[0] : '—'}</div>
        </div>
      </div>

      {/* FD Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((fd, i) => {
          const days = daysToMaturity(fd.maturity_date);
          const color = getMaturityColor(days);
          
          return (
            <div
              key={fd.id || i}
              className="p-3 rounded-xl transition-all"
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                borderLeft: `4px solid ${color}`,
              }}
            >
              {/* Bank & Rate */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏦</span>
                  <span className="font-semibold text-sm truncate" style={{ maxWidth: '120px' }}>
                    {fd.bank || fd.institution || 'Bank'}
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: color, color: 'white' }}>
                  {fd.rate || fd.interest_rate || 0}%
                </div>
              </div>

              {/* Amount */}
              <div className="mb-2">
                <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  ₹{formatCurrency(fd.principal)}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Current: ₹{formatCurrency(fd.current_value)}
                </div>
              </div>

              {/* Maturity info */}
              <div className="flex items-center justify-between">
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {fd.maturity_date ? new Date(fd.maturity_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
                <div className="text-xs font-semibold" style={{ color }}>
                  {getMaturityLabel(days)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}