// ═══════════════════════════════════════════════════════════════════
// VAANI Add SIP Screen
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useFinanceStore } from '../stores/useFinanceStore';
import { calculateSIPProjection, formatCurrency } from '../services/financeService';

export default function AddSIPScreen({ navigation }: any) {
  const { user } = useAuth();
  const finance = useFinanceStore();

  const [fund, setFund] = useState('');
  const [monthly, setMonthly] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('12');
  const [tenure, setTenure] = useState('60');
  const [saving, setSaving] = useState(false);

  const projection = useMemo(() => {
    if (!monthly || !expectedReturn || !tenure) return null;
    return calculateSIPProjection(parseFloat(monthly), parseFloat(expectedReturn), parseInt(tenure));
  }, [monthly, expectedReturn, tenure]);

  const handleSave = async () => {
    if (!fund.trim()) { Alert.alert('', 'कृपया फंड का नाम दें'); return; }
    if (!monthly || parseFloat(monthly) <= 0) { Alert.alert('', 'कृपया मासिक राशि दें'); return; }

    setSaving(true);
    await finance.addSIP(user?.id || 'demo_user', {
      fund: fund.trim(),
      monthly: parseFloat(monthly),
      start_date: new Date().toISOString().split('T')[0],
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
        <Text style={styles.headerTitle}>SIP जोड़ें</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Fund Name */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>फंड का नाम</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Nifty 50 Index Fund"
            placeholderTextColor={COLORS.text_tertiary}
            value={fund}
            onChangeText={setFund}
            autoFocus
          />
        </Animated.View>

        {/* Monthly Amount */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>मासिक SIP (₹)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.prefix}>₹</Text>
            <TextInput
              style={styles.inputFlex}
              keyboardType="numeric"
              placeholder="5000"
              placeholderTextColor={COLORS.text_tertiary}
              value={monthly}
              onChangeText={t => setMonthly(t.replace(/[^0-9]/g, ''))}
            />
          </View>
        </Animated.View>

        {/* Quick amounts */}
        <View style={styles.quickAmounts}>
          {['1000', '2000', '5000', '10000'].map(a => (
            <TouchableOpacity key={a} style={styles.quickChip} onPress={() => setMonthly(a)}>
              <Text style={styles.quickText}>₹{parseInt(a).toLocaleString('en-IN')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Expected Return */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>अपेक्षित रिटर्न (% p.a.)</Text>
          <View style={styles.returnRow}>
            {['8', '10', '12', '15'].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.returnChip, expectedReturn === r && styles.returnActive]}
                onPress={() => setExpectedReturn(r)}
              >
                <Text style={[styles.returnText, expectedReturn === r && { color: COLORS.text_inverse }]}>{r}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Tenure */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>अवधि</Text>
          <View style={styles.returnRow}>
            {[{ m: '24', l: '2Y' }, { m: '60', l: '5Y' }, { m: '120', l: '10Y' }, { m: '240', l: '20Y' }].map(t => (
              <TouchableOpacity
                key={t.m}
                style={[styles.returnChip, tenure === t.m && styles.returnActive]}
                onPress={() => setTenure(t.m)}
              >
                <Text style={[styles.returnText, tenure === t.m && { color: COLORS.text_inverse }]}>{t.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Projection */}
        {projection && (
          <Animated.View entering={FadeInDown.delay(500)} style={styles.projCard}>
            <Text style={styles.projTitle}>SIP प्रक्षेपण</Text>
            <View style={styles.projRow}>
              <View style={styles.projItem}>
                <Text style={styles.projLabel}>निवेश</Text>
                <Text style={styles.projValue}>{formatCurrency(projection.totalInvested, true)}</Text>
              </View>
              <View style={styles.projItem}>
                <Text style={styles.projLabel}>रिटर्न</Text>
                <Text style={[styles.projValue, { color: COLORS.success }]}>+{formatCurrency(projection.estimatedReturns, true)}</Text>
              </View>
              <View style={styles.projItem}>
                <Text style={styles.projLabel}>कुल</Text>
                <Text style={[styles.projValue, { fontSize: 20, color: COLORS.primary }]}>{formatCurrency(projection.totalValue, true)}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Save */}
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'जोड़ रहे हैं...' : 'SIP शुरू करें ✓'}</Text>
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

  input: {
    backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    color: COLORS.text_primary, borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  prefix: { fontSize: 20, color: COLORS.text_tertiary, marginRight: 8 },
  inputFlex: {
    flex: 1, backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 22, fontWeight: '600',
    color: COLORS.text_primary, borderWidth: 1, borderColor: COLORS.border_subtle,
  },

  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    backgroundColor: COLORS.bg_elevated,
  },
  quickText: { fontSize: 12, color: COLORS.text_secondary, fontWeight: '500' },

  returnRow: { flexDirection: 'row', gap: 8 },
  returnChip: {
    flex: 1, paddingVertical: 12, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg_surface, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  returnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  returnText: { fontSize: 14, fontWeight: '600', color: COLORS.text_primary },

  projCard: {
    backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.xl, padding: 20,
    borderWidth: 1, borderColor: COLORS.primary + '40', marginBottom: 24, marginTop: 8,
  },
  projTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text_primary, marginBottom: 16 },
  projRow: { flexDirection: 'row', gap: 12 },
  projItem: { flex: 1, alignItems: 'center' },
  projLabel: { fontSize: 11, color: COLORS.text_tertiary, marginBottom: 4 },
  projValue: { fontSize: 16, fontWeight: '700', color: COLORS.text_primary },

  saveBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: RADIUS.lg,
    alignItems: 'center', shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  saveBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.text_inverse },
});
