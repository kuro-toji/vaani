export default function QuickActions({ compact = false }) {
  const actions = [
    {
      id: 'add-expense',
      emoji: '💸',
      label: 'Add Expense',
      color: 'var(--danger)',
      bg: 'rgba(239,68,68,0.12)',
    },
    {
      id: 'add-fd',
      emoji: '🏦',
      label: 'Add FD',
      color: 'var(--accent)',
      bg: 'var(--accent-muted)',
    },
    {
      id: 'add-sip',
      emoji: '📈',
      label: 'Add SIP',
      color: 'var(--success)',
      bg: 'rgba(16,185,129,0.12)',
    },
    {
      id: 'refresh-crypto',
      emoji: '₿',
      label: 'Crypto',
      color: 'var(--orange)',
      bg: 'rgba(255,107,0,0.12)',
    },
  ];

  return (
    <div className={`card ${compact ? '' : ''}`}>
      <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(action => (
          <button
            key={action.id}
            className="flex items-center gap-2 p-3 rounded-lg hover-lift cursor-pointer"
            style={{
              background: action.bg,
              border: '1px solid var(--border-subtle)',
              transition: 'all 0.2s var(--ease-spring)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = action.color;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <span style={{ fontSize: '18px' }}>{action.emoji}</span>
            <span className="text-xs font-medium" style={{ color: action.color }}>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}