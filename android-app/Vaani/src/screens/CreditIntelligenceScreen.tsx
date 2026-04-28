// ═══════════════════════════════════════════════════════════════════
// VAANI Credit Intelligence Screen — Loan Against Holdings
// Portfolio-backed credit, LAMF, borrowing capacity
// Voice: "Mujhe ₹50,000 chahiye emergency ke liye"
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { COLORS } from '../constants';
import type { PortfolioBackedLoan, BorrowingCapacity, CreditComparison } from '../types';
import * as creditIntelService from '../services/creditIntelligenceService';

const { width } = Dimensions.get('window');

interface CreditIntelligenceScreenProps {
  navigation?: any;
}

export default function CreditIntelligenceScreen({ navigation }: CreditIntelligenceScreenProps) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'capacity' | 'compare'>('portfolio');
  const [portfolioLoans, setPortfolioLoans] = useState<PortfolioBackedLoan[]>([]);
  const [borrowingCap, setBorrowingCap] = useState<BorrowingCapacity | null>(null);
  const [comparison, setComparison] = useState<CreditComparison[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = 'default_user';

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [portfolio, capacity, compare] = await Promise.all([
        creditIntelService.getPortfolioLoans(userId),
        creditIntelService.getBorrowingCapacity(userId),
        creditIntelService.getComparison('50000'),
      ]);
      setPortfolioLoans(portfolio);
      setBorrowingCap(capacity);
      setComparison(compare);
    } catch (err) {
      console.error('[CreditIntel] Load error:', err);
      setError('Data load karne mein dikkat');
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const speakPortfolio = () => {
    if (portfolioLoans.length === 0) {
      Speech.speak('Aapke portfolio pe koi loan nahi hai', { language: 'hi-IN' });
      return;
    }
    const text = portfolioLoans[0] 
      ? `Aapke ${portfolioLoans[0].asset_type} pe ₹${portfolioLoans[0].max_loan.toLocaleString('en-IN')} tak loan le sakte ho at ${portfolioLoans[0].interest_rate}%`
      : 'Portfolio loans ki details nahi mili';
    Speech.speak(text, { language: 'hi-IN', rate: 0.9 });
  };

  const speakCapacity = () => {
    if (!borrowingCap) return;
    const text = `Aapki monthly income aur EMIs ke hisaab se aap ₹${borrowingCap.max_personal_loan.toLocaleString('en-IN')} tak personal loan le sakte ho. Home loan ₹${borrowingCap.max_home_loan.toLocaleString('en-IN')} tak possible hai.`;
    Speech.speak(text, { language: 'hi-IN', rate: 0.9 });
  };

  const formatCurrency = (amount: number): string => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const getAssetIcon = (type: string): string => {
    const icons: Record<string, string> = {
      mf: '📈',
      fd: '🗄️',
      gold: '🥇',
      stocks: '📊',
      crypto: '₿',
      insurance: '🛡️',
    };
    return icons[type] || '💰';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backButton}>← वापस</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💳 Credit Intelligence</Text>
        <TouchableOpacity onPress={speakCapacity}>
          <Text style={styles.speakButton}>🔊</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Tab Switcher */}
      <View style={styles.tabSwitcher}>
        {(['portfolio', 'capacity', 'compare'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'portfolio' ? '📈 Portfolio' : tab === 'capacity' ? '📊 Capacity' : '⚖️ Compare'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Portfolio Loans */}
      {activeTab === 'portfolio' && (
        <>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Loan Against Holdings</Text>
            <Text style={styles.infoText}>
              Aapke investments (MF, FD, Gold) ko collateral use karke loan le sakte ho — credit card ke 36% se bahut kam rate pe.
            </Text>
          </View>

          {portfolioLoans.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📈</Text>
              <Text style={styles.emptyText}>No portfolio loans</Text>
              <Text style={styles.emptySubtext}>Voice: "LAMF ke baare mein batao"</Text>
            </View>
          ) : (
            portfolioLoans.map((loan, index) => (
              <View key={index} style={styles.loanCard}>
                <View style={styles.loanHeader}>
                  <View style={styles.loanIconBox}>
                    <Text style={styles.loanIcon}>{getAssetIcon(loan.asset_type)}</Text>
                  </View>
                  <View style={styles.loanInfo}>
                    <Text style={styles.loanType}>
                      Loan Against {loan.asset_type.toUpperCase()}
                    </Text>
                    <Text style={styles.loanValue}>
                      Portfolio: {formatCurrency(loan.portfolio_value)}
                    </Text>
                  </View>
                </View>

                <View style={styles.loanStats}>
                  <View style={styles.loanStat}>
                    <Text style={styles.loanStatLabel}>Max Loan</Text>
                    <Text style={styles.loanStatValue}>{formatCurrency(loan.max_loan)}</Text>
                  </View>
                  <View style={styles.loanStat}>
                    <Text style={styles.loanStatLabel}>Rate</Text>
                    <Text style={styles.loanStatValueSuccess}>{loan.interest_rate}%</Text>
                  </View>
                  <View style={styles.loanStat}>
                    <Text style={styles.loanStatLabel}>Tenure</Text>
                    <Text style={styles.loanStatValue}>{loan.max_tenure} months</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => Alert.alert('Redirect', 'Bank ya NBFC website par jaayenge')}
                >
                  <Text style={styles.applyButtonText}>Apply Now</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Savings Card */}
          <View style={styles.savingsCard}>
            <Text style={styles.savingsTitle}>💰 Credit Card se Better</Text>
            <Text style={styles.savingsText}>
              ₹50,000 pe credit card (36%) = ₹18,000 interest 1 saal mein{'\n'}
              LAMF (10.5%) = ₹5,250 interest 1 saal mein{' '}
              <Text style={styles.savingsHighlight}>= ₹12,750 Bachenge!</Text>
            </Text>
          </View>
        </>
      )}

      {/* Borrowing Capacity */}
      {activeTab === 'capacity' && borrowingCap && (
        <>
          <View style={styles.capacityCard}>
            <Text style={styles.capacityTitle}>Your Borrowing Power</Text>
            
            <View style={styles.capacityGrid}>
              <View style={styles.capacityItem}>
                <Text style={styles.capacityIcon}>🏠</Text>
                <Text style={styles.capacityLabel}>Home Loan</Text>
                <Text style={styles.capacityValue}>
                  {formatCurrency(borrowingCap.max_home_loan)}
                </Text>
              </View>
              
              <View style={styles.capacityItem}>
                <Text style={styles.capacityIcon}>💰</Text>
                <Text style={styles.capacityLabel}>Personal Loan</Text>
                <Text style={styles.capacityValue}>
                  {formatCurrency(borrowingCap.max_personal_loan)}
                </Text>
              </View>
              
              <View style={styles.capacityItem}>
                <Text style={styles.capacityIcon}>🚗</Text>
                <Text style={styles.capacityLabel}>Car Loan</Text>
                <Text style={styles.capacityValue}>
                  {formatCurrency(borrowingCap.max_car_loan)}
                </Text>
              </View>
              
              <View style={styles.capacityItem}>
                <Text style={styles.capacityIcon}>💳</Text>
                <Text style={styles.capacityLabel}>Credit Card</Text>
                <Text style={styles.capacityValue}>
                  {formatCurrency(borrowingCap.credit_card_limit)}
                </Text>
              </View>
            </View>
          </View>

          {/* EMI Capacity */}
          <View style={styles.emiCard}>
            <Text style={styles.emiTitle}>Monthly EMI Capacity</Text>
            <Text style={styles.emiValue}>{formatCurrency(borrowingCap.available_emi_capacity)}</Text>
            <Text style={styles.emiSubtext}>
              Available from ₹{formatCurrency(borrowingCap.monthly_income)} income minus existing EMIs
            </Text>
          </View>

          {/* Formula Explanation */}
          <View style={styles.formulaCard}>
            <Text style={styles.formulaTitle}>📊 Calculation Basis</Text>
            <View style={styles.formulaRow}>
              <Text style={styles.formulaLabel}>Monthly Income</Text>
              <Text style={styles.formulaValue}>{formatCurrency(borrowingCap.monthly_income)}</Text>
            </View>
            <View style={styles.formulaRow}>
              <Text style={styles.formulaLabel}>Existing EMIs</Text>
              <Text style={styles.formulaValueDanger}>
                - {formatCurrency(borrowingCap.existing_emis)}
              </Text>
            </View>
            <View style={styles.formulaDivider} />
            <View style={styles.formulaRow}>
              <Text style={styles.formulaLabel}>Available (40%)</Text>
              <Text style={styles.formulaValueSuccess}>
                = {formatCurrency(borrowingCap.available_emi_capacity)}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Interest Comparison */}
      {activeTab === 'compare' && (
        <>
          <View style={styles.compareHeader}>
            <Text style={styles.compareTitle}>⚖️ ₹50,000 Loan Options</Text>
            <Text style={styles.compareSubtitle}>1 Year Interest Comparison</Text>
          </View>

          {comparison.map((item, index) => (
            <View key={index} style={[
              styles.compareCard,
              item.is_best && styles.compareCardBest
            ]}>
              <View style={styles.compareHeader}>
                <Text style={styles.compareName}>{item.option_name}</Text>
                {item.is_best && (
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestBadgeText}>BEST</Text>
                  </View>
                )}
              </View>

              <View style={styles.compareStats}>
                <View style={styles.compareStat}>
                  <Text style={styles.compareStatLabel}>Interest Rate</Text>
                  <Text style={[
                    styles.compareStatValue,
                    item.is_best && styles.compareStatValueBest
                  ]}>
                    {item.interest_rate}%
                  </Text>
                </View>
                <View style={styles.compareStat}>
                  <Text style={styles.compareStatLabel}>Total Interest</Text>
                  <Text style={styles.compareStatValue}>
                    {formatCurrency(item.total_interest)}
                  </Text>
                </View>
              </View>

              <View style={styles.compareSavings}>
                <Text style={styles.compareSavingsLabel}>vs Credit Card Savings</Text>
                <Text style={[
                  styles.compareSavingsValue,
                  item.savings_vs_credit_card > 0 && styles.savingsPositive
                ]}>
                  {item.savings_vs_credit_card > 0 ? '+' : ''}{formatCurrency(item.savings_vs_credit_card)}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Important</Text>
            <Text style={styles.warningText}>
              VAANI sirf suggestions deta hai. Actual loan approval bank/NBFC pe depends karta hai. 
              Credit score, income proof, aur documentation required hote hain.
            </Text>
          </View>
        </>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => speakPortfolio()}
        >
          <Text style={styles.quickActionIcon}>🔊</Text>
          <Text style={styles.quickActionLabel}>Listen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => Alert.alert('Learn More', 'LAMF ke baare mein aur jaankari ke liye')}
        >
          <Text style={styles.quickActionIcon}>📚</Text>
          <Text style={styles.quickActionLabel}>Learn</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg_base,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  speakButton: {
    fontSize: 24,
  },
  errorBanner: {
    backgroundColor: COLORS.danger + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg_surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text_tertiary,
  },
  activeTabText: {
    color: COLORS.text_primary,
  },
  infoCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text_secondary,
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text_secondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.text_tertiary,
  },
  loanCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loanIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  loanIcon: {
    fontSize: 24,
  },
  loanInfo: {
    flex: 1,
  },
  loanType: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  loanValue: {
    fontSize: 12,
    color: COLORS.text_tertiary,
    marginTop: 2,
  },
  loanStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  loanStat: {
    alignItems: 'center',
  },
  loanStatLabel: {
    fontSize: 11,
    color: COLORS.text_tertiary,
    marginBottom: 4,
  },
  loanStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  loanStatValueSuccess: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  savingsCard: {
    backgroundColor: COLORS.success + '20',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  savingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 13,
    color: COLORS.text_primary,
    lineHeight: 20,
  },
  savingsHighlight: {
    fontWeight: '700',
    color: COLORS.success,
  },
  capacityCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  capacityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  capacityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  capacityItem: {
    width: '48%',
    backgroundColor: COLORS.bg_elevated,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  capacityIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  capacityLabel: {
    fontSize: 11,
    color: COLORS.text_tertiary,
    marginBottom: 4,
  },
  capacityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  emiCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  emiTitle: {
    fontSize: 12,
    color: COLORS.text_primary + '80',
    marginBottom: 4,
  },
  emiValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text_primary,
    marginBottom: 4,
  },
  emiSubtext: {
    fontSize: 11,
    color: COLORS.text_primary + '80',
    textAlign: 'center',
  },
  formulaCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  formulaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginBottom: 12,
  },
  formulaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  formulaLabel: {
    fontSize: 13,
    color: COLORS.text_secondary,
  },
  formulaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  formulaValueDanger: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.danger,
  },
  formulaValueSuccess: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
  },
  formulaDivider: {
    height: 1,
    backgroundColor: COLORS.border_subtle,
    marginVertical: 8,
  },
  compareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  compareSubtitle: {
    fontSize: 12,
    color: COLORS.text_tertiary,
    marginBottom: 12,
  },
  compareCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  compareCardBest: {
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  compareName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  bestBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  compareStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  compareStat: {
    alignItems: 'center',
  },
  compareStatLabel: {
    fontSize: 11,
    color: COLORS.text_tertiary,
    marginBottom: 4,
  },
  compareStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  compareStatValueBest: {
    color: COLORS.success,
  },
  compareSavings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bg_elevated,
    padding: 12,
    borderRadius: 8,
  },
  compareSavingsLabel: {
    fontSize: 12,
    color: COLORS.text_secondary,
  },
  compareSavingsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  savingsPositive: {
    color: COLORS.success,
  },
  warningCard: {
    backgroundColor: COLORS.orange + '20',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.orange,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.text_primary,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.bg_surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    color: COLORS.text_secondary,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default CreditIntelligenceScreen;