import { useState } from 'react';
import { getAllLeads, getLeadAnalytics } from '../services/leadService.js';

/**
 * PartnerDashboard — B2B analytics dashboard for bank partners.
 * Pure SVG charts, no dependencies.
 */
export default function PartnerDashboard({ onBack }) {
  const analytics = getLeadAnalytics();
  const leads = getAllLeads();
  const [activeTab, setActiveTab] = useState('overview');

  // SVG Bar Chart
  const BarChart = ({ data, width = 400, height = 200 }) => {
    const entries = Object.entries(data);
    if (entries.length === 0) return <p style={{ color: '#9CA3AF', textAlign: 'center' }}>No data yet</p>;
    const maxVal = Math.max(...entries.map(([, v]) => v), 1);
    const barWidth = Math.min(60, (width - 40) / entries.length - 8);

    return (
      <svg viewBox={`0 0 ${width} ${height + 40}`} style={{ width: '100%', maxWidth: width }}>
        {entries.map(([label, value], i) => {
          const barH = (value / maxVal) * height;
          const x = 20 + i * (barWidth + 8);
          return (
            <g key={label}>
              <rect x={x} y={height - barH} width={barWidth} height={barH} rx={4}
                fill="#0F6E56" opacity={0.8 + (i % 2) * 0.2} />
              <text x={x + barWidth / 2} y={height - barH - 6} textAnchor="middle"
                fontSize="11" fill="#374151" fontWeight="600">{value}</text>
              <text x={x + barWidth / 2} y={height + 16} textAnchor="middle"
                fontSize="10" fill="#6B7280" style={{ maxWidth: barWidth }}>
                {label.length > 8 ? label.slice(0, 8) + '…' : label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const StatCard = ({ label, value, emoji }) => (
    <div style={{
      background: '#F9FAFB', borderRadius: '16px', padding: '20px', textAlign: 'center',
      border: '1px solid #E5E7EB',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '4px' }}>{emoji}</div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F6E56' }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>{label}</div>
    </div>
  );

  const tabStyle = (active) => ({
    padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer',
    fontSize: '14px', fontWeight: 600,
    background: active ? '#0F6E56' : '#F3F4F6',
    color: active ? 'white' : '#6B7280',
  });

  return (
    <div style={{
      minHeight: '100dvh', background: '#FAFAF8', padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
              📊 Partner Dashboard
            </h1>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              VAANI B2B Analytics — Real-time user insights
            </p>
          </div>
          <button onClick={onBack} style={{
            background: '#F3F4F6', border: 'none', padding: '10px 20px',
            borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontWeight: 600,
          }}>← Back to App</button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <StatCard label="Total Leads" value={analytics.total} emoji="📋" />
          <StatCard label="Products" value={Object.keys(analytics.byProduct).length} emoji="🏦" />
          <StatCard label="Regions" value={Object.keys(analytics.byRegion).length} emoji="📍" />
          <StatCard label="Conversion" value={`${Math.round(analytics.conversionRate * 100)}%`} emoji="📈" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button style={tabStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>Overview</button>
          <button style={tabStyle(activeTab === 'leads')} onClick={() => setActiveTab('leads')}>Leads ({leads.length})</button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>💰 Leads by Product</h3>
              <BarChart data={analytics.byProduct} />
            </div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>📍 Leads by Region</h3>
              <BarChart data={analytics.byRegion} />
            </div>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div style={{
            background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden',
          }}>
            {leads.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <p>No leads captured yet. Start conversations to generate leads.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Product</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Region</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Language</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Time</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice().reverse().map(lead => (
                    <tr key={lead.id} style={{ borderTop: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{lead.product}</td>
                      <td style={{ padding: '12px 16px', color: '#6B7280' }}>{lead.region}</td>
                      <td style={{ padding: '12px 16px', color: '#6B7280' }}>{lead.language}</td>
                      <td style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: '12px' }}>
                        {new Date(lead.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                          background: lead.status === 'new' ? '#DBEAFE' : lead.status === 'converted' ? '#D1FAE5' : '#FEF3C7',
                          color: lead.status === 'new' ? '#1D4ED8' : lead.status === 'converted' ? '#065F46' : '#92400E',
                        }}>{lead.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
