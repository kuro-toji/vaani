// ═══════════════════════════════════════════════════════════════════
// VAANI Settings Screen
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Switch, Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, RADIUS, SUPPORTED_LANGUAGES, APP_CONFIG } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useSettingsStore } from '../stores/useSettingsStore';
import type { VisualMode } from '../types';

function SettingRow({ label, sublabel, value, onToggle }: {
  label: string; sublabel?: string; value: boolean; onToggle: () => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sublabel && <Text style={styles.settingSub}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.bg_elevated, true: COLORS.primary + '80' }}
        thumbColor={value ? COLORS.primary : COLORS.text_tertiary}
      />
    </View>
  );
}

export default function SettingsScreen({ navigation }: any) {
  const { user, logout, isAuthenticated } = useAuth();
  const settings = useSettingsStore();

  const handleLogout = () => {
    Alert.alert('लॉगआउट', 'क्या आप लॉगआउट करना चाहते हैं?', [
      { text: 'रद्द करें', style: 'cancel' },
      { text: 'लॉगआउट', style: 'destructive', onPress: async () => {
        await logout();
        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
      }},
    ]);
  };

  const handleLanguageSelect = (code: string) => {
    settings.setLanguage(code);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>सेटिंग्स</Text>
        <Text style={styles.headerSub}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <View style={styles.profileWave}>
              {[10, 16, 22, 16, 10].map((h, i) => (
                <View key={i} style={{ width: 3, height: h, borderRadius: 2, backgroundColor: i === 2 ? COLORS.primary : COLORS.text_tertiary }} />
              ))}
            </View>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.phone ? `+91 ${user.phone}` : user?.email || 'Demo User'}</Text>
            <Text style={styles.profileId}>VAANI User</Text>
          </View>
        </Animated.View>

        {/* Language */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>भाषा • Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
            {SUPPORTED_LANGUAGES.slice(0, 12).map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langChip, settings.language === lang.code && styles.langChipActive]}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <Text style={[styles.langChipText, settings.language === lang.code && { color: COLORS.text_inverse }]}>{lang.nativeName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Visual Mode */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>विज़ुअल मोड • Display</Text>
          <View style={styles.visualRow}>
            {([
              { mode: 'normal' as VisualMode, label: 'सामान्य', en: 'Normal' },
              { mode: 'large_text' as VisualMode, label: 'बड़ा टेक्स्ट', en: 'Large' },
              { mode: 'traffic_light' as VisualMode, label: 'ट्रैफ़िक', en: 'Traffic' },
            ]).map(v => (
              <TouchableOpacity
                key={v.mode}
                style={[styles.visualCard, settings.visual_mode === v.mode && styles.visualCardActive]}
                onPress={() => settings.setVisualMode(v.mode)}
              >
                <Text style={styles.visualLabel}>{v.label}</Text>
                <Text style={styles.visualEn}>{v.en}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Toggles */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>वॉइस और एक्सेसिबिलिटी</Text>
          <View style={styles.togglesCard}>
            <SettingRow label="हैप्टिक फीडबैक" sublabel="Vibration on actions" value={settings.haptic_enabled} onToggle={settings.toggleHaptic} />
            <SettingRow label="धीमी बोली" sublabel="Slower TTS speed" value={settings.slow_speech} onToggle={settings.toggleSlowSpeech} />
            <SettingRow label="ऑटो पढ़ें" sublabel="Auto-read AI responses" value={settings.auto_read_responses} onToggle={settings.toggleAutoRead} />
            <SettingRow label="लगातार सुनें" sublabel="Continuous listening mode" value={settings.continuous_listening} onToggle={settings.toggleContinuousListening} />
            <SettingRow label="नोटिफिकेशन" sublabel="Budget alerts, reminders" value={settings.notifications_enabled} onToggle={() => settings.update({ notifications_enabled: !settings.notifications_enabled })} />
          </View>
        </Animated.View>

        {/* Re-run onboarding */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Onboarding')}>
            <Text style={styles.secondaryBtnText}>ऑनबोर्डिंग फिर से करें</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Logout */}
        {isAuthenticated && (
          <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>लॉगआउट</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Version */}
        <View style={styles.versionBlock}>
          <Text style={styles.versionText}>{APP_CONFIG.name} v{APP_CONFIG.version}</Text>
          <Text style={styles.versionSub}>Made with ♥ for Bharat</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg_base },
  header: {
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: COLORS.text_primary },
  headerSub: { fontSize: 14, color: COLORS.text_tertiary, marginTop: 2 },
  content: { paddingHorizontal: 20 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.xl, padding: 20,
    borderWidth: 1, borderColor: COLORS.border_subtle, marginBottom: 24,
  },
  profileAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary_muted, alignItems: 'center', justifyContent: 'center',
  },
  profileWave: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  profileName: { fontSize: 16, fontWeight: '600', color: COLORS.text_primary },
  profileId: { fontSize: 12, color: COLORS.text_secondary, marginTop: 2 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text_primary, marginBottom: 12 },

  langChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: COLORS.bg_surface, borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  langChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  langChipText: { fontSize: 14, fontWeight: '500', color: COLORS.text_primary },

  visualRow: { flexDirection: 'row', gap: 10 },
  visualCard: {
    flex: 1, paddingVertical: 16, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg_surface, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border_subtle,
  },
  visualCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary_muted },
  visualLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text_primary },
  visualEn: { fontSize: 10, color: COLORS.text_secondary, marginTop: 2 },

  togglesCard: {
    backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border_subtle, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border_subtle,
  },
  settingLabel: { fontSize: 15, fontWeight: '500', color: COLORS.text_primary },
  settingSub: { fontSize: 11, color: COLORS.text_tertiary, marginTop: 2 },

  secondaryBtn: {
    paddingVertical: 14, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg_surface, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.text_primary },

  logoutBtn: {
    paddingVertical: 14, borderRadius: RADIUS.md,
    backgroundColor: COLORS.danger_muted, alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.danger },

  versionBlock: { alignItems: 'center', marginTop: 20, marginBottom: 20 },
  versionText: { fontSize: 13, color: COLORS.text_tertiary },
  versionSub: { fontSize: 11, color: COLORS.text_tertiary, marginTop: 4 },
});
