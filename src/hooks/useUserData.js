import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserProfile,
  getUserFDs,
  getUserSIPs,
  getUserGoals,
  getUserCryptoWallets,
  getMonthlyTransactions,
  getMonthlyBudget,
} from '../services/userDataService';

export function useUserData(month) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fds, setFds] = useState([]);
  const [sips, setSips] = useState([]);
  const [goals, setGoals] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function refetch() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [profileData, fdsData, sipsData, goalsData, walletsData, txData, budgetData] = await Promise.all([
        getUserProfile(user.id),
        getUserFDs(user.id),
        getUserSIPs(user.id),
        getUserGoals(user.id),
        getUserCryptoWallets(user.id),
        getMonthlyTransactions(user.id, month),
        getMonthlyBudget(user.id, month),
      ]);
      setProfile(profileData);
      setFds(fdsData);
      setSips(sipsData);
      setGoals(goalsData);
      setWallets(walletsData);
      setTransactions(txData);
      setBudgets(budgetData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refetch();
  }, [user?.id, month]);

  return { profile, fds, sips, goals, wallets, transactions, budgets, loading, error, refetch };
}