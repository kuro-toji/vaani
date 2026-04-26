/**
 * FDLadderTimeline — horizontal timeline of FD maturities.
 * Shows each FD as a card on a timeline with days-to-maturity indicator.
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
  if (days === 0) return 'Due today!';
  if (days <= 30) return `${days}d left ⚠️`;
  if (days <= 90) return `${days}d left`;
  return `${days}d`;
}

function getMaturityColor(days) {
  if (days === null) return 'var(--text-tertiary)';
  if (days < 0) return 'var(--text-tertiary)';
  if (days <= 30) return 'var(--danger)';
  if (days <= 90) return 'var(--warning)';
  return 'var(--success)';
}

const BANK_LOGOS = {
  'SBI': '🏦', 'HDFC': '🏦', 'ICICI': '🏦', 'PNB': '🏦',
  'Axis': '🏦', 'Kotak': '🏦', 'BoB': '🏦', 'Post Office': '📮',
};

export default function FDLadderTimeline({ fds }) {
  const sorted = [...fds].sort((a, b) => new Date(a.maturity_date) - new Date(b.maturity_date));
  const now = new Date();

  // Calculate timeline span
  const startDates = fds.map(f => new Date(f.start_date || now)).sort((a, b) => a - b);
  const endDates = fds.map(f => new Date(f.maturity_date)).sort((a, b) => a - b);
  const timelineStart = startDates[0] || now;
  const timelineEnd = endDates[endDates.length - 1] || new Date(now.getTime() + 365 * 86400000);
  const totalMs = timelineEnd - timelineStart || 1;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">FD Ladder</h3>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {fds.length} FD{fds.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative" style={{ padding: '24px 0 16px' }}>
        {/* Timeline baseline */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: '50%', height: '2px',
            background: 'var(--border-subtle)',
            transform: 'translateY(-50%)',
          }}
        />

        {/* Today marker */}
        <div
          className="absolute"
          style={{
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: '12px', height: '12px',
              background: 'var(--primary)',
              border: '2px solid var(--bg-base)',
              boxShadow: '0 0 0 2px var(--primary)',
            }}
          />
          <div className="text-xs font-medium mt-1" style={{ color: 'var(--primary)', whiteSpace: 'nowrap' }}>
            Today
          </div>
        </div>

        {/* FD cards */}
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {sorted.map((fd, i) => {
            const days = daysToMaturity(fd.maturity_date);
            const pos = ((new Date(fd.maturity_date) - timelineStart) / totalMs) * 100;
            const clampedPos = Math.min(Math.max(pos, 5), 95);

            return (
              <div
                key={fd.id || i}
                className="flex-shrink-0 card"
                style={{
                  minWidth: '160px',
                  borderLeft: '3px solid',
                  borderLeftColor: getMaturityColor(days),
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <div className="flex items-center gap-1 mb-2">
                  <span style={{ fontSize: '16px' }}>
                    {BANK_LOGOS[fd.institution] || '🏦'}
                  </span>
                  <span className="font-semibold text-sm truncate">{fd.institution}</span>
                </div>

                <div className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                  ₹{parseFloat(fd.principal || 0).toLocaleString('en-IN')}
                </div>

                <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  {fd.interest_rate}% p.a.
                </div>

                <div
                  className="text-xs font-semibold"
                  style={{ color: getMaturityColor(days) }}
                >
                  {getMaturityLabel(days)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}