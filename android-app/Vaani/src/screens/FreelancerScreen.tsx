// ═══════════════════════════════════════════════════════════════════
// VAANI Freelancer OS Screen — Income Tracking & Invoice Management
// Client-wise payment tagging, GST invoice generation, ITR export
// Voice: "Rahul ne ₹25,000 bheja project ke liye"
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
  Platform,
  Alert,
  Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { COLORS } from '../constants';
import type { FreelancerIncome, ClientTracker, GSTInvoice, ITRExportData } from '../types';
import * as freelancerService from '../services/freelancerService';

const { width } = Dimensions.get('window');

interface FreelancerScreenProps {
  navigation?: any;
}

export default function FreelancerScreen({ navigation }: FreelancerScreenProps) {
  const [activeTab, setActiveTab] = useState<'income' | 'clients' | 'invoices'>('income');
  const [clients, setClients] = useState<ClientTracker[]>([]);
  const [invoices, setInvoices] = useState<GSTInvoice[]>([]);
  const [itrData, setItrData] = useState<ITRExportData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showGenerateInvoice, setShowGenerateInvoice] = useState(false);
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [invoiceClient, setInvoiceClient] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceService, setInvoiceService] = useState('');
  const [error, setError] = useState<string | null>(null);
  const userId = 'default_user';

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [clientData, invoiceData] = await Promise.all([
        freelancerService.getClientTracker(userId),
        getInvoices(),
      ]);
      setClients(clientData);
      setInvoices(invoiceData);
    } catch (err) {
      console.error('[Freelancer] Load error:', err);
      setError('Data load karne mein dikkat');
    }
  }, [userId]);

  const getInvoices = async () => {
    // Mock invoices for demo
    return [];
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleLogIncome = async () => {
    if (!clientName.trim() || !amount) {
      Alert.alert('Error', 'Client name aur amount dono do');
      return;
    }
    
    try {
      const amt = parseInt(amount);
      const result = await freelancerService.logIncome(userId, clientName.trim(), amt, description);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak(result.voiceConfirmation, { language: 'hi-IN', rate: 0.9 });
      
      setClientName('');
      setAmount('');
      setDescription('');
      setShowAddIncome(false);
      loadData();
      
      Alert.alert('Success', result.voiceConfirmation);
    } catch (err) {
      Alert.alert('Error', 'Income log karne mein dikkat');
    }
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceClient.trim() || !invoiceAmount || !invoiceService.trim()) {
      Alert.alert('Error', 'Client, amount aur service description do');
      return;
    }
    
    try {
      const amt = parseInt(invoiceAmount);
      const result = await freelancerService.generateInvoice(
        userId,
        invoiceClient.trim(),
        amt,
        invoiceService.trim()
      );
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak(result.voiceConfirmation, { language: 'hi-IN', rate: 0.9 });
      
      setInvoiceClient('');
      setInvoiceAmount('');
      setInvoiceService('');
      setShowGenerateInvoice(false);
      loadData();
      
      Alert.alert('Success', result.voiceConfirmation);
    } catch (err) {
      Alert.alert('Error', 'Invoice generate karne mein dikkat');
    }
  };

  const handleExportITR = async () => {
    try {
      const data = await freelancerService.generateITRExport(userId);
      setItrData(data);
      
      // Create shareable text
      const itrText = `
ITR DATA EXPORT
FY: ${data.financial_year}
Total Income: ₹${data.total_income.toLocaleString('en-IN')}
Clients: ${data.income_by_client.length}
TDS Deducted: ₹${data.tds_deducted.toLocaleString('en-IN')}
Advance Tax Paid: ₹${data.advance_tax_paid.toLocaleString('en-IN')}
Estimated Tax: ₹${data.estimated_tax.toLocaleString('en-IN')}
      `.trim();
      
      await Share.share({
        message: itrText,
        title: 'ITR Data Export',
      });
    } catch (err) {
      Alert.alert('Error', 'ITR export karne mein dikkat');
    }
  };

  const speakClients = () => {
    if (clients.length === 0) {
      Speech.speak('Abhi tak koi client nahi hai', { language: 'hi-IN' });
      return;
    }
    
    const text = clients.slice(0, 3).map(c => 
      `${c.client_name} se ₹${c.total_paid.toLocaleString('en-IN')}, ${c.payment_count} payments`
    ).join('. ');
    
    Speech.speak(text, { language: 'hi-IN', rate: 0.9 });
  };

  const speakIncome = () => {
    const total = clients.reduce((s, c) => s + c.total_paid, 0);
    Speech.speak(`Total income ₹${total.toLocaleString('en-IN')}, ${clients.length} clients se`, { language: 'hi-IN' });
  };

  const formatCurrency = (amount: number): string => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const calculateTotalIncome = () => {
    return clients.reduce((s, c) => s + c.total_paid, 0);
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
        <Text style={styles.headerTitle}>🧾 Freelancer OS</Text>
        <TouchableOpacity onPress={speakIncome}>
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
        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && styles.activeTab]}
          onPress={() => setActiveTab('income')}
        >
          <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>
            📝 Income
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'clients' && styles.activeTab]}
          onPress={() => setActiveTab('clients')}
        >
          <Text style={[styles.tabText, activeTab === 'clients' && styles.activeTabText]}>
            👥 Clients
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invoices' && styles.activeTab]}
          onPress={() => setActiveTab('invoices')}
        >
          <Text style={[styles.tabText, activeTab === 'invoices' && styles.activeTabText]}>
            📄 Invoices
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryMain}>
          <Text style={styles.summaryLabel}>Total Income (FY)</Text>
          <Text style={styles.summaryValue}>{formatCurrency(calculateTotalIncome())}</Text>
        </View>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{clients.length}</Text>
            <Text style={styles.summaryStatLabel}>Clients</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>{invoices.length}</Text>
            <Text style={styles.summaryStatLabel}>Invoices</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatValue}>
              {formatCurrency(clients.reduce((s, c) => s + c.tds_total, 0))}
            </Text>
            <Text style={styles.summaryStatLabel}>TDS</Text>
          </View>
        </View>
      </View>

      {/* Add Income Form */}
      {showAddIncome && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>➕ Income Log करें</Text>
          <TextInput
            style={styles.input}
            placeholder="Client Name (जैसे Infosys)"
            placeholderTextColor={COLORS.text_tertiary}
            value={clientName}
            onChangeText={setClientName}
          />
          <TextInput
            style={styles.input}
            placeholder="Amount (₹)"
            placeholderTextColor={COLORS.text_tertiary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            placeholderTextColor={COLORS.text_tertiary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.formBtn, styles.cancelBtn]}
              onPress={() => setShowAddIncome(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formBtn, styles.submitBtn]}
              onPress={handleLogIncome}
            >
              <Text style={styles.submitBtnText}>Log करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Generate Invoice Form */}
      {showGenerateInvoice && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>📄 Invoice बनाएं</Text>
          <TextInput
            style={styles.input}
            placeholder="Client Name"
            placeholderTextColor={COLORS.text_tertiary}
            value={invoiceClient}
            onChangeText={setInvoiceClient}
          />
          <TextInput
            style={styles.input}
            placeholder="Amount (₹)"
            placeholderTextColor={COLORS.text_tertiary}
            value={invoiceAmount}
            onChangeText={setInvoiceAmount}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Service Description"
            placeholderTextColor={COLORS.text_tertiary}
            value={invoiceService}
            onChangeText={setInvoiceService}
            multiline
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.formBtn, styles.cancelBtn]}
              onPress={() => setShowGenerateInvoice(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formBtn, styles.submitBtn]}
              onPress={handleGenerateInvoice}
            >
              <Text style={styles.submitBtnText}>Invoice बनाएं</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setShowAddIncome(true)}
        >
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={styles.quickActionLabel}>Income Log</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => setShowGenerateInvoice(true)}
        >
          <Text style={styles.quickActionIcon}>📄</Text>
          <Text style={styles.quickActionLabel}>Invoice</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={handleExportITR}
        >
          <Text style={styles.quickActionIcon}>📊</Text>
          <Text style={styles.quickActionLabel}>ITR Export</Text>
        </TouchableOpacity>
      </View>

      {/* Clients List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>👥 Clients</Text>
          <TouchableOpacity onPress={speakClients}>
            <Text style={styles.speakIcon}>🔊</Text>
          </TouchableOpacity>
        </View>

        {clients.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Abhi tak koi client nahi</Text>
            <Text style={styles.emptySubtext}>Voice: "Infosys se 50000 aaye"</Text>
          </View>
        ) : (
          clients.map((client, index) => (
            <TouchableOpacity key={index} style={styles.clientCard}>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{client.client_name}</Text>
                <Text style={styles.clientPayments}>{client.payment_count} payments</Text>
              </View>
              <View style={styles.clientAmount}>
                <Text style={styles.clientTotal}>
                  {formatCurrency(client.total_paid)}
                </Text>
                {client.tds_total > 0 && (
                  <Text style={styles.clientTds}>TDS: {formatCurrency(client.tds_total)}</Text>
                )}
              </View>
              {client.days_since_last_payment > 30 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>⏰ {client.days_since_last_payment} days</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* TDS Alerts */}
      {clients.filter(c => c.total_paid >= 100000 && c.tds_total === 0).length > 0 && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>⚠️ TDS Alert</Text>
          <Text style={styles.alertText}>
            {clients.filter(c => c.total_paid >= 100000 && c.tds_total === 0).length} clients ne ₹1 लाख se zyada diya hai — PAN do taaki TDS kaatein
          </Text>
        </View>
      )}

      {/* ITR Data Preview */}
      {itrData && (
        <View style={styles.itrCard}>
          <Text style={styles.itrTitle}>📊 ITR Data Preview</Text>
          <View style={styles.itrRow}>
            <Text style={styles.itrLabel}>FY</Text>
            <Text style={styles.itrValue}>{itrData.financial_year}</Text>
          </View>
          <View style={styles.itrRow}>
            <Text style={styles.itrLabel}>Total Income</Text>
            <Text style={styles.itrValue}>{formatCurrency(itrData.total_income)}</Text>
          </View>
          <View style={styles.itrRow}>
            <Text style={styles.itrLabel}>TDS Deducted</Text>
            <Text style={styles.itrValue}>{formatCurrency(itrData.tds_deducted)}</Text>
          </View>
          <View style={styles.itrRow}>
            <Text style={styles.itrLabel}>Advance Tax Paid</Text>
            <Text style={styles.itrValue}>{formatCurrency(itrData.advance_tax_paid)}</Text>
          </View>
          <View style={styles.itrRow}>
            <Text style={styles.itrLabel}>Estimated Tax</Text>
            <Text style={styles.itrValue}>{formatCurrency(itrData.estimated_tax)}</Text>
          </View>
        </View>
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
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text_tertiary,
  },
  activeTabText: {
    color: COLORS.text_primary,
  },
  summaryCard: {
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryMain: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.text_primary + '80',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.text_primary + '20',
    paddingTop: 16,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: COLORS.text_primary + '80',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.bg_elevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text_primary,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  formBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginLeft: 8,
  },
  cancelBtn: {
    backgroundColor: COLORS.bg_elevated,
  },
  cancelBtnText: {
    color: COLORS.text_secondary,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: COLORS.gold,
  },
  submitBtnText: {
    color: COLORS.text_primary,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  section: {
    marginBottom: 16,
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
  clientCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  clientPayments: {
    fontSize: 12,
    color: COLORS.text_tertiary,
    marginTop: 2,
  },
  clientAmount: {
    alignItems: 'flex-end',
  },
  clientTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.success,
  },
  clientTds: {
    fontSize: 11,
    color: COLORS.orange,
    marginTop: 2,
  },
  pendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.orange + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 11,
    color: COLORS.orange,
  },
  alertCard: {
    backgroundColor: COLORS.orange + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.orange,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 13,
    color: COLORS.text_primary,
    lineHeight: 20,
  },
  itrCard: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  itrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginBottom: 16,
  },
  itrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_subtle,
  },
  itrLabel: {
    fontSize: 13,
    color: COLORS.text_secondary,
  },
  itrValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default FreelancerScreen;