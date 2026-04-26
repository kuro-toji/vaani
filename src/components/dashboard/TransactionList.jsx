const TYPE_COLORS = {
  income: 'var(--success)',
  expense: 'var(--danger)',
  investment: 'var(--accent)',
};

const CATEGORY_ICONS = {
  groceries: '🛒', rent: '🏠', utilities: '💡', transport: '🛵',
  education: '📚', healthcare: '🏥', entertainment: '🎬',
  salary: '💰', investment: '📈', other: '📋',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function TransactionList({ transactions }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Recent Transactions</h3>
        <button className="btn btn-ghost btn-sm text-xs" style={{ color: 'var(--text-tertiary)' }}>
          View all →
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {transactions.slice(0, 10).map((tx, i) => {
          const icon = CATEGORY_ICONS[tx.category] || '📋';
          const color = TYPE_COLORS[tx.type] || 'var(--text-tertiary)';
          const prefix = tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : '';

          return (
            <div
              key={tx.id || i}
              className="flex items-center justify-between py-2"
              style={{ borderBottom: i < transactions.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: '36px', height: '36px',
                    background: `${color}15`,
                    fontSize: '16px',
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div className="font-medium text-sm capitalize">{tx.category || tx.description || 'Transaction'}</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {formatDate(tx.date)}
                    {tx.voice_transcript && (
                      <span className="ml-1 opacity-60"> · voice</span>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="font-semibold text-sm"
                style={{ color }}
              >
                {prefix}₹{parseFloat(tx.amount || 0).toLocaleString('en-IN')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}