import { useState } from 'react';
import { matchSchemes } from '../data/governmentSchemes.js';

/**
 * SchemeMatcher — Auto-matches eligible government schemes
 * based on user demographics and displays as cards.
 */
export default function SchemeMatcher({ userProfile = {}, onClose }) {
  const [filters, setFilters] = useState({
    age: userProfile.age || '',
    gender: userProfile.gender || '',
    occupation: userProfile.occupation || '',
    state: userProfile.state || '',
    income: userProfile.income || '',
  });

  const matched = matchSchemes({
    ...filters,
    age: filters.age ? parseInt(filters.age) : undefined,
    income: filters.income ? parseInt(filters.income) : undefined,
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '16px', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '24px',
        maxWidth: '520px', width: '100%', maxHeight: '85vh', overflow: 'auto',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
            🏛️ सरकारी योजनाएं
          </h2>
          <button onClick={onClose} style={{
            background: '#F3F4F6', border: 'none', width: '36px', height: '36px',
            borderRadius: '50%', cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} aria-label="Close">✕</button>
        </div>

        {/* Quick Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <select value={filters.gender} onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}
            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px' }}>
            <option value="">लिंग</option>
            <option value="male">पुरुष</option>
            <option value="female">महिला</option>
          </select>
          <input type="number" placeholder="आयु" value={filters.age}
            onChange={e => setFilters(f => ({ ...f, age: e.target.value }))}
            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px' }} />
          <input type="number" placeholder="वार्षिक आय (₹)" value={filters.income}
            onChange={e => setFilters(f => ({ ...f, income: e.target.value }))}
            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px' }} />
          <select value={filters.occupation} onChange={e => setFilters(f => ({ ...f, occupation: e.target.value }))}
            style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px' }}>
            <option value="">व्यवसाय</option>
            <option value="farmer">किसान</option>
            <option value="vendor">विक्रेता</option>
            <option value="artisan">कारीगर</option>
            <option value="salaried">नौकरी</option>
          </select>
        </div>

        {/* Results */}
        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
          {matched.length} योजनाएं मिलीं
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {matched.map(scheme => (
            <div key={scheme.id} style={{
              background: '#F9FAFB', borderRadius: '16px', padding: '16px',
              border: '1px solid #E5E7EB', transition: 'transform 0.15s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '28px' }}>{scheme.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{scheme.nameHindi}</div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>{scheme.name}</div>
                </div>
              </div>
              <div style={{
                background: '#ECFDF5', borderRadius: '8px', padding: '8px 12px',
                fontSize: '14px', color: '#065F46', fontWeight: 600, marginBottom: '8px',
              }}>
                💰 {scheme.benefit}
              </div>
              <div style={{ fontSize: '13px', color: '#4B5563' }}>
                📋 {scheme.howToApply}
              </div>
            </div>
          ))}
        </div>

        {matched.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <p>कोई योजना नहीं मिली। फ़िल्टर बदलें।</p>
          </div>
        )}
      </div>
    </div>
  );
}
