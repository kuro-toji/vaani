import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { COLORS, EXPENSE_CATEGORIES } from '../constants';
import { SCREEN } from '../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

// Example data for demo
const EXAMPLE_DATA = {
  netWorth: 245678,
  monthlyIncome: 85000,
  monthlyExpenses: 42350,
  savingsGoal: 50000,
  currentSavings: 32000,
  recentExpenses: [
    { id: '1', description: 'दूध', amount: 45, category: 'food', date: '2026-04-26' },
    { id: '2', description: 'पेट्रोल', amount: 500, category: 'transport', date: '2026-04-25' },
    { id: '3', description: 'बिजली', amount: 1200, category: 'utilities', date: '2026-04-24' },
  ],
  fdInvestments: [
    { id: '1', bank: 'SBI', amount: 100000, rate: 6.8, maturity: '2027-04-26' },
    { id: '2', bank: 'HDFC', amount: 50000, rate: 7.2, maturity: '2026-10-15' },
  ],
  sipInvestments: [
    { id: '1', fund: 'SIP Modi Fund', amount: 5000, returns: 14.5 },
    { id: '2', fund: 'SIP Bharat Fund', amount: 3000, returns: 12.3 },
  ],
};

interface MainScreenProps {
  navigation?: any;
}

export default function MainScreen({ navigation }: MainScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        setIsRecording(true);
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    pulseAnim.stopAnimation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to chat
    if (navigation) {
      navigation.navigate('Chat');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderDashboard = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Net Worth Card */}
      <View style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>कुल संपत्ति</Text>
        <Text style={styles.netWorthAmount}>
          {formatCurrency(EXAMPLE_DATA.netWorth)}
        </Text>
        <View style={styles.netWorthChange}>
          <Text style={styles.netWorthChangeText}>📈 +12.5% इस महीने</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={styles.statLabel}>आमदनी</Text>
          <Text style={styles.statAmount}>
            {formatCurrency(EXAMPLE_DATA.monthlyIncome)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📤</Text>
          <Text style={styles.statLabel}>खर्चा</Text>
          <Text style={[styles.statAmount, { color: COLORS.danger }]}>
            {formatCurrency(EXAMPLE_DATA.monthlyExpenses)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏦</Text>
          <Text style={styles.statLabel}>बचत</Text>
          <Text style={[styles.statAmount, { color: COLORS.success }]}>
            {formatCurrency(EXAMPLE_DATA.monthlyIncome - EXAMPLE_DATA.monthlyExpenses)}
          </Text>
        </View>
      </View>

      {/* Savings Goal */}
      <View style={styles.savingsCard}>
        <View style={styles.savingsHeader}>
          <Text style={styles.savingsTitle}>बचत का लक्ष्य</Text>
          <Text style={styles.savingsTarget}>
            {formatCurrency(EXAMPLE_DATA.savingsGoal)}
          </Text>
        </View>
        <View style={styles.savingsProgress}>
          <View
            style={[
              styles.savingsProgressBar,
              { width: `${(EXAMPLE_DATA.currentSavings / EXAMPLE_DATA.savingsGoal) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.savingsFooter}>
          <Text style={styles.savingsCurrent}>
            {formatCurrency(EXAMPLE_DATA.currentSavings)}
          </Text>
          <Text style={styles.savingsPercent}>
            {Math.round((EXAMPLE_DATA.currentSavings / EXAMPLE_DATA.savingsGoal) * 100)}%
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>त्वरित कार्य</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>💸</Text>
            <Text style={styles.actionLabel}>खर्च जोड़ें</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>🏦</Text>
            <Text style={styles.actionLabel}>FD दरें</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionLabel}>रिपोर्ट</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>चैट करें</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>हाल के लेनदेन</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>सभी देखें</Text>
          </TouchableOpacity>
        </View>
        {EXAMPLE_DATA.recentExpenses.map((expense) => (
          <View key={expense.id} style={styles.transactionCard}>
            <View style={styles.transactionLeft}>
              <Text style={styles.transactionIcon}>
                {EXPENSE_CATEGORIES.find(c => c.key === expense.category)?.icon || '📦'}
              </Text>
              <View>
                <Text style={styles.transactionDesc}>{expense.description}</Text>
                <Text style={styles.transactionDate}>{expense.date}</Text>
              </View>
            </View>
            <Text style={styles.transactionAmount}>
              -{formatCurrency(expense.amount)}
            </Text>
          </View>
        ))}
      </View>

      {/* FD Investments */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>FD निवेश</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>+ जोड़ें</Text>
          </TouchableOpacity>
        </View>
        {EXAMPLE_DATA.fdInvestments.map((fd) => (
          <View key={fd.id} style={styles.investmentCard}>
            <View style={styles.investmentLeft}>
              <Text style={styles.investmentBank}>{fd.bank}</Text>
              <Text style={styles.investmentRate}>{fd.rate}% प्रति वर्ष</Text>
            </View>
            <View style={styles.investmentRight}>
              <Text style={styles.investmentAmount}>{formatCurrency(fd.amount)}</Text>
              <Text style={styles.investmentMaturity}>
                मियाद: {fd.maturity}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* SIP Investments */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SIP निवेश</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>+ जोड़ें</Text>
          </TouchableOpacity>
        </View>
        {EXAMPLE_DATA.sipInvestments.map((sip) => (
          <View key={sip.id} style={styles.investmentCard}>
            <View style={styles.investmentLeft}>
              <Text style={styles.investmentBank}>{sip.fund}</Text>
              <Text style={[styles.investmentRate, { color: COLORS.success }]}>
                +{sip.returns}% रिटर्न
              </Text>
            </View>
            <View style={styles.investmentRight}>
              <Text style={styles.investmentAmount}>{formatCurrency(sip.amount)}/माह</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Bottom padding for mic button */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg_base} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBrand}>VA<Text style={{ color: COLORS.gold }}>A</Text>NI</Text>
          <Text style={styles.headerSubtext}>आज आपकी वित्तीय स्थिति कैसी है?</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation?.navigate('Settings')}
        >
          <Text style={styles.profileEmoji}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {currentTab === 'dashboard' && renderDashboard()}

      {/* Voice FAB */}
      <TouchableOpacity
        style={[
          styles.voiceFab,
          isRecording && styles.voiceFabRecording,
        ]}
        onPressIn={startRecording}
        onPressOut={stopRecording}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            styles.voiceFabInner,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={styles.voiceFabIcon}>
            {isRecording ? '⏹️' : '🎤'}
          </Text>
        </Animated.View>
        <Text style={styles.voiceFabLabel}>
          {isRecording ? 'छोड़ें बोलना' : 'बोलें'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg_base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerBrand: {
    fontSize: SCREEN.isSmall ? 22 : 26,
    fontWeight: '300',
    color: COLORS.text_primary,
    letterSpacing: 3,
  },
  headerSubtext: {
    fontSize: 13,
    color: COLORS.text_secondary,
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bg_surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold_dim,
  },
  profileEmoji: {
    fontSize: 22,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  netWorthCard: {
    backgroundColor: COLORS.gold_dim,
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  netWorthLabel: {
    fontSize: 12,
    color: COLORS.gold,
    marginBottom: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  netWorthAmount: {
    fontSize: SCREEN.isSmall ? 32 : 40,
    fontWeight: '300',
    color: COLORS.text_primary,
  },
  netWorthChange: {
    marginTop: 10,
  },
  netWorthChangeText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text_secondary,
    marginBottom: 4,
  },
  statAmount: {
    fontSize: SCREEN.isSmall ? 14 : 16,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  savingsCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  savingsTarget: {
    fontSize: 14,
    color: COLORS.text_secondary,
  },
  savingsProgress: {
    height: 8,
    backgroundColor: COLORS.bg_elevated,
    borderRadius: 4,
    marginTop: 15,
    overflow: 'hidden',
  },
  savingsProgressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  savingsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  savingsCurrent: {
    fontSize: 14,
    color: COLORS.text_primary,
    fontWeight: '600',
  },
  savingsPercent: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  quickActions: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gold,
    marginBottom: 15,
    letterSpacing: 1,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 64) / 2,
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    color: COLORS.text_primary,
    fontWeight: '500',
  },
  recentSection: {
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bg_surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    fontSize: 24,
  },
  transactionDesc: {
    fontSize: 15,
    color: COLORS.text_primary,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.text_tertiary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    color: COLORS.danger,
    fontWeight: '600',
  },
  investmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bg_surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
  },
  investmentLeft: {
    flex: 1,
  },
  investmentBank: {
    fontSize: 15,
    color: COLORS.text_primary,
    fontWeight: '500',
  },
  investmentRate: {
    fontSize: 13,
    color: COLORS.text_secondary,
    marginTop: 3,
  },
  investmentRight: {
    alignItems: 'flex-end',
  },
  investmentAmount: {
    fontSize: 15,
    color: COLORS.text_primary,
    fontWeight: '600',
  },
  investmentMaturity: {
    fontSize: 12,
    color: COLORS.text_tertiary,
    marginTop: 3,
  },
  voiceFab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    alignItems: 'center',
  },
  voiceFabRecording: {},
  voiceFabInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  voiceFabIcon: {
    fontSize: 30,
  },
  voiceFabLabel: {
    fontSize: 12,
    color: COLORS.text_secondary,
    marginTop: 8,
  },
});
