import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ScrollView, Dimensions, Platform, StatusBar, RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS } from '../constants';
import { fetchCryptoPrices, getFDRates, fetchSIPNav, formatPrice, formatChange, formatMarketCap, CryptoData, FDRate, SIPFund } from '../services/marketDataService';
import { announceScreen } from '../services/voiceNavService';
import VoiceOverlay from '../components/VoiceOverlay';

const { width } = Dimensions.get('window');

interface MainScreenProps { navigation?: any; }

export default function MainScreen({ navigation }: MainScreenProps) {
  const [crypto, setCrypto] = useState<CryptoData[]>([]);
  const [fdRates, setFdRates] = useState<FDRate[]>([]);
  const [sipFunds, setSipFunds] = useState<SIPFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const [c, s] = await Promise.allSettled([fetchCryptoPrices(), fetchSIPNav()]);
      if (c.status === 'fulfilled') setCrypto(c.value);
      if (s.status === 'fulfilled') setSipFunds(s.value);
      setFdRates(getFDRates());
      setLastUpdate(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) { console.error('[Main] Load error:', e); }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    })();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg_base} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} colors={[COLORS.gold]} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>VAANI</Text>
              <Text style={styles.headerTitle}>Financial Dashboard</Text>
            </View>
            <TouchableOpacity onPress={() => navigation?.navigate('Settings')} style={styles.settingsBtn}>
              <Text style={{ fontSize: 22 }}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Update Badge */}
          <View style={styles.updateBadge}>
            <Text style={styles.updateText}>● Live · Updated {lastUpdate || '...'} · Auto-refresh 60s</Text>
          </View>

          {/* ═══ Crypto Market ═══ */}
          <SectionHeader icon="₿" title="Crypto Market" accent={COLORS.orange} count={crypto.length} onViewAll={() => navigation?.navigate('Chat')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {crypto.slice(0, 10).map((c, i) => (
              <TouchableOpacity key={c.symbol} style={styles.cryptoCard} activeOpacity={0.7}>
                <View style={styles.cryptoHeader}>
                  {c.image ? (
                    <View style={styles.cryptoImgWrap}>
                      {/* Image placeholder — expo-image not imported to keep lightweight */}
                      <Text style={styles.cryptoRank}>#{c.rank}</Text>
                    </View>
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cryptoName}>{c.name}</Text>
                    <Text style={styles.cryptoSymbol}>{c.symbol}</Text>
                  </View>
                </View>
                <Text style={styles.cryptoPrice}>{formatPrice(c.priceINR)}</Text>
                <View style={[styles.changeBadge, { backgroundColor: c.change24h >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                  <Text style={[styles.changeText, { color: c.change24h >= 0 ? COLORS.success : COLORS.danger }]}>
                    {formatChange(c.change24h)}
                  </Text>
                </View>
                <Text style={styles.cryptoMcap}>{formatMarketCap(c.marketCap)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ═══ FD Rates ═══ */}
          <SectionHeader icon="🏦" title="Top FD Rates" accent={COLORS.accent} count={fdRates.length} onViewAll={() => navigation?.navigate('AddFD')} />
          <View style={styles.fdGrid}>
            {fdRates.slice(0, 6).map((fd, i) => (
              <TouchableOpacity key={fd.bankId} style={styles.fdCard} activeOpacity={0.7} onPress={() => navigation?.navigate('AddFD')}>
                <View style={styles.fdRow}>
                  <Text style={styles.fdBank}>{fd.bankShort}</Text>
                  <TypeBadge type={fd.type} />
                </View>
                <Text style={[styles.fdRate, i === 0 && { color: COLORS.success }]}>{fd.rate.toFixed(2)}%</Text>
                <Text style={styles.fdSenior}>Senior: {fd.seniorRate.toFixed(2)}%</Text>
                <Text style={styles.fdTenure}>1 Year · Min ₹{(fd.minDeposit / 1000).toFixed(0)}K</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ═══ SIP Fund NAV ═══ */}
          <SectionHeader icon="📈" title="Mutual Fund NAV" accent={COLORS.success} count={sipFunds.length} onViewAll={() => navigation?.navigate('AddSIP')} />
          <View style={styles.sipList}>
            {sipFunds.map((f, i) => (
              <TouchableOpacity key={f.schemeCode} style={styles.sipCard} activeOpacity={0.7} onPress={() => navigation?.navigate('AddSIP')}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sipName} numberOfLines={1}>{f.schemeName?.split(' - ')[0]?.substring(0, 30)}</Text>
                  <View style={styles.sipMeta}>
                    <Text style={styles.sipCategory}>{f.category}</Text>
                    <Text style={[styles.sipRisk, { color: f.risk === 'Very High' || f.risk === 'High' ? COLORS.danger : f.risk === 'Moderate' ? COLORS.gold : COLORS.success }]}>{f.risk}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.sipNav}>₹{f.nav?.toFixed(2)}</Text>
                  <Text style={styles.sipDate}>{f.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ═══ Quick Actions ═══ */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {[
              { icon: '💬', label: 'Chat', screen: 'Chat' },
              { icon: '💸', label: 'Add Expense', screen: 'AddExpense' },
              { icon: '🏦', label: 'Add FD', screen: 'AddFD' },
              { icon: '📊', label: 'Add SIP', screen: 'AddSIP' },
              { icon: '📋', label: 'Tax Advice', screen: 'TaxIntelligence' },
              { icon: '🎯', label: 'FIRE Plan', screen: 'CommandCenter' },
            ].map(a => (
              <TouchableOpacity key={a.screen} style={styles.actionCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation?.navigate(a.screen); }}>
                <Text style={styles.actionIcon}>{a.icon}</Text>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </Animated.View>

      {/* Voice Overlay — always visible */}
      <VoiceOverlay navigation={navigation} language="hi" />
    </View>
  );
}

/* ─── Sub-components ─── */
function SectionHeader({ icon, title, accent, count, onViewAll }: any) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
        <Text style={[styles.sectionLabel, { color: accent }]}>{title}</Text>
        <View style={[styles.countBadge, { borderColor: accent }]}>
          <Text style={[styles.countText, { color: accent }]}>{count}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onViewAll}>
        <Text style={[styles.viewAll, { color: accent }]}>View All →</Text>
      </TouchableOpacity>
    </View>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = { sfb: COLORS.success, psu: COLORS.accent, private: COLORS.gold };
  const labels: Record<string, string> = { sfb: 'SFB', psu: 'PSU', private: 'Private' };
  return (
    <View style={[styles.typeBadge, { borderColor: colors[type] || COLORS.gold }]}>
      <Text style={[styles.typeText, { color: colors[type] || COLORS.gold }]}>{labels[type] || type}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg_base },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 8,
  },
  headerLabel: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: COLORS.gold, fontWeight: '400' },
  headerTitle: { fontSize: 22, fontWeight: '300', color: COLORS.text_primary, letterSpacing: 0.5 },
  settingsBtn: { padding: 8 },
  updateBadge: { paddingHorizontal: 20, marginBottom: 16 },
  updateText: { fontSize: 9, color: COLORS.text_tertiary, letterSpacing: 0.5 },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: COLORS.gold, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  countBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  countText: { fontSize: 9, fontWeight: '600' },
  viewAll: { fontSize: 11, fontWeight: '500' },

  // Crypto
  horizontalScroll: { paddingLeft: 20, marginBottom: 8 },
  cryptoCard: {
    width: 150, backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.lg,
    padding: 14, marginRight: 10, borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  cryptoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cryptoImgWrap: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.gold_dim, alignItems: 'center', justifyContent: 'center' },
  cryptoRank: { fontSize: 7, color: COLORS.text_tertiary, fontWeight: '600' },
  cryptoName: { fontSize: 13, fontWeight: '600', color: COLORS.text_primary },
  cryptoSymbol: { fontSize: 9, color: COLORS.text_tertiary },
  cryptoPrice: { fontSize: 16, fontWeight: '700', color: COLORS.text_primary, marginBottom: 4 },
  changeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  changeText: { fontSize: 11, fontWeight: '600' },
  cryptoMcap: { fontSize: 9, color: COLORS.text_tertiary },

  // FD
  fdGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  fdCard: {
    width: (width - 48) / 2, backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.lg,
    padding: 14, borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  fdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  fdBank: { fontSize: 14, fontWeight: '600', color: COLORS.text_primary },
  fdRate: { fontSize: 22, fontWeight: '700', color: COLORS.gold, marginBottom: 2 },
  fdSenior: { fontSize: 10, color: COLORS.success },
  fdTenure: { fontSize: 9, color: COLORS.text_tertiary, marginTop: 4 },
  typeBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  typeText: { fontSize: 8, fontWeight: '600' },

  // SIP
  sipList: { paddingHorizontal: 20, gap: 8 },
  sipCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.md, padding: 14,
    borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  sipName: { fontSize: 13, fontWeight: '600', color: COLORS.text_primary, marginBottom: 4 },
  sipMeta: { flexDirection: 'row', gap: 8 },
  sipCategory: { fontSize: 9, color: COLORS.text_tertiary },
  sipRisk: { fontSize: 9, fontWeight: '600' },
  sipNav: { fontSize: 18, fontWeight: '700', color: COLORS.success },
  sipDate: { fontSize: 9, color: COLORS.text_tertiary },

  // Actions
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  actionCard: {
    width: (width - 48) / 3, backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.lg,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 11, fontWeight: '500', color: COLORS.text_primary, textAlign: 'center' },
});
