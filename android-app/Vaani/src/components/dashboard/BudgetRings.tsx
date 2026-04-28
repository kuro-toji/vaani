// ═══════════════════════════════════════════════════════════════════
// VAANI Budget Ring Component — Visual budget progress with rings
// Animated SVG rings showing spent vs. remaining budget
// ═══════════════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface BudgetRingProps {
  category: string;
  spent: number;
  limit: number;
  color: string;
  size?: number;
  icon?: string;
  language?: string;
}

export const BudgetRing: React.FC<BudgetRingProps> = ({
  category,
  spent,
  limit,
  color,
  size = 100,
  icon = '💰',
  language = 'hi',
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  
  const percentage = Math.min((spent / limit) * 100, 100);
  const remaining = Math.max(limit - spent, 0);
  const isOverBudget = spent > limit;

  // Animation
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: percentage,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [percentage]);

  // Colors
  const getColor = () => {
    if (isOverBudget) return '#FF4444';
    if (percentage > 80) return '#FF9800';
    return color;
  };

  const ringColor = getColor();

  // SVG Ring calculations
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const centerX = size / 2;
  const centerY = size / 2;

  // Category labels
  const categoryLabels: Record<string, Record<string, string>> = {
    food: { hi: 'खाना', en: 'Food' },
    transport: { hi: 'यातायात', en: 'Transport' },
    utilities: { hi: 'बिल', en: 'Utilities' },
    entertainment: { hi: 'मनोरंजन', en: 'Entertainment' },
    health: { hi: 'स्वास्थ्य', en: 'Health' },
    education: { hi: 'शिक्षा', en: 'Education' },
    shopping: { hi: 'खरीदारी', en: 'Shopping' },
    rent: { hi: 'किराया', en: 'Rent' },
    investment: { hi: 'निवेश', en: 'Investment' },
    other: { hi: 'अन्य', en: 'Other' },
  };

  const label = categoryLabels[category]?.[language] || category;

  // Format currency
  const formatCurrency = (amount: number): string => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${Math.round(amount)}`;
  };

  return (
    <View style={[styles.container, { width: size + 20 }]}>
      {/* SVG Ring */}
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        <View style={styles.svgContainer}>
          {/* Background ring */}
          <View
            style={[
              styles.ringBackground,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: '#E0E0E0',
              },
            ]}
          />
          {/* Progress ring - simplified visualization */}
          <View
            style={[
              styles.ringProgress,
              {
                width: size - strokeWidth * 2,
                height: size - strokeWidth * 2,
                borderRadius: (size - strokeWidth * 2) / 2,
                borderWidth: strokeWidth,
                borderColor: ringColor,
                borderTopColor: percentage > 25 ? ringColor : 'transparent',
                borderRightColor: percentage > 50 ? ringColor : 'transparent',
                borderBottomColor: percentage > 75 ? ringColor : 'transparent',
                borderLeftColor: percentage > 0 ? ringColor : 'transparent',
                transform: [{ rotate: '-90deg' }],
              },
            ]}
          />
        </View>
        
        {/* Center content */}
        <View style={styles.centerContent}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={[styles.percentage, { color: ringColor }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      </View>

      {/* Label */}
      <Text style={styles.categoryLabel} numberOfLines={1}>
        {label}
      </Text>
      
      {/* Amount */}
      <Text style={styles.amountText} numberOfLines={1}>
        {formatCurrency(spent)} / {formatCurrency(limit)}
      </Text>
      
      {isOverBudget && (
        <Text style={styles.overBudgetText}>
          {language === 'hi' ? 'सीमा पार!' : 'Over limit!'}
        </Text>
      )}
    </View>
  );
};

// ─── Budget Rings Grid ───────────────────────────────────────────────
interface BudgetRingsGridProps {
  budgets: Array<{
    category: string;
    spent: number;
    limit: number;
  }>;
  language?: string;
}

export const BudgetRingsGrid: React.FC<BudgetRingsGridProps> = ({
  budgets,
  language = 'hi',
}) => {
  // Category colors
  const categoryColors: Record<string, string> = {
    food: '#4CAF50',
    transport: '#2196F3',
    utilities: '#FFC107',
    entertainment: '#9C27B0',
    health: '#FF5722',
    education: '#00BCD4',
    shopping: '#E91E63',
    rent: '#795548',
    investment: '#607D8B',
    other: '#9E9E9E',
  };

  // Category icons
  const categoryIcons: Record<string, string> = {
    food: '🍛',
    transport: '🚌',
    utilities: '💡',
    entertainment: '🎬',
    health: '💊',
    education: '📚',
    shopping: '🛍️',
    rent: '🏠',
    investment: '💹',
    other: '📦',
  };

  return (
    <View style={styles.gridContainer}>
      {budgets.slice(0, 6).map((budget, index) => (
        <View key={budget.category} style={styles.gridItem}>
          <BudgetRing
            category={budget.category}
            spent={budget.spent}
            limit={budget.limit}
            color={categoryColors[budget.category] || '#9E9E9E'}
            icon={categoryIcons[budget.category] || '💰'}
            language={language}
          />
        </View>
      ))}
    </View>
  );
};

// ─── Total Budget Summary ────────────────────────────────────────────
interface BudgetSummaryProps {
  totalSpent: number;
  totalBudget: number;
  language?: string;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  totalSpent,
  totalBudget,
  language = 'hi',
}) => {
  const remaining = Math.max(totalBudget - totalSpent, 0);
  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const formatCurrency = (amount: number): string => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${Math.round(amount)}`;
  };

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>
            {language === 'hi' ? 'कुल खर्चा' : 'Total Spent'}
          </Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalSpent)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>
            {language === 'hi' ? 'बजट' : 'Budget'}
          </Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalBudget)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>
            {language === 'hi' ? 'बचा' : 'Remaining'}
          </Text>
          <Text style={[styles.summaryValue, { color: remaining > 0 ? '#4CAF50' : '#FF4444' }]}>
            {formatCurrency(remaining)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: percentage > 100 ? '#FF4444' : percentage > 80 ? '#FF9800' : '#4CAF50',
              },
            ]}
          />
        </View>
        <Text style={styles.progressBarText}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: 8,
  },
  ringContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgContainer: {
    position: 'absolute',
  },
  ringBackground: {
    position: 'absolute',
  },
  ringProgress: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginBottom: 2,
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryLabel: {
    fontSize: 12,
    marginTop: 4,
    color: '#333',
    textAlign: 'center',
  },
  amountText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  overBudgetText: {
    fontSize: 10,
    color: '#FF4444',
    fontWeight: 'bold',
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  gridItem: {
    width: '33%',
    alignItems: 'center',
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    margin: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
});

export default BudgetRing;