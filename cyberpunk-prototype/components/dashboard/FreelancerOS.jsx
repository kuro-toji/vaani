// ═══════════════════════════════════════════════════════════════════
// VAANI Freelancer OS Component
// Income tracker, GST invoice, ITR export for freelancers
// ═══════════════════════════════════════════════════════════════════
import { getClientSummary } from '../../services/freelancerService';

export default function FreelancerOS({ incomes }) {
  const clients = getClientSummary(incomes || []);
  const totalIncome = clients.reduce((s, c) => s + c.totalIncome, 0);
  const totalTDS = clients.reduce((s, c) => s + c.totalTDS, 0);

  if (!incomes || incomes.length === 0) {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">🧾 Freelancer OS</h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No income logged yet. Say "Rahul ne ₹25,000 bheja" to log income.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">🧾 Freelancer OS</h3>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm text-xs">📄 Invoice</button>
          <button className="btn btn-ghost btn-sm text-xs">📊 ITR</button>
        </div>
      </div>
      
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-base)' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Income</div>
          <div className="font-bold text-sm" style={{ color: 'var(--success)' }}>₹{totalIncome.toLocaleString('en-IN')}</div>
        </div>
        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-base)' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>TDS Collected</div>
          <div className="font-bold text-sm">₹{totalTDS.toLocaleString('en-IN')}</div>
        </div>
      </div>
      
      {/* Client List */}
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Top Clients</p>
      <div className="space-y-2">
        {clients.slice(0, 5).map((client, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg-base)' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">👤</span>
              <div>
                <p className="font-semibold text-sm">{client.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{client.count} payments</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm">₹{client.totalIncome.toLocaleString('en-IN')}</p>
              {client.totalTDS > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>TDS: ₹{client.totalTDS.toLocaleString('en-IN')}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-4 flex gap-2">
        <button className="btn btn-primary btn-sm flex-1">+ Log Income</button>
        <button className="btn btn-outline btn-sm flex-1">Export ITR</button>
      </div>
    </div>
  );
}