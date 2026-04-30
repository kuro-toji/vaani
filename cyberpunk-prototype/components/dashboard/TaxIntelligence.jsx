// ═══════════════════════════════════════════════════════════════════
// VAANI Tax Intelligence Component
// Shows tax summary, advance tax deadlines, TDS alerts
// ═══════════════════════════════════════════════════════════════════
import { calculateAdvanceTax, getYearEndTaxSavingSuggestions, detectTDS } from '../../services/taxIntelligenceService';

export default function TaxIntelligence({ incomeData }) {
  const taxData = calculateAdvanceTax(incomeData || {});
  const suggestions = getYearEndTaxSavingSuggestions(incomeData || {});
  
  // Get upcoming deadline
  const now = new Date();
  const upcomingDeadline = taxData.deadlines?.find(d => {
    const [month, day] = d.date.split(' ');
    const deadlineMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
    const deadlineDate = new Date(2025, deadlineMonth, parseInt(day));
    return deadlineDate > now;
  });

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">📊 Tax Intelligence</h3>
        <span className="badge badge-outline text-xs">FY 2024-25</span>
      </div>
      
      {/* Tax Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-base)' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Taxable Income</div>
          <div className="font-bold text-sm">₹{taxData.taxableIncome?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-base)' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Tax</div>
          <div className="font-bold text-sm" style={{ color: 'var(--danger)' }}>₹{taxData.totalTax?.toLocaleString('en-IN') || 0}</div>
        </div>
        <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-base)' }}>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Balance Due</div>
          <div className="font-bold text-sm">₹{taxData.balanceTax?.toLocaleString('en-IN') || 0}</div>
        </div>
      </div>
      
      {/* Advance Tax Deadlines */}
      {upcomingDeadline && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)' }}>
          <p className="text-xs font-medium mb-1">⏰ Next Deadline: {upcomingDeadline.date}</p>
          <p className="text-sm font-bold">₹{upcomingDeadline.amount?.toLocaleString('en-IN')}</p>
        </div>
      )}
      
      {/* Tax Saving Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>💡 Save Tax:</p>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg-base)' }}>
                <div>
                  <p className="text-sm font-semibold">Section {s.section}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>₹{s.remaining?.toLocaleString('en-IN')} remaining</p>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--success)', color: 'white' }}>
                  Best: {s.bestOption?.split(' - ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}