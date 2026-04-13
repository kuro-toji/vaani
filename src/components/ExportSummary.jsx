import { useState } from 'react';

/**
 * ExportSummary — Print-friendly conversation export.
 * Receives messages as a prop from ChatWindow (NOT from useChat).
 */
export default function ExportSummary({ messages = [], onClose }) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      backdropFilter: 'blur(8px)',
    }}>
      <div id="export-container" style={{
        background: 'white', borderRadius: '24px', padding: '32px', maxWidth: '600px',
        width: '100%', maxHeight: '85vh', overflow: 'auto',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
      }}>
        {/* Header (hidden during print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>📄 वार्तालाप निर्यात</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handlePrint} style={{
              background: '#0F6E56', color: 'white', border: 'none', padding: '10px 20px',
              borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}>🖨️ Print / PDF</button>
            <button onClick={onClose} style={{
              background: '#F3F4F6', border: 'none', width: '36px', height: '36px',
              borderRadius: '50%', cursor: 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        </div>

        {/* Print Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #E5E7EB', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F6E56', margin: '0 0 4px' }}>
            🔊 VAANI Financial Summary
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Generated on {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
        </div>

        {/* Messages */}
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px' }}>कोई संदेश नहीं</p>
        ) : (
          messages.map((msg, i) => (
            <div key={msg.id || i} style={{
              marginBottom: '16px', padding: '12px 16px', borderRadius: '12px',
              background: msg.role === 'user' ? '#F0FDF4' : '#F9FAFB',
              border: `1px solid ${msg.role === 'user' ? '#BBF7D0' : '#E5E7EB'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: msg.role === 'user' ? '#166534' : '#0F6E56' }}>
                  {msg.role === 'user' ? '👤 आप' : '🔊 VAANI'}
                </span>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{formatTime(msg.timestamp)}</span>
              </div>
              <p style={{ fontSize: '14px', color: '#374151', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {msg.content}
              </p>
            </div>
          ))
        )}

        {/* Print Styles */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #export-container, #export-container * { visibility: visible; }
            #export-container { position: absolute; left: 0; top: 0; width: 100%; border-radius: 0; box-shadow: none; max-height: none; }
            .no-print { display: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
