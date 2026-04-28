// ═══════════════════════════════════════════════════════════════════
// VAANI Command Center Screen — Financial Dashboard
// Net worth, debt tracker, FIRE calculator, spending analytics
// Voice: "Meri total daulat kitni hai?"
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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { COLORS } from '../constants';
import type { ExtendedNetWorth, DebtSummary, FIRETracker, Loan } from '../types';
import * as commandCenterService from '../services/commandCenterService';
import * as moneyService from '../services/moneyManagementService';

const { width } = Dimensions.get('window');

interface CommandCenterScreenProps {
  navigation?: any;
}

export default function CommandCenterScreen({ navigation }: CommandCenterScreenProps) {
  const [netWorth, setNetWorth] = useState<ExtendedNetWorth | null>(null);
  const [debt, setDebt] = useState<DebtSummary | null>(null);
  const [fire, setFire] = useState<FIRETracker | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = 'default_user';

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [nw, debtData, fireData] = await Promise.all([
        commandCenterService.getExtendedNetWorth(userId),
        commandCenterService.getDebtSummary(userId),
        commandCenterService.calculateFIRE(userId),
      ]);
      setNetWorth(nw);
      setDebt(debtData);
      setFire(fireData);
    } catch (err) {
      console.error('[CommandCenter] Load error:', err);
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

  const speakNetWorth = () => {
    if (netWorth) {
      const voice = commandCenterService.generateNetWorthVoice(netWorth, 'hi');
      Speech.speak(voice, { language: 'hi-IN', rate: 0.9 });
    }
  };

  const speakDebt = () => {
    if (debt) {
      const voice = commandCenterService.generateDebtVoice(debt, 'hi');
      Speech.speak(voice, { language: 'hi-IN', rate: 0.9 });
    }
  };

  const speakFIRE = () => {
    if (fire) {
      const voice = commandCenterService.generateFIREVoice(fire);
      Speech.speak(voice, { language: 'hi-IN', rate: 0.9 });
    }
  };

  const formatCurrency = (amount: number): string => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const formatCrore = (amount: number): string => {
    return (amount / 10000000).toFixed(2) + ' Cr';
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
        <Text style={styles.headerTitle}>🏦 Command Center</Text>
        <TouchableOpacity onPress={speakNetWorth}>
          <Text style={styles.speakButton}>🔊</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Net Worth Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>💰 आपकी कुल दौलत</Text>
          <TouchableOpacity onPress={speakNetWorth}>
            <Text style={styles.speakIcon}>🔊</Text>
          </TouchableOpacity>
        </View>
        
        {netWorth ? (
          <>
            <Text style={styles.netWorthValue}>
              {formatCrore(netWorth.net_worth)}
            </Text>
            
            <View style={styles.breakdownGrid}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>सम्पत्ति</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(netWorth.total_assets)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>कार्य</Text>
                <Text style={[styles.breakdownValue, styles.debtValue]}>
                  {formatCurrency(netWorth.total_liabilities)}
                </Text>
              </View>
            </View>

            {/* Asset Breakdown */}
            <View style={styles.miniBreakdown}>
              <Text style={styles.miniBreakdownTitle}>सम्पत्ति विवरण</Text>
              <View style={styles.miniBreakdownGrid}>
                <Text style={styles.miniItem}>🏦 बैंक: {formatCurrency(netWorth.breakdown.bank_balances)}</Text>
                <Text style={styles.miniItem}>🗄️ FD: {formatCurrency(netWorth.breakdown.fd)}</Text>
                <Text style={styles.miniItem}>📈 SIP: {formatCurrency(netWorth.breakdown.sip)}</Text>
                <Text style={styles.miniItem}>🥇 सोना: {formatCurrency(netWorth.breakdown.gold)}</Text>
              </View>
            </View>

            {/* Monthly Stats */}
            <View style={styles.monthlyStats}>
              <View style={styles.monthlyItem}>
                <Text style={styles.monthlyLabel}>महीने की आमदनी</Text>
                <Text style={styles.monthlyValue}>{formatCurrency(netWorth.monthly_income)}</Text>
              </View>
              <View style={styles.monthlyItem}>
                <Text style={styles.monthlyLabel}>महीने का खर्चा</Text>
                <Text style={[styles.monthlyValue, styles.expenseValue]}>
                  {formatCurrency(netWorth.monthly_expense)}
                </Text>
              </View>
              <View style={styles.monthlyItem}>
                <Text style={styles.monthlyLabel}>EMI</Text>
                <Text style={[styles.monthlyValue, styles.warningValue]}>
                  {formatCurrency(netWorth.monthly_emi)}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.loadingText}>Loading...</Text>
        )}
      </View>

      {/* FIRE Progress Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🎯 FIRE Progress</Text>
          <TouchableOpacity onPress={speakFIRE}>
            <Text style={styles.speakIcon}>🔊</Text>
          </TouchableOpacity>
        </View>
        
        {fire ? (
          <>
            <View style={styles.fireProgress}>
              <View style={styles.progressCircle}>
                <Text style={styles.progressPercent}>{fire.progress_percent}%</Text>
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressTarget}>
                  Goal: {formatCrore(fire.target_amount)}
                </Text>
                <Text style={styles.progressCurrent}>
                  Current: {formatCrore(fire.current_net_worth)}
                </Text>
                <Text style={styles.progressNeeded}>
                  Monthly Savings: {formatCurrency(fire.monthly_savings_needed)}
                </Text>
              </View>
            </View>

            <View style={styles.fireDetails}>
              <View style={styles.fireDetailItem}>
                <Text style={styles.fireDetailLabel}>उम्र</Text>
                <Text style={styles.fireDetailValue}>{fire.current_age} → {fire.target_age}</Text>
              </View>
              <View style={styles.fireDetailItem}>
                <Text style={styles.fireDetailLabel}>साल बाकी</Text>
                <Text style={styles.fireDetailValue}>{fire.years_remaining} साल</Text>
              </View>
              <View style={styles.fireDetailItem}>
                <Text style={styles.fireDetailLabel}>फालतू खर्च का असर</Text>
                <Text style={styles.fireDetailValue}>+{fire.monthly_spending_impact} months</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noFireContainer}>
            <Text style={styles.noFireText}>FIRE goal set nahi hai</Text>
            <TouchableOpacity 
              style={styles.setGoalButton}
              onPress={() => navigation?.navigate('Settings')}
            >
              <Text style={styles.setGoalText}>Goal Set करें</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Debt Summary Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>💳 कुल कर्ज़</Text>
          <TouchableOpacity onPress={speakDebt}>
            <Text style={styles.speakIcon}>🔊</Text>
          </TouchableOpacity>
        </View>
        
        {debt ? (
          <>
            <Text style={styles.debtTotal}>
              {formatCurrency(debt.total_outstanding)}
            </Text>
            
            {/* Warning if DTI > 40% */}
            {debt.debt_to_income_ratio > 40 && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  ⚠️ Income का {debt.debt_to_income_ratio}% EMI में जा रहा है — यह risky है!
                </Text>
              </View>
            )}

            <View style={styles.debtStats}>
              <View style={styles.debtStatItem}>
                <Text style={styles.debtStatLabel}>Monthly EMI</Text>
                <Text style={styles.debtStatValue}>{formatCurrency(debt.total_monthly_emi)}</Text>
              </View>
              <View style={styles.debtStatItem}>
                <Text style={styles.debtStatLabel}>Interest बाकी</Text>
                <Text style={styles.debtStatValue}>{formatCurrency(debt.total_interest_remaining)}</Text>
              </View>
              <View style={styles.debtStatItem}>
                <Text style={styles.debtStatLabel}>DTI Ratio</Text>
                <Text style={styles.debtStatValue}>{debt.debt_to_income_ratio}%</Text>
              </View>
            </View>

            {/* Prepayment Suggestion */}
            {debt.prepayment_suggestion && (
              <TouchableOpacity style={styles.prepaymentCard}>
                <Text style={styles.prepaymentTitle}>💡 Prepayment Suggests</Text>
                <Text style={styles.prepaymentText}>
                  {debt.prepayment_suggestion.loan_type} loan pehle चुकाएं — 
                  ₹{debt.prepayment_suggestion.interest_saved.toLocaleString('en-IN')} बचेंगे
                </Text>
              </TouchableOpacity>
            )}

            {/* Loans List */}
            {debt.loans.length > 0 && (
              <View style={styles.loansList}>
                <Text style={styles.loansTitle}>आपके Loans</Text>
                {debt.loans.slice(0, 4).map((loan: Loan, index: number) => (
                  <View key={loan.id || index} style={styles.loanItem}>
                    <View style={styles.loanInfo}>
                      <Text style={styles.loanType}>
                        {loan.loan_type === 'home' ? '🏠' : loan.loan_type === 'car' ? '🚗' : '💰'}
                        {' '}{loan.lender_name}
                      </Text>
                      <Text style={styles.loanEMI}>EMI: {formatCurrency(loan.emi_amount)}</Text>
                    </View>
                    <View style={styles.loanDetails}>
                      <Text style={styles.loanOutstanding}>
                        बाकी: {formatCurrency(loan.outstanding)}
                      </Text>
                      <Text style={styles.loanInterest}>{loan.interest_rate}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.loadingText}>कोई loan nahi</Text>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsRow}>
        <TouchableOpacity 
          style={styles.quickStatCard}
          onPress={() => Speech.speak('Idle money check kar raha hoon', { language: 'hi-IN' })}
        >
          <Text style={styles.quickStatIcon}>💰</Text>
          <Text style={styles.quickStatLabel}>Idle Money</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickStatCard}
          onPress={() => Speech.speak('Tax status batao', { language: 'hi-IN' })}
        >
          <Text style={styles.quickStatIcon}>📊</Text>
          <Text style={styles.quickStatLabel}>Tax 80C</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickStatCard}
          onPress={() => Speech.speak('Monthly summary dikhao', { language: 'hi-IN' })}
        >
          <Text style={styles.quickStatIcon}>📅</Text>
          <Text style={styles.quickStatLabel}>Monthly</Text>
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
  card: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  speakIcon: {
    fontSize: 20,
  },
  loadingText: {
    color: COLORS.text_secondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  netWorthValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: COLORS.text_tertiary,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.success,
  },
  debtValue: {
    color: COLORS.danger,
  },
  miniBreakdown: {
    backgroundColor: COLORS.bg_elevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  miniBreakdownTitle: {
    fontSize: 12,
    color: COLORS.text_secondary,
    marginBottom: 8,
  },
  miniBreakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  miniItem: {
    fontSize: 12,
    color: COLORS.text_tertiary,
    width: '50%',
    marginBottom: 4,
  },
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthlyItem: {
    alignItems: 'center',
  },
  monthlyLabel: {
    fontSize: 11,
    color: COLORS.text_tertiary,
    marginBottom: 4,
  },
  monthlyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  expenseValue: {
    color: COLORS.danger,
  },
  warningValue: {
    color: COLORS.orange,
  },
  fireProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  progressInfo: {
    flex: 1,
  },
  progressTarget: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  progressCurrent: {
    fontSize: 12,
    color: COLORS.text_secondary,
    marginTop: 2,
  },
  progressNeeded: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
  },
  fireDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fireDetailItem: {
    alignItems: 'center',
  },
  fireDetailLabel: {
    fontSize: 11,
    color: COLORS.text_tertiary,
  },
  fireDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginTop: 4,
  },
  noFireContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noFireText: {
    color: COLORS.text_secondary,
    marginBottom: 12,
  },
  setGoalButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  setGoalText: {
    color: COLORS.text_primary,
    fontWeight: '600',
  },
  debtTotal: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  warningBanner: {
    backgroundColor: COLORS.danger + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    color: COLORS.danger,
    textAlign: 'center',
    fontSize: 13,
  },
  debtStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  debtStatItem: {
    alignItems: 'center',
  },
  debtStatLabel: {
    fontSize: 11,
    color: COLORS.text_tertiary,
    marginBottom: 4,
  },
  debtStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  prepaymentCard: {
    backgroundColor: COLORS.success + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  prepaymentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 4,
  },
  prepaymentText: {
    fontSize: 13,
    color: COLORS.text_primary,
  },
  loansList: {
    marginTop: 8,
  },
  loansTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_secondary,
    marginBottom: 8,
  },
  loanItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_subtle,
  },
  loanInfo: {
    flex: 1,
  },
  loanType: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text_primary,
  },
  loanEMI: {
    fontSize: 12,
    color: COLORS.text_tertiary,
  },
  loanDetails: {
    alignItems: 'flex-end',
  },
  loanOutstanding: {
    fontSize: 13,
    color: COLORS.text_primary,
  },
  loanInterest: {
    fontSize: 12,
    color: COLORS.orange,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: COLORS.bg_surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickStatIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickStatLabel: {
    fontSize: 11,
    color: COLORS.text_secondary,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default CommandCenterScreen;