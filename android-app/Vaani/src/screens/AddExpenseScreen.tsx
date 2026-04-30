// ═══════════════════════════════════════════════════════════════════
// VAANI Add Expense Screen
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Alert, KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, EXPENSE_CATEGORIES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useFinanceStore } from '../stores/useFinanceStore';
import { formatCurrency } from '../services/financeService';

export default function AddExpenseScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const finance = useFinanceStore();
  const voiceTranscript = route?.params?.voice_transcript || '';

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState(voiceTranscript);
  const [category, setCategory] = useState('food');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('', 'कृपया राशि दें');
      return;
    }

    setSaving(true);
    try {
      await finance.addExpense(user?.id || 'demo_user', {
        description: description || EXPENSE_CATEGORIES.find(c => c.key === category)?.label || category,
        amount: parseFloat(amount),
        category,
        type,
        date: new Date().toISOString().split('T')[0],
        voice_transcript: voiceTranscript || undefined,
      });

      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'खर्चा जोड़ने में दिक्कत हुई');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← वापस</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{type === 'expense' ? 'खर्चा जोड़ें' : 'आमदनी जोड़ें'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Type Toggle */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>खर्चा</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveGreen]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>आमदनी</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Amount */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.amountBlock}>
          <Text style={styles.currencySign}>₹</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={COLORS.text_tertiary}
            keyboardType="numeric"
            value={amount}
            onChangeText={t => setAmount(t.replace(/[^0-9.]/g, ''))}
            autoFocus
          />
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <TextInput
            style={styles.descInput}
            placeholder="विवरण (वैकल्पिक)"
            placeholderTextColor={COLORS.text_tertiary}
            value={description}
            onChangeText={setDescription}
          />
        </Animated.View>

        {/* Category */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.fieldLabel}>श्रेणी</Text>
          <View style={styles.catGrid}>
            {EXPENSE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catChip, category === cat.key && { backgroundColor: cat.color + '30', borderColor: cat.color }]}
                onPress={() => setCategory(cat.key)}
              >
                <Text style={styles.catLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Save */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'जोड़ रहे हैं...' : 'जोड़ें ✓'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg_base },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12,
  },
  backBtn: { fontSize: 14, color: COLORS.gold, fontWeight: '400' },
  headerTitle: { fontSize: 18, fontWeight: '300', color: COLORS.text_primary, letterSpacing: 1 },
  content: { paddingHorizontal: 24, paddingTop: 20 },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  typeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg_surface, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border_subtle,
  },
  typeBtnActive: { backgroundColor: COLORS.danger_muted, borderColor: COLORS.danger },
  typeBtnActiveGreen: { backgroundColor: COLORS.success_muted, borderColor: COLORS.success },
  typeBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.text_secondary },
  typeBtnTextActive: { color: COLORS.text_primary },

  amountBlock: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 24, justifyContent: 'center',
  },
  currencySign: { fontSize: 36, fontWeight: '300', color: COLORS.text_tertiary, marginRight: 8 },
  amountInput: {
    fontSize: 48, fontWeight: '800', color: COLORS.text_primary,
    minWidth: 120, textAlign: 'center',
  },

  descInput: {
    backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.md,
    paddingHorizontal: 18, paddingVertical: 14, fontSize: 16,
    color: COLORS.text_primary, borderWidth: 1, borderColor: COLORS.border_subtle,
    marginBottom: 24,
  },

  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text_secondary, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 30 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    backgroundColor: COLORS.bg_surface, borderWidth: 1.5, borderColor: COLORS.border_subtle,
  },
  catLabel: { fontSize: 13, fontWeight: '500', color: COLORS.text_primary },

  saveBtn: {
    backgroundColor: COLORS.gold, paddingVertical: 18, borderRadius: RADIUS.lg,
    alignItems: 'center', shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  saveBtnText: { fontSize: 18, fontWeight: '600', color: COLORS.text_inverse },
});
