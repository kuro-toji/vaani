import { useState } from 'react';
import { getFamilyMembers, addFamilyMember, removeFamilyMember, getGoals, addGoal, updateGoalProgress, removeGoal, getGoalProgress } from '../services/familyService.js';

/**
 * FamilyManager — Manage household members and shared financial goals.
 */
export default function FamilyManager({ onClose }) {
  const [members, setMembers] = useState(getFamilyMembers());
  const [goals, setGoals] = useState(getGoals());
  const [tab, setTab] = useState('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: 'member', age: '', income: '' });
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', emoji: '🎯' });

  const handleAddMember = () => {
    if (!newMember.name.trim()) return;
    addFamilyMember({ ...newMember, age: parseInt(newMember.age) || null, income: parseInt(newMember.income) || 0 });
    setMembers(getFamilyMembers());
    setNewMember({ name: '', role: 'member', age: '', income: '' });
    setShowAddMember(false);
  };

  const handleRemoveMember = (id) => {
    removeFamilyMember(id);
    setMembers(getFamilyMembers());
  };

  const handleAddGoal = () => {
    if (!newGoal.name.trim() || !newGoal.targetAmount) return;
    addGoal({ ...newGoal, targetAmount: parseInt(newGoal.targetAmount) });
    setGoals(getGoals());
    setNewGoal({ name: '', targetAmount: '', emoji: '🎯' });
    setShowAddGoal(false);
  };

  const handleUpdateGoal = (goalId, amount) => {
    updateGoalProgress(goalId, parseInt(amount));
    setGoals(getGoals());
  };

  const totalIncome = members.reduce((s, m) => s + (m.income || 0), 0);

  const tabStyle = (active) => ({
    padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer',
    fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
    background: active ? '#0F6E56' : '#F3F4F6',
    color: active ? 'white' : '#6B7280',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '24px', maxWidth: '520px',
        width: '100%', maxHeight: '85vh', overflow: 'auto',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>👨‍👩‍👧‍👦 परिवार वित्त</h2>
          <button onClick={onClose} style={{
            background: '#F3F4F6', border: 'none', width: '36px', height: '36px',
            borderRadius: '50%', cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button style={tabStyle(tab === 'members')} onClick={() => setTab('members')}>सदस्य ({members.length})</button>
          <button style={tabStyle(tab === 'goals')} onClick={() => setTab('goals')}>लक्ष्य ({goals.length})</button>
        </div>

        {/* Members Tab */}
        {tab === 'members' && (
          <div>
            {totalIncome > 0 && (
              <div style={{ background: '#ECFDF5', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px', color: '#065F46' }}>
                कुल पारिवारिक आय: <strong>₹{totalIncome.toLocaleString('en-IN')}/month</strong>
              </div>
            )}

            {members.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                background: '#F9FAFB', borderRadius: '12px', marginBottom: '8px',
              }}>
                <span style={{ fontSize: '28px' }}>{m.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{m.name}</div>
                  <div style={{ fontSize: '13px', color: '#6B7280' }}>
                    {m.role}{m.age ? ` • ${m.age} yrs` : ''}{m.income ? ` • ₹${m.income.toLocaleString('en-IN')}` : ''}
                  </div>
                </div>
                <button onClick={() => handleRemoveMember(m.id)} style={{
                  background: '#FEE2E2', border: 'none', borderRadius: '8px', padding: '6px 10px',
                  fontSize: '12px', color: '#DC2626', cursor: 'pointer',
                }}>✕</button>
              </div>
            ))}

            {showAddMember ? (
              <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
                <input placeholder="नाम" value={newMember.name} onChange={e => setNewMember(n => ({ ...n, name: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '8px', fontSize: '14px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <select value={newMember.role} onChange={e => setNewMember(n => ({ ...n, role: e.target.value }))}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}>
                    <option value="self">स्वयं</option><option value="spouse">पति/पत्नी</option>
                    <option value="child">बच्चा</option><option value="parent">माता/पिता</option>
                    <option value="sibling">भाई/बहन</option><option value="member">अन्य</option>
                  </select>
                  <input type="number" placeholder="आयु" value={newMember.age} onChange={e => setNewMember(n => ({ ...n, age: e.target.value }))}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }} />
                  <input type="number" placeholder="आय (₹)" value={newMember.income} onChange={e => setNewMember(n => ({ ...n, income: e.target.value }))}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={handleAddMember} style={{
                    flex: 1, background: '#0F6E56', color: 'white', border: 'none',
                    padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  }}>जोड़ें ✓</button>
                  <button onClick={() => setShowAddMember(false)} style={{
                    background: '#F3F4F6', border: 'none', padding: '10px 16px',
                    borderRadius: '10px', fontSize: '14px', cursor: 'pointer',
                  }}>रद्द</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddMember(true)} style={{
                width: '100%', padding: '12px', border: '2px dashed #D1D5DB', borderRadius: '12px',
                background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#6B7280',
                marginTop: '12px',
              }}>+ सदस्य जोड़ें</button>
            )}
          </div>
        )}

        {/* Goals Tab */}
        {tab === 'goals' && (
          <div>
            {goals.map(goal => {
              const progress = getGoalProgress(goal);
              return (
                <div key={goal.id} style={{
                  background: '#F9FAFB', borderRadius: '16px', padding: '16px', marginBottom: '12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700 }}>{goal.emoji} {goal.name}</span>
                    <button onClick={() => { removeGoal(goal.id); setGoals(getGoals()); }} style={{
                      background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#9CA3AF',
                    }}>✕</button>
                  </div>
                  <div style={{
                    background: '#E5E7EB', borderRadius: '8px', height: '8px', marginBottom: '8px', overflow: 'hidden',
                  }}>
                    <div style={{
                      background: progress >= 100 ? '#10B981' : '#0F6E56',
                      height: '100%', borderRadius: '8px',
                      width: `${Math.min(100, progress)}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280' }}>
                    <span>₹{(goal.savedAmount || 0).toLocaleString('en-IN')}</span>
                    <span>{progress}%</span>
                    <span>₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <button onClick={() => handleUpdateGoal(goal.id, 1000)} style={{
                    marginTop: '8px', background: '#ECFDF5', border: '1px solid #10B981', borderRadius: '8px',
                    padding: '6px 12px', fontSize: '12px', color: '#065F46', cursor: 'pointer', fontWeight: 600,
                  }}>+ ₹1,000 बचत जोड़ें</button>
                </div>
              );
            })}

            {showAddGoal ? (
              <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
                <input placeholder="लक्ष्य का नाम (e.g. शादी)" value={newGoal.name} onChange={e => setNewGoal(g => ({ ...g, name: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '8px', fontSize: '14px' }} />
                <input type="number" placeholder="लक्ष्य राशि (₹)" value={newGoal.targetAmount} onChange={e => setNewGoal(g => ({ ...g, targetAmount: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '12px', fontSize: '14px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleAddGoal} style={{
                    flex: 1, background: '#0F6E56', color: 'white', border: 'none',
                    padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  }}>लक्ष्य जोड़ें ✓</button>
                  <button onClick={() => setShowAddGoal(false)} style={{
                    background: '#F3F4F6', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer',
                  }}>रद्द</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddGoal(true)} style={{
                width: '100%', padding: '12px', border: '2px dashed #D1D5DB', borderRadius: '12px',
                background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#6B7280', marginTop: '12px',
              }}>+ लक्ष्य जोड़ें</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
