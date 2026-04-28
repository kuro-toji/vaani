// ═══════════════════════════════════════════════════════════════════
// VAANI Web Dashboard — Freelancer OS Component
// Income tracking & Invoice Management for Web
// Voice: "Rahul ne ₹25,000 bheja project ke liye"
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

/**
 * Freelancer OS — Income Tracking & Invoice Management
 */
export default function FreelancerOS({ user }) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('income');
  
  // Mock data
  const mockClients = [
    { client_name: 'Infosys', total_paid: 250000, payment_count: 5, tds_total: 25000, days_since_last_payment: 15 },
    { client_name: 'TCS', total_paid: 180000, payment_count: 3, tds_total: 18000, days_since_last_payment: 45 },
    { client_name: 'Wipro', total_paid: 95000, payment_count: 2, tds_total: 0, days_since_last_payment: 8 },
  ];

  const mockInvoices = [
    { id: 1, client: 'Infosys', amount: 50000, date: '2025-04-15', status: 'paid' },
    { id: 2, client: 'TCS', amount: 75000, date: '2025-04-10', status: 'pending' },
  ];

  const formatCurrency = (amount) => '₹' + amount.toLocaleString('en-IN');
  
  const totalIncome = mockClients.reduce((sum, c) => sum + c.total_paid, 0);
  const totalTDS = mockClients.reduce((sum, c) => sum + c.tds_total, 0);

  // Get text based on selected language
  const t = (key) => {
    const texts = {
      hi: {
        total_income: `Total income ${formatCurrency(totalIncome)}, ${mockClients.length} clients se. TDS total ${formatCurrency(totalTDS)}.`,
        title: 'Freelancer OS',
      },
      en: {
        total_income: `Total income is ${formatCurrency(totalIncome)} from ${mockClients.length} clients. TDS deducted: ${formatCurrency(totalTDS)}.`,
        title: 'Freelancer OS',
      },
    };
    return texts[language]?.[key] || texts.hi[key];
  };

  const speakIncome = () => {
    const msg = new SpeechSynthesisUtterance(t('total_income'));
    msg.lang = language === 'en' ? 'en-IN' : 'hi-IN';
    speechSynthesis.speak(msg);
  };

  const handleExportITR = () => {
    const itrData = `ITR DATA EXPORT\nFY: 2024-25\nTotal Income: ${formatCurrency(totalIncome)}\nClients: ${mockClients.length}\nTDS Deducted: ${formatCurrency(totalTDS)}\n\nIncome by Client:\n${mockClients.map(c => `${c.client_name}: ${formatCurrency(c.total_paid)}`).join('\n')}`;
    
    const blob = new Blob([itrData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vaani_itr_export.txt';
    a.click();
  };

  return (
    <div className="flex flex-col gap-6 p-6" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>🧾 Freelancer OS</h2>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Income & Invoice Management</p>
        </div>
        <button
          onClick={speakIncome}
          className="btn btn-ghost flex items-center gap-2"
          style={{ padding: '8px 16px' }}
        >
          🔊 Speak
        </button>
      </div>

      {/* Summary Card */}
      <div 
        className="card text-center"
        style={{ background: 'var(--primary)', borderRadius: '16px', padding: '24px' }}
      >
        <p className="text-sm opacity-80 mb-2" style={{ color: 'var(--text-primary)' }}>Total Income (FY)</p>
        <div style={{ fontSize: '36px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
          {formatCurrency(totalIncome)}
        </div>
        <div className="flex justify-around" style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
          <div>
            <p style={{ fontSize: '18px', fontWeight: '700' }}>{mockClients.length}</p>
            <p className="text-xs opacity-80">Clients</p>
          </div>
          <div>
            <p style={{ fontSize: '18px', fontWeight: '700' }}>{mockInvoices.length}</p>
            <p className="text-xs opacity-80">Invoices</p>
          </div>
          <div>
            <p style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(totalTDS)}</p>
            <p className="text-xs opacity-80">TDS</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {['income', 'clients', 'invoices'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            style={{ 
              flex: 1, 
              padding: '10px',
              textTransform: 'capitalize',
              fontSize: '13px'
            }}
          >
            {tab === 'income' ? '📝 Income' : tab === 'clients' ? '👥 Clients' : '📄 Invoices'}
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <button className="btn btn-secondary flex-1" style={{ padding: '14px' }}>
          ➕ Income Log
        </button>
        <button className="btn btn-secondary flex-1" style={{ padding: '14px' }}>
          📄 Invoice
        </button>
        <button 
          onClick={handleExportITR}
          className="btn btn-primary flex-1" 
          style={{ padding: '14px' }}
        >
          📊 ITR Export
        </button>
      </div>

      {/* Clients List */}
      {activeTab === 'clients' && (
        <div className="space-y-3">
          {mockClients.map((client, index) => (
            <div 
              key={index}
              className="card flex justify-between items-center"
              style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '16px' }}
            >
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{client.client_name}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{client.payment_count} payments</p>
              </div>
              <div className="text-right">
                <p style={{ fontWeight: '600', color: 'var(--success)' }}>{formatCurrency(client.total_paid)}</p>
                {client.tds_total > 0 && (
                  <p className="text-xs" style={{ color: 'var(--warning)' }}>TDS: {formatCurrency(client.tds_total)}</p>
                )}
              </div>
              {client.days_since_last_payment > 30 && (
                <span 
                  className="ml-3 px-2 py-1 rounded text-xs"
                  style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}
                >
                  ⏰ {client.days_since_last_payment}d
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TDS Alert */}
      {mockClients.filter(c => c.total_paid >= 100000 && c.tds_total === 0).length > 0 && (
        <div 
          className="p-4 rounded-lg"
          style={{ background: 'var(--warning-bg)' }}
        >
          <p className="font-semibold mb-1" style={{ color: 'var(--warning)' }}>⚠️ TDS Alert</p>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {mockClients.filter(c => c.total_paid >= 100000 && c.tds_total === 0).length} clients ne ₹1 लाख से zyada diya — PAN do taaki TDS kaatein
          </p>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {mockInvoices.map((inv) => (
            <div 
              key={inv.id}
              className="card flex justify-between items-center"
              style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '16px' }}
            >
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{inv.client}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{inv.date}</p>
              </div>
              <div className="text-right">
                <p style={{ fontWeight: '600' }}>{formatCurrency(inv.amount)}</p>
                <span 
                  className={`text-xs px-2 py-1 rounded ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                >
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}