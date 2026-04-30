const CHAIN_LOGOS = {
  ethereum: '⟠', bitcoin: '₿', polygon: '⬡', bsc: 'BNB',
};
const CHAIN_COLORS = {
  ethereum: '#627EEA', bitcoin: '#F7931A', polygon: '#8247E5', bsc: '#F3BA2F',
};

export default function CryptoWallet({ wallets }) {
  const totalUSD = wallets.reduce((s, w) => s + parseFloat(w.current_value || 0), 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Crypto Portfolio</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            ≈ ${totalUSD.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
          <span className="badge badge-warning text-xs">Live</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {wallets.map((wallet, i) => {
          const chain = wallet.blockchain || 'ethereum';
          const logo = CHAIN_LOGOS[chain] || '●';
          const color = CHAIN_COLORS[chain] || 'var(--text-tertiary)';

          return (
            <div
              key={wallet.id || i}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--border-subtle)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: '40px', height: '40px',
                    background: `${color}20`,
                    color: color,
                    fontSize: '18px',
                  }}
                >
                  {logo}
                </div>
                <div>
                  <div className="font-semibold text-sm capitalize">{chain}</div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    {wallet.wallet_address
                      ? `${wallet.wallet_address.slice(0, 6)}...${wallet.wallet_address.slice(-4)}`
                      : 'Manual entry'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  ${parseFloat(wallet.current_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {wallet.principal ? `₹${parseFloat(wallet.principal).toLocaleString('en-IN')}` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}