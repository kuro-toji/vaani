// ═══════════════════════════════════════════════════════════════════
// VAANI Idle Money Detection Component
// Shows idle balance alert with liquid fund suggestion
// ═══════════════════════════════════════════════════════════════════
import { calculateIdleMoney, getLiquidFundRecommendation } from '../../services/idleMoneyService';

export default function IdleMoney({ userData }) {
  const idleData = calculateIdleMoney(userData);
  const recommendation = getLiquidFundRecommendation(idleData.idleAmount);

  if (!idleData.suggestion || idleData.idleAmount < 5000) {
    return null; // No idle money to show
  }

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="text-3xl">💰</div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Idle Money Detected</h3>
          <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
            ₹{idleData.idleAmount.toLocaleString('en-IN')}
          </p>
          <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Total balance: ₹{idleData.totalBalance.toLocaleString('en-IN')} | Reserved: ₹{idleData.reservedAmount.toLocaleString('en-IN')}
          </p>
          
          {recommendation && (
            <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--bg-base)' }}>
              <p className="text-sm font-medium mb-2">💡 Suggestion:</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{recommendation.fundName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Expected return: {recommendation.expectedReturn}% | Risk: {recommendation.risk}
                  </p>
                </div>
                <button className="btn btn-primary btn-sm">
                  Invest
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}