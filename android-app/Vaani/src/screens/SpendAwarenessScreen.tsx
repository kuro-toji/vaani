// ═══════════════════════════════════════════════════════════════════
// VAANI Spend Awareness Screen — Purchase Intent & Monthly Analytics
// Purchase intent check, opportunity cost, monthly spend summary
// Voice: "₹3,000 ka jacket kharidna hai" → "kya aap sure hain?"
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
import type { SpendCategory, MonthlySummary, PurchaseIntent, WishlistItem } from '../types';
import * as spendAwarenessService from '../services/spendAwarenessService';

const { width } = Dimensions.get('window');

interface SpendAwarenessScreenProps {
  navigation?: any;
}

export default function SpendAwarenessScreen({ navigation }: SpendAwarenessScreenProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'categories' | 'wishlist'>('summary');
  const [monthlyData, setMonthlyData] = useState<MonthlySummary | null>(null);
  const [categories, setCategories] = useState<SpendCategory[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = 'default_user';

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [summary, cats, items] = await Promise.all([
        spendAwarenessService.getMonthlySummary(userId, 4),
        spendAwarenessService.getCategoryBreakdown(userId),
        spendAwarenessService.getWishlist(userId),
      ]);
      setMonthlyData(summary);
      setCategories(cats);
      setWishlist(items);
    } catch (err) {
      console.error('[SpendAwareness] Load error:', err);
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

  const speakSummary = () => {
    if (!monthlyData) return;
    const text = spendAwarenessService.generateVoiceSummary(monthlyData, 'hi');
    Speech.speak(text, { language: 'hi-IN', rate: 0.9 });
  };

  const formatCurrency = (amount: number): string => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const calculateOpportunityCost = (amount: number, years: number = 10): string => {
    const futureValue = amount * Math.pow(1.20, years);
    return formatCurrency(Math.round(futureValue));
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      food: '🍔',
      transport: '🚗',
      utilities: '💡',
      health: '🏥',
      education: '📚',
      entertainment: '🎬',
      shopping: '🛒',
      other: '📦',
    };
    return icons[category] || '📦';
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      food: '#FF6B6B',
      transport: '#4ECDC4',
      utilities: '#FFE66D',
      health: '#95E1D3',
      education: '#A8E6CF',
      entertainment: '#DDA0DD',
      shopping: '#FFB347',
      other: '#B0BEC5',
    };
    return colors[category] || COLORS.text_tertiary;
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
        <Text style={styles.headerTitle}>🛒 Spend Awareness</Text>
        <TouchableOpacity onPress={speakSummary}>
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
        {(['summary', 'categories', 'wishlist'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'summary' ? '📊 Summary' : tab === 'categories' ? '📁 Categories' : '💭 Wishlist'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Monthly Summary */}
      {activeTab === 'summary' && monthlyData && (
        <>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>This Month</Text>
            <Text style={styles.totalValue}>{formatCurrency(monthlyData.total_spent)}</Text>
            <View style={styles.totalMeta}>
              {monthlyData.vs_last_month > 0 ? (
                <Text style={styles.moreThanLast}>
                  ↑ {formatCurrency(monthlyData.vs_last_month)} more than last month
                </Text>
              ) : (
                <Text style={styles.lessThanLast}>
                  ↓ {formatCurrency(Math.abs(monthlyData.vs_last_month))} saved
                </Text>
              )}
            </View>
          </View>

          {/* Budget vs Actual */}
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>Budget</Text>
              <Text style={styles.budgetValue}>
                {formatCurrency(monthlyData.total_spent)} / {formatCurrency(monthlyData.budget)}
              </Text>
            </View>
            <View style={styles.budgetBar}>
              <View 
                style={[
                  styles.budgetFill, 
                  monthlyData.total_spent > monthlyData.budget && styles.budgetOver
                ]} 
              />
            </View>
            {monthlyData.total_spent > monthlyData.budget && (
              <Text style={styles.budgetWarning}>
                ⚠️ Budget se ₹{formatCurrency(monthlyData.total_spent - monthlyData.budget)} zyada
              </Text>
            )}
          </View>

          {/* Top Categories */}
          <View style={styles.topCategories}>
            <Text style={styles.sectionTitle}>Top Spending</Text>
            {monthlyData.top_categories.slice(0, 4).map((cat, idx) => (
              <View key={idx} style={styles.topCatRow}>
                <View style={[styles.topCatIcon, { backgroundColor: getCategoryColor(cat.name) + '30' }]}>
                  <Text style={styles.topCatEmoji}>{getCategoryIcon(cat.name)}</Text>
                </View>
                <View style={styles.topCatInfo}>
                  <Text style={styles.topCatName}>{cat.name}</Text>
                  <Text style={styles.topCatBar}>
                    <View style={[styles.topCatFill, { 
                      width: `${(cat.amount / monthlyData.total_spent) * 100}%`,
                      backgroundColor: getCategoryColor(cat.name)
                    }]} />
                  </Text>
                </View>
                <Text style={styles.topCatAmount}>{formatCurrency(cat.amount)}</Text>
              </View>
            ))}
          </View>

          {/* Savings Impact */}
          <View style={styles.savingsCard}>
            <Text style={styles.savingsTitle}>💰 Savings Potential</Text>
            <Text style={styles.savingsText}>
              Agar ₹{formatCurrency(monthlyData.budget - monthlyData.total_spent)} kam kharch karo, 
              toh 10 saal mein ₹{calculateOpportunityCost(monthlyData.budget - monthlyData.total_spent)} ho jaayega
            </Text>
          </View>
        </>
      )}

      {/* Categories Detail */}
      {activeTab === 'categories' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📁 Category Breakdown</Text>
          </View>

          {categories.map((cat, index) => (
            <View key={index} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={[styles.catIcon, { backgroundColor: getCategoryColor(cat.name) + '20' }]}>
                  <Text style={styles.catEmoji}>{getCategoryIcon(cat.name)}</Text>
                </View>
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catCount}>{cat.transaction_count} transactions</Text>
                </View>
                <View style={styles.catAmount}>
                  <Text style={styles.catTotal}>{formatCurrency(cat.total)}</Text>
                  <Text style={styles.catAvg}>Avg: {formatCurrency(Math.round(cat.total / cat.transaction_count))}</Text>
                </View>
              </View>

              <View style={styles.catBar}>
                <View 
                  style={[styles.catFill, { backgroundColor: getCategoryColor(cat.name) }]}
                />
              </View>

              {cat.budget && (
                <View style={styles.catBudget}>
                  <Text style={[
                    styles.catBudgetText,
                    cat.total > cat.budget && styles.catBudgetOver
                  ]}>
                    {cat.total > cat.budget ? '⚠️ Over budget by ' : 'Budget remaining: '}
                    {formatCurrency(Math.abs(cat.budget - cat.total))}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {categories.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No spending data yet</Text>
              <Text style={styles.emptySubtext}>Voice: "₹500 ki chai piyi"</Text>
            </View>
          )}
        </>
      )}

      {/* Wishlist */}
      {activeTab === 'wishlist' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💭 Wishlist</Text>
          </View>

          {wishlist.map((item, index) => (
            <View key={index} style={styles.wishlistCard}>
              <View style={styles.wishlistInfo}>
                <Text style={styles.wishlistName}>{item.name}</Text>
                <Text style={styles.wishlistAmount}>{formatCurrency(item.amount)}</Text>
              </View>
              
              <View style={styles.wishlistMeta}>
                <Text style={styles.wishlistFuture}>
                  💡 10 years later: {calculateOpportunityCost(item.amount)}
                </Text>
                <Text style={styles.wishlistDays}>
                  Reminder in {item.reminder_days || 7} days
                </Text>
              </View>

              <TouchableOpacity
                style={styles.buyNowButton}
                onPress={() => Alert.alert('Confirm', 'Buy now?')}
              >
                <Text style={styles.buyNowText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          ))}

          {wishlist.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💭</Text>
              <Text style={styles.emptyText}>Wishlist khali hai</Text>
              <Text style={styles.emptySubtext}>Voice: "₹3000 ka jacket sochna hai"</Text>
            </View>
          )}

          <View style={styles.opportunityCostCard}>
            <Text style={styles.oppCostTitle}>💡 What is Opportunity Cost?</Text>
            <Text style={styles.oppCostText}>
              ₹3,000 aaj waste karo = ₹18,000 10 saal mein (20% return se). 
              Is ₹18,000 se 6 mahine ki vacation ho sakti thi.
            </Text>
          </View>
        </>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => Speech.speak('Spending check kar raha hoon', { language: 'hi-IN' })}
        >
          <Text style={styles.quickActionIcon}>🔍</Text>
          <Text style={styles.quickActionLabel}>Intent Check</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={speakSummary}
        >
          <Text style={styles.quickActionIcon}>🔊</Text>
          <Text style={styles.quickActionLabel}>Listen</Text>
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
    color: COLORS.gold,
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
    backgroundColor: COLORS.gold,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text_tertiary,
  },
  activeTabText: {
    color: COLORS.text_primary,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  totalCard: {
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.text_primary + '80',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  totalMeta: {
    marginTop: 8,
  },
  moreThanLast: {
    fontSize: 12,
    color: COLORS.danger,
  },
  lessThanLast: {
    fontSize: 12,
    color: COLORS.success,
  },
  budgetCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 13,
    color: COLORS.text_secondary,
  },
  budgetValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  budgetBar: {
    height: 8,
    backgroundColor: COLORS.bg_elevated,
    borderRadius: 4,
    marginBottom: 8,
  },
  budgetFill: {
    width: '70%',
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  budgetOver: {
    backgroundColor: COLORS.danger,
  },
  budgetWarning: {
    fontSize: 12,
    color: COLORS.danger,
    textAlign: 'center',
  },
  topCategories: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  topCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topCatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topCatEmoji: {
    fontSize: 20,
  },
  topCatInfo: {
    flex: 1,
  },
  topCatName: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text_primary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  topCatBar: {
    height: 4,
    backgroundColor: COLORS.bg_elevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  topCatFill: {
    height: '100%',
  },
  topCatAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  savingsCard: {
    backgroundColor: COLORS.success + '20',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  categoryCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catEmoji: {
    fontSize: 22,
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
    textTransform: 'capitalize',
  },
  catCount: {
    fontSize: 11,
    color: COLORS.text_tertiary,
    marginTop: 2,
  },
  catAmount: {
    alignItems: 'flex-end',
  },
  catTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  catAvg: {
    fontSize: 11,
    color: COLORS.text_tertiary,
    marginTop: 2,
  },
  catBar: {
    height: 6,
    backgroundColor: COLORS.bg_elevated,
    borderRadius: 3,
    marginBottom: 8,
  },
  catFill: {
    height: '100%',
    borderRadius: 3,
  },
  catBudget: {
    marginTop: 4,
  },
  catBudgetText: {
    fontSize: 12,
    color: COLORS.text_secondary,
  },
  catBudgetOver: {
    color: COLORS.danger,
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
  wishlistCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  wishlistInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wishlistName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text_primary,
    flex: 1,
  },
  wishlistAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gold,
  },
  wishlistMeta: {
    marginBottom: 12,
  },
  wishlistFuture: {
    fontSize: 12,
    color: COLORS.success,
    marginBottom: 4,
  },
  wishlistDays: {
    fontSize: 11,
    color: COLORS.text_tertiary,
  },
  buyNowButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buyNowText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  opportunityCostCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  oppCostTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginBottom: 8,
  },
  oppCostText: {
    fontSize: 13,
    color: COLORS.text_secondary,
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

export default SpendAwarenessScreen;