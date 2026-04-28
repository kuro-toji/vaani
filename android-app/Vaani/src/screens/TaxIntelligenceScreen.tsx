// ═══════════════════════════════════════════════════════════════════
// VAANI Tax Intelligence Screen — Tax Harvesting, 80C, Advance Tax
// Tax harvesting reminders, advance tax calculator, TDS detection
// Voice: "3 din ruko — LTCG ho jayega, ₹X bachenge"
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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { COLORS } from '../constants';
import type { TaxHarvestingOpportunity, AdvanceTaxDeadline, Section80CTracker, TDSRecord } from '../types';
import * as taxIntelService from '../services/taxIntelligenceService';

const { width } = Dimensions.get('window');

interface TaxIntelligenceScreenProps {
  navigation?: any;
}

export default function TaxIntelligenceScreen({ navigation }: TaxIntelligenceScreenProps) {
  const [activeTab, setActiveTab] = useState<'harvest' | 'advance' | '80c' | 'tds'>('harvest');
  const [harvestOpps, setHarvestOpps] = useState<TaxHarvestingOpportunity[]>([]);
  const [advanceTax, setAdvanceTax] = useState<AdvanceTaxDeadline[]>([]);
  const [tax80C, setTax80C] = useState<Section80CTracker | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = 'default_user';

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [harvest, advance, c80] = await Promise.all([
        taxIntelService.analyzeTaxHarvesting(userId),
        taxIntelService.calculateAdvanceTax(userId, 800000),
        taxIntelService.get80CStatus(userId),
      ]);
      setHarvestOpps(harvest);
      setAdvanceTax(advance);
      setTax80C(c80);
    } catch (err) {
      console.error('[TaxIntel] Load error:', err);
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

  const speakHarvest = () => {
    if (harvestOpps.length === 0) {
      Speech.speak('Abhi koi tax harvesting opportunity nahi hai', { language: 'hi-IN' });
      return;
    }
    const top = harvestOpps[0];
    Speech.speak(top.recommendation, { language: 'hi-IN', rate: 0.9 });
  };

  const speak80C = () => {
    if (!tax80C) return;
    const text = tax80C.remaining > 0
      ? `Aapka ₹${tax80C.remaining.toLocaleString('en-IN')} 80C limit baaki hai. ${tax80C.suggestions[0] || ''}`
      : '80C ka pura ₹1,50,000 limit use ho gaya hai';
    Speech.speak(text, { language: 'hi-IN', rate: 0.9 });
  };

  const speakAdvanceTax = () => {
    const next = advanceTax.find(d => d.days_remaining > 0 && d.balance_due > 0);
    if (next) {
      Speech.speak(taxIntelService.generateAdvanceTaxAlert(next), { language: 'hi-IN', rate: 0.9 });
    } else {
      Speech.speak('Advance tax sab bhara hua hai', { language: 'hi-IN' });
    }
  };

  const formatCurrency = (amount: number): string => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const getQuarterLabel = (q: number): string => {
    const labels = { 1: 'Q1 (Jun 15)', 2: 'Q2 (Sep 15)', 3: 'Q3 (Dec 15)', 4: 'Q4 (Mar 15)' };
    return labels[q as keyof typeof labels] || `Q${q}`;
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
        <Text style={styles.headerTitle}>📊 Tax Intelligence</Text>
        <TouchableOpacity onPress={speak80C}>
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
        {(['harvest', 'advance', '80c', 'tds'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'harvest' ? '🌾 Harvest' : tab === 'advance' ? '📅 Advance' : tab === '80c' ? '💰 80C' : '📋 TDS'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tax Harvesting Section */}
      {activeTab === 'harvest' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌾 Tax Harvesting Opportunities</Text>
            <TouchableOpacity onPress={speakHarvest}>
              <Text style={styles.speakIcon}>🔊</Text>
            </TouchableOpacity>
          </View>

          {harvestOpps.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>No harvesting needed</Text>
              <Text style={styles.emptySubtext}>Sab holdings theek hain</Text>
            </View>
          ) : (
            harvestOpps.map((opp, index) => (
              <View key={opp.holding_id || index} style={styles.oppCard}>
                <View style={styles.oppHeader}>
                  <Text style={styles.oppName}>{opp.asset_name}</Text>
                  <View style={[styles.gainBadge, opp.gain_type === 'LTCG' ? styles.ltcgBadge : styles.stcgBadge]}>
                    <Text style={styles.gainBadgeText}>{opp.gain_type}</Text>
                  </View>
                </View>
                
                <View style={styles.oppDetails}>
                  <View style={styles.oppRow}>
                    <Text style={styles.oppLabel}>Gain</Text>
                    <Text style={styles.oppValue}>{formatCurrency(opp.gain_amount)}</Text>
                  </View>
                  <View style={styles.oppRow}>
                    <Text style={styles.oppLabel}>Tax Now</Text>
                    <Text style={styles.oppValueDanger}>{formatCurrency(opp.tax_at_current)}</Text>
                  </View>
                  {opp.days_to_ltcg > 0 && (
                    <View style={styles.oppRow}>
                      <Text style={styles.oppLabel}>Days to LTCG</Text>
                      <Text style={styles.oppValueWarning}>{opp.days_to_ltcg} days</Text>
                    </View>
                  )}
                  <View style={styles.oppRow}>
                    <Text style={styles.oppLabel}>Tax If Wait</Text>
                    <Text style={styles.oppValueSuccess}>{formatCurrency(opp.tax_if_wait)}</Text>
                  </View>
                </View>

                <View style={styles.savingsCard}>
                  <Text style={styles.savingsLabel}>You Save</Text>
                  <Text style={styles.savingsValue}>{formatCurrency(opp.savings)}</Text>
                </View>

                <Text style={styles.oppRecommendation}>{opp.recommendation}</Text>
              </View>
            ))
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 What is Tax Harvesting?</Text>
            <Text style={styles.infoText}>
              Short-term gains (STCG) are taxed at 20% while long-term gains (LTCG) are taxed at 12.5%. 
              By waiting just a few days to cross the 1-year threshold, you can save significant tax.
            </Text>
          </View>
        </>
      )}

      {/* Advance Tax Section */}
      {activeTab === 'advance' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Advance Tax Deadlines</Text>
            <TouchableOpacity onPress={speakAdvanceTax}>
              <Text style={styles.speakIcon}>🔊</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.deadlinesCard}>
            {advanceTax.map((deadline, index) => (
              <View key={index} style={[
                styles.deadlineItem,
                deadline.days_remaining <= 30 && styles.deadlineUrgent
              ]}>
                <View style={styles.deadlineLeft}>
                  <Text style={styles.deadlineQuarter}>{getQuarterLabel(deadline.quarter)}</Text>
                  <Text style={styles.deadlineCumulative}>{deadline.cumulative_percent}% cumulative</Text>
                </View>
                <View style={styles.deadlineRight}>
                  <Text style={styles.deadlineAmount}>{formatCurrency(deadline.tax_due)}</Text>
                  {deadline.balance_due > 0 ? (
                    <Text style={styles.deadlineBalance}>Balance: {formatCurrency(deadline.balance_due)}</Text>
                  ) : (
                    <Text style={styles.deadlinePaid}>✓ Paid</Text>
                  )}
                  {deadline.days_remaining > 0 && deadline.days_remaining <= 30 && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>⏰ {deadline.days_remaining} days left</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Tax Paid So Far</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.progressText}>
              {formatCurrency(advanceTax.find(d => d.quarter === 1)?.already_paid || 0)} paid of {formatCurrency(advanceTax[advanceTax.length - 1]?.tax_due || 0)} total
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📅 Advance Tax Deadlines</Text>
            <Text style={styles.infoText}>
              • June 15: 15%{'\n'}• September 15: 45%{'\n'}• December 15: 75%{'\n'}• March 15: 100%
            </Text>
          </View>
        </>
      )}

      {/* 80C Section */}
      {activeTab === '80c' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💰 Section 80C Tracker</Text>
            <TouchableOpacity onPress={speak80C}>
              <Text style={styles.speakIcon}>🔊</Text>
            </TouchableOpacity>
          </View>

          {tax80C && (
            <>
              <View style={styles.limitCard}>
                <View style={styles.limitCircle}>
                  <Text style={styles.limitPercent}>
                    {Math.round((tax80C.used / tax80C.total_limit) * 100)}%
                  </Text>
                </View>
                <View style={styles.limitInfo}>
                  <Text style={styles.limitUsed}>Used: {formatCurrency(tax80C.used)}</Text>
                  <Text style={styles.limitRemaining}>Remaining: {formatCurrency(tax80C.remaining)}</Text>
                </View>
              </View>

              <View style={styles.limitTotal}>
                <Text style={styles.limitTotalLabel}>Total Limit</Text>
                <Text style={styles.limitTotalValue}>{formatCurrency(tax80C.total_limit)}</Text>
              </View>

              {/* Breakdown */}
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>Breakdown</Text>
                {Object.entries(tax80C.breakdown).map(([key, value]) => {
                  if (value === 0) return null;
                  const labels: Record<string, string> = {
                    epf: 'EPF', ppf: 'PPF', elss: 'ELSS', 
                    life_insurance: 'Life Insurance', nsc: 'NSC',
                    tuition_fees: 'Tuition Fees', home_loan_principal: 'Home Loan Principal', other: 'Other'
                  };
                  return (
                    <View key={key} style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>{labels[key] || key}</Text>
                      <Text style={styles.breakdownValue}>{formatCurrency(value)}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Suggestions */}
              {tax80C.suggestions.length > 0 && (
                <View style={styles.suggestionsCard}>
                  <Text style={styles.suggestionsTitle}>💡 Suggestions</Text>
                  {tax80C.suggestions.map((sugg, idx) => (
                    <Text key={idx} style={styles.suggestionText}>• {sugg}</Text>
                  ))}
                </View>
              )}

              {/* NPS Extra */}
              <View style={styles.npsCard}>
                <Text style={styles.npsTitle}>NPS Extra (80CCD 1B)</Text>
                <Text style={styles.npsText}>
                  NPS mein ₹50,000 extra daal do — 80C limit ke bahar extra deduction milega
                </Text>
                <Text style={styles.npsLimit}>Remaining: ₹50,000</Text>
              </View>
            </>
          )}
        </>
      )}

      {/* TDS Section */}
      {activeTab === 'tds' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 TDS Records</Text>
          </View>

          <View style={styles.tdsInfoCard}>
            <Text style={styles.tdsInfoTitle}>TDS Detection Rules</Text>
            <Text style={styles.tdsInfoText}>
              • Single payment ≥ ₹30,000 → 10% TDS{'\n'}
              • Annual from client ≥ ₹1,00,000 → PAN required{'\n'}
              • Verify in Form 26AS
            </Text>
          </View>

          <View style={styles.tdsAlertCard}>
            <Text style={styles.tdsAlertTitle}>⚠️ TDS Alert</Text>
            <Text style={styles.tdsAlertText}>
              Is payment pe TDS kata hoga — lagbhag ₹3,000. Form 26AS mein check karo.
            </Text>
          </View>

          <TouchableOpacity style={styles.form26asButton}>
            <Text style={styles.form26asText}>Open Form 26AS</Text>
          </TouchableOpacity>
        </>
      )}

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
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text_tertiary,
  },
  activeTabText: {
    color: COLORS.text_primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  speakIcon: {
    fontSize: 20,
  },
  emptyState: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
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
  oppCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  oppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  oppName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text_primary,
    flex: 1,
  },
  gainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ltcgBadge: {
    backgroundColor: COLORS.success + '30',
  },
  stcgBadge: {
    backgroundColor: COLORS.orange + '30',
  },
  gainBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  oppDetails: {
    marginBottom: 12,
  },
  oppRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  oppLabel: {
    fontSize: 12,
    color: COLORS.text_tertiary,
  },
  oppValue: {
    fontSize: 13,
    color: COLORS.text_primary,
    fontWeight: '500',
  },
  oppValueDanger: {
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '600',
  },
  oppValueWarning: {
    fontSize: 13,
    color: COLORS.orange,
    fontWeight: '600',
  },
  oppValueSuccess: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },
  savingsCard: {
    backgroundColor: COLORS.success + '20',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  savingsLabel: {
    fontSize: 11,
    color: COLORS.success,
    marginBottom: 4,
  },
  savingsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.success,
  },
  oppRecommendation: {
    fontSize: 13,
    color: COLORS.text_secondary,
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
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
  deadlinesCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  deadlineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_subtle,
  },
  deadlineUrgent: {
    backgroundColor: COLORS.danger + '10',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  deadlineLeft: {
    flex: 1,
  },
  deadlineQuarter: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  deadlineCumulative: {
    fontSize: 11,
    color: COLORS.text_tertiary,
    marginTop: 2,
  },
  deadlineRight: {
    alignItems: 'flex-end',
  },
  deadlineAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  deadlineBalance: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 2,
  },
  deadlinePaid: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 2,
  },
  urgentBadge: {
    backgroundColor: COLORS.danger + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  urgentText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.bg_elevated,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    width: '15%',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.text_tertiary,
  },
  limitCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  limitCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.text_primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  limitPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  limitInfo: {
    flex: 1,
  },
  limitUsed: {
    fontSize: 14,
    color: COLORS.text_primary,
  },
  limitRemaining: {
    fontSize: 14,
    color: COLORS.text_primary + '80',
    marginTop: 4,
  },
  limitTotal: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  limitTotalLabel: {
    fontSize: 14,
    color: COLORS.text_secondary,
  },
  limitTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  breakdownCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_subtle,
  },
  breakdownLabel: {
    fontSize: 13,
    color: COLORS.text_secondary,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  suggestionsCard: {
    backgroundColor: COLORS.success + '20',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.text_primary,
    marginBottom: 4,
  },
  npsCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
  },
  npsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  npsText: {
    fontSize: 13,
    color: COLORS.text_secondary,
    marginBottom: 8,
  },
  npsLimit: {
    fontSize: 13,
    color: COLORS.text_primary,
    fontWeight: '600',
  },
  tdsInfoCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  tdsInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginBottom: 8,
  },
  tdsInfoText: {
    fontSize: 13,
    color: COLORS.text_secondary,
    lineHeight: 22,
  },
  tdsAlertCard: {
    backgroundColor: COLORS.orange + '20',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  tdsAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.orange,
    marginBottom: 8,
  },
  tdsAlertText: {
    fontSize: 13,
    color: COLORS.text_primary,
  },
  form26asButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  form26asText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default TaxIntelligenceScreen;