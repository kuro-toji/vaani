import { useState, useEffect, useCallback } from 'react';
import { getMultiplePrices, POPULAR_SYMBOLS, formatCryptoPrice, formatMarketCap, formatChange } from '../../services/binanceService.js';

const TABS = ['All', 'Layer 1', 'Layer 2', 'DeFi', 'Meme', 'Payments', 'Exchange', 'Oracle'];

export default function CryptoExplorer({ onBack }) {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('marketCapRank');
  const [sortDir, setSortDir] = useState('asc');

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getMultiplePrices(POPULAR_SYMBOLS);
    setCoins(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); const t = setInterval(loadData, 60000); return () => clearInterval(t); }, [loadData]);

  const filtered = coins
    .filter(c => activeTab === 'All' || c.category === activeTab)
    .sort((a, b) => {
      const av = a[sortBy] ?? 0, bv = b[sortBy] ?? 0;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  if (selectedCoin) return <CoinDetail coin={selectedCoin} onBack={() => setSelectedCoin(null)} />;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)' }}>Live Crypto Market</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 300 }}>
            Cryptocurrency <em style={{ color: 'var(--gold)' }}>Explorer</em>
          </h2>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            border: activeTab === tab ? '1px solid var(--gold)' : '1px solid var(--border-subtle)',
            background: activeTab === tab ? 'var(--gold-dim)' : 'var(--ink-card)',
            color: activeTab === tab ? 'var(--gold)' : 'var(--text-secondary)',
          }}>{tab}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>Loading market data...</div>
      ) : (
        <div style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {[
                  { key: 'marketCapRank', label: '#' },
                  { key: 'coinName', label: 'Coin' },
                  { key: 'priceInINR', label: 'Price (₹)' },
                  { key: 'change1h', label: '1h' },
                  { key: 'change24h', label: '24h' },
                  { key: 'change7d', label: '7d' },
                  { key: 'marketCap', label: 'Market Cap' },
                  { key: 'totalVolume', label: '24h Volume' },
                  { key: 'circulatingSupply', label: 'Supply' },
                ].map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)} style={{
                    padding: '12px', textAlign: col.key === 'coinName' ? 'left' : 'right',
                    color: sortBy === col.key ? 'var(--gold)' : 'var(--text-tertiary)',
                    fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
                    fontWeight: 500, cursor: 'pointer', userSelect: 'none',
                  }}>
                    {col.label} {sortBy === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.symbol} onClick={() => setSelectedCoin(c)} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dim)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--text-tertiary)' }}>{c.marketCapRank || '-'}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {c.image ? <img src={c.image} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} /> : <span style={{ fontSize: '18px' }}>{c.icon}</span>}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.coinName}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{c.baseAsset} · {c.category} · Est. {c.createdDate}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatCryptoPrice(c.priceInINR)}</td>
                  <ChangeCell v={c.change1h} />
                  <ChangeCell v={c.change24h} />
                  <ChangeCell v={c.change7d} />
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{formatMarketCap(c.marketCap)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{formatMarketCap(c.totalVolume)}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                    {c.circulatingSupply ? `${(c.circulatingSupply/1e6).toFixed(1)}M` : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Coin Detail View ─── */
function CoinDetail({ coin, onBack }) {
  const c = coin;
  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' }}>← Back to Market</button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        {c.image ? <img src={c.image} alt="" style={{ width: 48, height: 48, borderRadius: '50%' }} /> : <span style={{ fontSize: '40px' }}>{c.icon}</span>}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 300, margin: 0 }}>
            {c.coinName} <span style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>{c.baseAsset}</span>
          </h1>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Rank #{c.marketCapRank || '-'} · {c.category} · Since {c.createdDate}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCryptoPrice(c.priceInINR)}</div>
          <div style={{ fontSize: '14px', color: c.change24h >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {c.change24h >= 0 ? '▲' : '▼'} {formatChange(c.change24h)} (24h)
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {[
          { label: 'Market Cap', value: formatMarketCap(c.marketCap), icon: '📊' },
          { label: '24h Volume', value: formatMarketCap(c.totalVolume), icon: '📈' },
          { label: '24h High', value: formatCryptoPrice(c.high24h), icon: '🔺' },
          { label: '24h Low', value: formatCryptoPrice(c.low24h), icon: '🔻' },
          { label: 'Circulating Supply', value: c.circulatingSupply ? `${(c.circulatingSupply/1e6).toFixed(2)}M ${c.baseAsset}` : '--', icon: '🔄' },
          { label: 'Max Supply', value: c.maxSupply ? `${(c.maxSupply/1e6).toFixed(0)}M` : '∞ (No cap)', icon: '🏷️' },
          { label: 'All-Time High', value: c.ath ? formatCryptoPrice(c.ath) : '--', icon: '🏆' },
          { label: 'ATH Date', value: c.athDate ? new Date(c.athDate).toLocaleDateString('en-IN') : '--', icon: '📅' },
          { label: 'From ATH', value: c.athChangePercent ? `${c.athChangePercent.toFixed(1)}%` : '--', icon: '📉' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Price Changes */}
      <div style={{ background: 'var(--ink-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Price Changes</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { label: '1 Hour', value: c.change1h },
            { label: '24 Hours', value: c.change24h },
            { label: '7 Days', value: c.change7d },
          ].map((p, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>{p.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: p.value >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {p.value != null ? `${p.value >= 0 ? '+' : ''}${p.value.toFixed(2)}%` : '--'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChangeCell({ v }) {
  if (v == null) return <td style={{ padding: '14px 12px', textAlign: 'right', color: 'var(--text-tertiary)' }}>--</td>;
  return (
    <td style={{ padding: '14px 12px', textAlign: 'right', color: v >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 500, fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
      {v >= 0 ? '▲' : '▼'} {Math.abs(v).toFixed(2)}%
    </td>
  );
}
