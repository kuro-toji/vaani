// ═══════════════════════════════════════════════════════════════════
// VAANI Web Dashboard — Spend Awareness Component
// Purchase intent check, opportunity cost, monthly summary
// Voice: "₹3,000 jacket? Soch lo — 10 saal mein ₹18,000"
// ═══════════════════════════════════════════════════════════════════

import { useState } from 'react';

/**
 * Spend Awareness — Purchase Intent & Spending Analytics
 */
export default function SpendAwareness({ user }) {
  const [activeTab, setActiveTab] = useState('summary');

  // Mock data
  const mockMonthlySpending = {
    total: 28000,
    budget: 25000,
    exceeded: 3000,
    categories: [
      { category: 'food', amount: 8000, budget: 6000, icon: '🍔', color: '#FF6B6B' },
      { category: 'transport', amount: 4000, budget: 5000, icon: '🚗', color: '#4ECDC4' },
      { category: 'shopping', amount: 6000, budget: 4000, icon: '🛍️', color: '#9B59B6' },
      { category: 'entertainment', amount: 3500, budget: 3000, icon: '🎬', color: '#3498DB' },
      { category: 'utilities', amount: 2500, budget: 2000, icon: '💡', color: '#F39C12' },
      { category: 'other', amount: 4000, budget: 5000, icon: '📦', color: '#95A5A6' },
    ],
  };

  const mockWishlist = [
    { item: 'Jacket', amount: 3000, days_in_list: 7, potential_return: 18000, note: '₹3,000 invested at 20% CAGR for 10 years' },
    { item: 'New Phone', amount: 25000, days_in_list: 14, potential_return: 155000, note: '₹25,000 at 20% for 10 years' },
  ];

  const formatCurrency = (amount) => '₹' + amount.toLocaleString('en-IN');

  const speakSummary = () => {
    const msg = new SpeechSynthesisUtterance(
      `Pichle mahine aapne ₹${mockMonthlySpending.total.toLocaleString('en-IN')} kharch kiye. Budget se ₹${mockMonthlySpending.exceeded.toLocaleString('en-IN')} zyada.`
    );
    msg.lang = 'hi-IN';
    speechSynthesis.speak(msg);
  };

  const speakOpportunityCost = (item) => {
    const msg = new SpeechSynthesisUtterance(
      `${item.item} ke ₹${item.amount.toLocaleString('en-IN')} agar 10 saal ke liye invest karo toh ₹${item.potential_return.toLocaleString('en-IN')} ho jaata at 20% yearly return. Phir bhi kharidna hai?`
    );
    msg.lang = 'hi-IN';
    speechSynthesis.speak(msg);
  };

  return (
    <div className="flex flex-col gap-6 p-6" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>🛒 Spend Awareness</h2>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Purchase Intent & Spending Analytics</p>
        </div>
        <button onClick={speakSummary} className="btn btn-ghost" style={{ padding: '8px 16px' }}>🔊 Speak</button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {['summary', 'wishlist'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, padding: '10px', fontSize: '13px' }}
          >
            {tab === 'summary' ? '📊 Summary' : '💭 Wishlist'}
          </button>
        ))}
      </div>

      {/* Monthly Summary */}
      {activeTab === 'summary' && (
        <>
          {/* Overview Card */}
          <div className="card p-6" style={{ background: mockMonthlySpending.exceeded > 0 ? 'var(--danger-bg)' : 'var(--success-bg)', borderRadius: '16px' }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>This Month</p>
                <p style={{ fontSize: '32px', fontWeight: '700' }}>{formatCurrency(mockMonthlySpending.total)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Budget</p>
                <p style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-secondary)' }}>{formatCurrency(mockMonthlySpending.budget)}</p>
              </div>
            </div>
            {mockMonthlySpending.exceeded > 0 ? (
              <div className="flex items-center gap-2" style={{ color: 'var(--danger)' }}>
                <span>⚠️</span>
                <span className="text-sm font-semibold">Budget se ₹{mockMonthlySpending.exceeded.toLocaleString('en-IN')} zyada kharch kiya!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2" style={{ color: 'var(--success)' }}>
                <span>✅</span>
                <span className="text-sm font-semibold">Budget mein ₹{(mockMonthlySpending.budget - mockMonthlySpending.total).toLocaleString('en-IN')} bacha!</span>
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="space-y-3">
            {mockMonthlySpending.categories.map((cat, idx) => {
              const isOver = cat.amount > cat.budget;
              return (
                <div key={idx} className="card p-4" style={{ background: 'var(--bg-surface)', borderRadius: '12px' }}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                      <span className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{cat.category}</span>
                    </div>
                    <span className={`font-semibold ${isOver ? 'text-danger' : 'text-success'}`}>
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>Budget: {formatCurrency(cat.budget)}</span>
                    {isOver && <span style={{ color: 'var(--danger)' }}>Over by {formatCurrency(cat.amount - cat.budget)}</span>}
                  </div>
                  <div className="w-full h-2 rounded-full mt-2" style={{ background: 'var(--bg-elevated)' }}>
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (cat.amount / cat.budget) * 100)}%`,
                        background: isOver ? cat.color : 'var(--success)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Wishlist */}
      {activeTab === 'wishlist' && (
        <>
          {mockWishlist.length === 0 ? (
            <div className="card text-center" style={{ padding: '40px', background: 'var(--bg-surface)', borderRadius: '16px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No pending items</p>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Next time you want to buy something expensive, just ask!</p>
            </div>
          ) : (
            mockWishlist.map((item, idx) => (
              <div key={idx} className="card p-4" style={{ background: 'var(--bg-surface)', borderRadius: '16px' }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '24px' }}>🎯</span>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.item}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.days_in_list} days in wishlist</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency(item.amount)}</span>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', marginBottom: '12px' }}>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.note}</p>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Opportunity Cost</p>
                    <p className="font-bold" style={{ color: 'var(--success)' }}>{formatCurrency(item.potential_return)} in 10 years</p>
                  </div>
                  <button 
                    onClick={() => speakOpportunityCost(item)}
                    className="btn btn-ghost"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    🔊 Listen
                  </button>
                </div>
              </div>
            ))
          )}

          {/* What is Opportunity Cost? */}
          <div className="card p-4" style={{ background: 'var(--bg-surface)', borderRadius: '16px' }}>
            <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>💡 What is Opportunity Cost?</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              ₹3,000 invested at 20% yearly return becomes ₹18,592 in 10 years. 
              That ₹3,000 jacket actually costs ₹18,592 in future wealth. 
              Is it worth it?
            </p>
          </div>
        </>
      )}
    </div>
  );
}