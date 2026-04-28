// ═══════════════════════════════════════════════════════════════════
// VAANI Add FD Screen
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, FD_BANK_RATES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useFinanceStore } from '../stores/useFinanceStore';
import { calculateFDMaturity, formatCurrency } from '../services/financeService';

export default function AddFDScreen({ navigation }: any) {
  const { user } = useAuth();
  const finance = useFinanceStore();

  const [bank, setBank] = useState('SBI');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('6.8');
  const [tenure, setTenure] = useState('12');
  const [saving, setSaving] = useState(false);

  const projection = useMemo(() => {
    if (!principal || !rate || !tenure) return null;
    return calculateFDMaturity(parseFloat(principal), parseFloat(rate), parseInt(tenure));
  }, [principal, rate, tenure]);

  const handleSave = async () => {
    if (!principal || parseFloat(principal) <= 0) {
      Alert.alert('', 'कृपया मूलधन दें');
      return;
    }
    setSaving(true);
    const startDate = new Date().toISOString().split('T')[0];
    const maturityDate = new Date(Date.now() + parseInt(tenure) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await finance.addFD(user?.id || 'demo_user', {
      bank,
      principal: parseFloat(principal),
      rate: parseFloat(rate),
      tenure_months: parseInt(tenure),
      start_date: startDate,
      maturity_date: maturityDate,
    });
    setSaving(false);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← वापस</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FD जोड़ें</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Bank Selection */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.fieldLabel}>बैंक चुनें</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
            {FD_BANK_RATES.map(b => (
              <TouchableOpacity
                key={b.bank}
                style={[styles.bankChip, bank === b.bank && styles.bankChipActive]}
                onPress={() => {
                  setBank(b.bank);
                  const r1y = b.rates.find(r => r.tenure === '1Y');
                  if (r1y) setRate(r1y.rate.toString());
                }}
              >
                <Text style={[styles.bankText, bank === b.bank && { color: COLORS.text_inverse }]}>{b.bank}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Principal */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>मूलधन (₹)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.prefix}>₹</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="100000"
              placeholderTextColor={COLORS.text_tertiary}
              value={principal}
              onChangeText={t => setPrincipal(t.replace(/[^0-9]/g, ''))}
            />
          </View>
        </Animated.View>

        {/* Rate */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>ब्याज दर (%)</Text>
          <TextInput
            style={styles.inputFull}
            keyboardType="numeric"
            placeholder="6.8"
            placeholderTextColor={COLORS.text_tertiary}
            value={rate}
            onChangeText={setRate}
          />
        </Animated.View>

        {/* Tenure */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.fieldLabel}>अवधि</Text>
          <View style={styles.tenureRow}>
            {['6', '12', '24', '36', '60'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tenureChip, tenure === t && styles.tenureActive]}
                onPress={() => setTenure(t)}
              >
                <Text style={[styles.tenureText, tenure === t && { color: COLORS.text_inverse }]}>{parseInt(t) < 12 ? `${t}M` : `${parseInt(t) / 12}Y`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Projection */}
        {projection && (
          <Animated.View entering={FadeInDown.delay(500)} style={styles.projectionCard}>
            <Text style={styles.projTitle}>अनुमानित रिटर्न</Text>
            <View style={styles.projRow}>
              <View style={styles.projItem}>
                <Text style={styles.projLabel}>मैच्योरिटी</Text>
                <Text style={styles.projValue}>{formatCurrency(projection.maturityValue)}</Text>
              </View>
              <View style={styles.projItem}>
                <Text style={styles.projLabel}>ब्याज</Text>
                <Text style={[styles.projValue, { color: COLORS.success }]}>{formatCurrency(projection.totalInterest)}</Text>
              </View>
              <View style={styles.projItem}>
                <Text style={styles.projLabel}>TDS</Text>
                <Text style={[styles.projValue, { color: COLORS.danger }]}>-{formatCurrency(projection.tds)}</Text>
              </View>
            </View>
            <View style={styles.projDivider} />
            <View style={styles.projItem}>
              <Text style={styles.projLabel}>Net Maturity</Text>
              <Text style={[styles.projValue, { fontSize: 22 }]}>{formatCurrency(projection.netMaturity)}</Text>
            </View>
          </Animated.View>
        )}

        {/* Save */}
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'जोड़ रहे हैं...' : 'FD जोड़ें ✓'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg_base },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12,
  },
  backBtn: { fontSize: 16, color: COLORS.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text_primary },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 60 },

  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text_secondary, marginBottom: 8 },
  fieldGroup: { marginBottom: 20 },

  bankChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    backgroundColor: COLORS.bg_surface, borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  bankChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  bankText: { fontSize: 14, fontWeight: '600', color: COLORS.text_primary },

  inputRow: { flexDirection: 'row', alignItems: 'center' },
  prefix: { fontSize: 20, color: COLORS.text_tertiary, marginRight: 8 },
  input: {
    flex: 1, backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 22, fontWeight: '600',
    color: COLORS.text_primary, borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  inputFull: {
    backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 18,
    color: COLORS.text_primary, borderWidth: 1, borderColor: COLORS.border_subtle,
  },

  tenureRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  tenureChip: {
    flex: 1, paddingVertical: 12, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg_surface, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  tenureActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tenureText: { fontSize: 14, fontWeight: '600', color: COLORS.text_primary },

  projectionCard: {
    backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.xl, padding: 20,
    borderWidth: 1, borderColor: COLORS.primary + '40', marginBottom: 24,
  },
  projTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text_primary, marginBottom: 16 },
  projRow: { flexDirection: 'row', gap: 12 },
  projItem: { flex: 1, alignItems: 'center', marginBottom: 10 },
  projLabel: { fontSize: 11, color: COLORS.text_tertiary, marginBottom: 4 },
  projValue: { fontSize: 16, fontWeight: '700', color: COLORS.text_primary },
  projDivider: { height: 1, backgroundColor: COLORS.border_subtle, marginVertical: 12 },

  saveBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: RADIUS.lg,
    alignItems: 'center', shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  saveBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.text_inverse },
});
