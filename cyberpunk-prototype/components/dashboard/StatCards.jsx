const STAT_CONFIGS = [
  {
    key: 'totalPortfolio',
    label: 'Total Portfolio',
    format: 'currency',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    color: 'var(--primary)',
    colorMuted: 'var(--primary-muted)',
  },
  {
    key: 'totalFD',
    label: 'Fixed Deposits',
    format: 'currency',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    color: 'var(--accent)',
    colorMuted: 'var(--accent-muted)',
  },
  {
    key: 'totalSIP',
    label: 'SIP Holdings',
    format: 'currency',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    color: 'var(--success)',
    colorMuted: 'rgba(16,185,129,0.15)',
  },
  {
    key: 'vaaniScore',
    label: 'VAANI Score',
    format: 'number',
    color: 'var(--orange)',
    colorMuted: 'rgba(255,107,0,0.15)',
    showChange: false,
  },
];

function formatValue(value, format) {
  if (value === 0 || value === undefined || value === null) return '—';
  if (format === 'currency') {
    return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  if (format === 'number') return value;
  return value;
}

export default function StatCards({ totalPortfolio, totalFD, totalSIP, totalCrypto, vaaniScore }) {
  const values = { totalPortfolio, totalFD, totalSIP, totalCrypto, vaaniScore };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STAT_CONFIGS.map((cfg) => {
        const val = values[cfg.key] || 0;
        return (
          <div
            key={cfg.key}
            className="stat-card hover-lift"
          >
            {/* Icon + label row */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: '36px', height: '36px',
                  background: cfg.colorMuted,
                  color: cfg.color,
                }}
              >
                {cfg.icon}
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {cfg.label}
              </span>
            </div>

            {/* Value */}
            <div className="font-extrabold" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {formatValue(val, cfg.format)}
            </div>

            {/* Change indicator */}
            <div className="flex items-center gap-1 mt-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              </svg>
              <span className="text-xs" style={{ color: 'var(--success)' }}>+2.4% this month</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}