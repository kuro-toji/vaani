/**
 * Family Service — Manage household members and shared financial goals.
 * Persisted in localStorage.
 */

const FAMILY_KEY = 'vaani_family';
const GOALS_KEY = 'vaani_family_goals';

function loadData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save family data:', e);
  }
}

// ── Family Members ─────────────────────────────

export function getFamilyMembers() {
  return loadData(FAMILY_KEY) || [];
}

export function addFamilyMember(member) {
  const members = getFamilyMembers();
  const newMember = {
    id: Date.now().toString(),
    name: member.name,
    role: member.role || 'member', // self, spouse, child, parent, sibling
    age: member.age || null,
    gender: member.gender || null,
    income: member.income || 0,
    emoji: getRoleEmoji(member.role),
    createdAt: new Date().toISOString(),
  };
  members.push(newMember);
  saveData(FAMILY_KEY, members);
  return newMember;
}

export function removeFamilyMember(id) {
  const members = getFamilyMembers().filter(m => m.id !== id);
  saveData(FAMILY_KEY, members);
  return members;
}

export function getTotalFamilyIncome() {
  return getFamilyMembers().reduce((sum, m) => sum + (m.income || 0), 0);
}

function getRoleEmoji(role) {
  const map = {
    self: '🧑', spouse: '👫', child: '👶', son: '👦', daughter: '👧',
    parent: '👴', mother: '👵', father: '👴', sibling: '🧑‍🤝‍🧑',
    grandparent: '🧓', member: '👤'
  };
  return map[role] || '👤';
}

// ── Shared Financial Goals ─────────────────────

export function getGoals() {
  return loadData(GOALS_KEY) || [];
}

export function addGoal(goal) {
  const goals = getGoals();
  const newGoal = {
    id: Date.now().toString(),
    name: goal.name,
    nameHindi: goal.nameHindi || goal.name,
    targetAmount: goal.targetAmount || 0,
    savedAmount: goal.savedAmount || 0,
    deadline: goal.deadline || null,
    category: goal.category || 'general',
    emoji: goal.emoji || '🎯',
    contributors: goal.contributors || [],
    createdAt: new Date().toISOString(),
  };
  goals.push(newGoal);
  saveData(GOALS_KEY, goals);
  return newGoal;
}

export function updateGoalProgress(goalId, amount) {
  const goals = getGoals();
  const goal = goals.find(g => g.id === goalId);
  if (goal) {
    goal.savedAmount = Math.min(goal.targetAmount, (goal.savedAmount || 0) + amount);
    saveData(GOALS_KEY, goals);
  }
  return goals;
}

export function removeGoal(id) {
  const goals = getGoals().filter(g => g.id !== id);
  saveData(GOALS_KEY, goals);
  return goals;
}

export function getGoalProgress(goal) {
  if (!goal.targetAmount) return 0;
  return Math.round((goal.savedAmount / goal.targetAmount) * 100);
}

export default {
  getFamilyMembers, addFamilyMember, removeFamilyMember, getTotalFamilyIncome,
  getGoals, addGoal, updateGoalProgress, removeGoal, getGoalProgress,
};
