import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Platform, ScrollView, Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS } from '../constants';
import { SCREEN } from '../navigation/AppNavigator';
import { SUPPORTED_LANGUAGES } from '../types';

const { width } = Dimensions.get('window');

// State-to-language mapping (Indian states → likely local language)
const STATE_LANG_MAP: Record<string, string> = {
  'maharashtra': 'mr', 'delhi': 'hi', 'uttar pradesh': 'hi', 'bihar': 'hi',
  'madhya pradesh': 'hi', 'rajasthan': 'hi', 'chhattisgarh': 'hi', 'jharkhand': 'hi',
  'west bengal': 'bn', 'bengal': 'bn', 'kolkata': 'bn',
  'tamil nadu': 'ta', 'chennai': 'ta',
  'telangana': 'te', 'andhra pradesh': 'te', 'hyderabad': 'te',
  'karnataka': 'kn', 'bangalore': 'kn', 'bengaluru': 'kn',
  'kerala': 'ml',
  'gujarat': 'gu', 'ahmedabad': 'gu',
  'punjab': 'pa', 'chandigarh': 'pa',
  'odisha': 'or', 'orissa': 'or',
  'assam': 'as', 'guwahati': 'as',
  'manipur': 'mni',
};

// Audio file paths (pre-generated via ElevenLabs)
const AUDIO = {
  location_hi: '/audio/onboarding/location_detected_hi.mp3',
  location_en: '/audio/onboarding/location_detected_en.mp3',
  language_hi: '/audio/onboarding/choose_language_hi.mp3',
  language_en: '/audio/onboarding/choose_language_en.mp3',
  mic_hi: '/audio/onboarding/mic_permission_hi.mp3',
  mic_en: '/audio/onboarding/mic_permission_en.mp3',
  accessibility_hi: '/audio/onboarding/accessibility_hi.mp3',
  accessibility_en: '/audio/onboarding/accessibility_en.mp3',
  complete_hi: '/audio/onboarding/setup_complete_hi.mp3',
  complete_en: '/audio/onboarding/setup_complete_en.mp3',
  visual_hi: '/audio/onboarding/option_visual_hi.mp3',
  hearing_hi: '/audio/onboarding/option_hearing_hi.mp3',
  illiterate_hi: '/audio/onboarding/option_illiterate_hi.mp3',
  none_hi: '/audio/onboarding/option_none_hi.mp3',
};

type Step = 'location' | 'language' | 'mic' | 'accessibility' | 'complete';
type AccessibilityMode = 'none' | 'visual' | 'hearing' | 'illiterate' | 'motor';

const STEPS: Step[] = ['location', 'language', 'mic', 'accessibility', 'complete'];

export default function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('location');
  const [detectedCity, setDetectedCity] = useState('');
  const [detectedState, setDetectedState] = useState('');
  const [suggestedLang, setSuggestedLang] = useState('hi');
  const [selectedLang, setSelectedLang] = useState('hi');
  const [accessibilityMode, setAccessibilityMode] = useState<AccessibilityMode>('none');
  const [locationLoading, setLocationLoading] = useState(true);
  const [micGranted, setMicGranted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  const stepIndex = STEPS.indexOf(step);

  // Animate step transitions
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [step]);

  // Step 1: Detect location on mount
  useEffect(() => {
    detectLocation();
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  async function playAudio(uri: string) {
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      // For bundled assets on device, use require or Asset
      // For web URLs, use createAsync directly
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0 }
      );
      soundRef.current = sound;
    } catch (e) {
      console.log('[Onboarding] Audio play error:', e);
    }
  }

  async function detectLocation() {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationLoading(false);
        setSuggestedLang('hi');
        setStep('language');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geo) {
        const city = geo.city || geo.subregion || '';
        const state = (geo.region || '').toLowerCase();
        setDetectedCity(city);
        setDetectedState(geo.region || '');

        // Map state to language
        const matchedLang = Object.entries(STATE_LANG_MAP).find(([key]) => state.includes(key));
        if (matchedLang) setSuggestedLang(matchedLang[1]);
        else setSuggestedLang('hi');
      }
    } catch (e) {
      console.log('[Onboarding] Location error:', e);
      setSuggestedLang('hi');
    }
    setLocationLoading(false);
    // Play location detected audio
    playAudio(AUDIO.location_hi);
  }

  function goNext() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      const next = STEPS[idx + 1];
      setStep(next);
      // Play audio for next step
      if (next === 'language') playAudio(AUDIO.language_hi);
      else if (next === 'mic') playAudio(AUDIO.mic_hi);
      else if (next === 'accessibility') playAudio(AUDIO.accessibility_hi);
      else if (next === 'complete') playAudio(AUDIO.complete_hi);
    } else {
      finishOnboarding();
    }
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }

  function goBack() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  async function requestMic() {
    const { status } = await Audio.requestPermissionsAsync();
    setMicGranted(status === 'granted');
    if (status === 'granted') {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      goNext();
    } else {
      Alert.alert('Mic Required', 'VAANI needs microphone access for voice commands');
    }
  }

  function finishOnboarding() {
    // Save settings to async storage / Supabase
    const settings = {
      language: selectedLang,
      accessibility: accessibilityMode,
      location: { city: detectedCity, state: detectedState },
      onboarded: true,
    };
    console.log('[Onboarding] Complete:', settings);
    navigation.replace('Auth');
  }

  const langName = SUPPORTED_LANGUAGES.find(l => l.code === suggestedLang)?.nativeName || 'हिन्दी';

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
        ))}
      </View>

      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Auth')}>
        <Text style={styles.skipText}>Skip →</Text>
      </TouchableOpacity>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* ═══ STEP: Location ═══ */}
        {step === 'location' && (
          <View style={styles.stepCenter}>
            <View style={styles.iconCircle}><Text style={styles.iconEmoji}>📍</Text></View>
            {locationLoading ? (
              <>
                <Text style={styles.title}>Detecting Location...</Text>
                <Text style={styles.subtitle}>लोकेशन पता लगा रहे हैं</Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>{detectedCity || 'India'}</Text>
                <Text style={styles.subtitle}>{detectedState}</Text>
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>
                    क्या आप {detectedCity || 'यहाँ'} से हैं?{'\n'}
                    <Text style={styles.confirmEn}>Are you from {detectedCity || 'here'}?</Text>
                  </Text>
                  <Text style={styles.confirmLang}>
                    Suggested: <Text style={{ color: COLORS.gold, fontWeight: '600' }}>{langName}</Text>
                  </Text>
                </View>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.btnYes} onPress={() => { setSelectedLang(suggestedLang); goNext(); }}>
                    <Text style={styles.btnYesText}>हां, Yes ✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnNo} onPress={goNext}>
                    <Text style={styles.btnNoText}>नहीं, Choose</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* ═══ STEP: Language ═══ */}
        {step === 'language' && (
          <View style={styles.stepCenter}>
            <View style={styles.iconCircle}><Text style={styles.iconEmoji}>🌍</Text></View>
            <Text style={styles.title}>भाषा चुनें</Text>
            <Text style={styles.subtitle}>Choose Language or Just Speak</Text>
            <Text style={styles.hint}>बस अपनी भाषा में कुछ बोलिए — या नीचे से चुनिए</Text>

            <ScrollView style={styles.langScroll} contentContainerStyle={styles.langGrid}>
              {SUPPORTED_LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langCard, selectedLang === lang.code && styles.langCardActive]}
                  onPress={() => setSelectedLang(lang.code)}
                >
                  <Text style={styles.langNative}>{lang.nativeName}</Text>
                  <Text style={styles.langEn}>{lang.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ═══ STEP: Mic Permission ═══ */}
        {step === 'mic' && (
          <View style={styles.stepCenter}>
            <View style={styles.iconCircle}><Text style={styles.iconEmoji}>🎤</Text></View>
            <Text style={styles.title}>माइक एक्सेस</Text>
            <Text style={styles.subtitle}>Microphone Permission</Text>
            <Text style={styles.hint}>VAANI को आपकी आवाज़ सुनने के लिए माइक चाहिए</Text>
            <TouchableOpacity style={styles.micBtn} onPress={requestMic}>
              <Text style={styles.micBtnIcon}>🎤</Text>
              <Text style={styles.micBtnText}>{micGranted ? 'Granted ✓' : 'Allow Microphone'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══ STEP: Accessibility ═══ */}
        {step === 'accessibility' && (
          <View style={styles.stepCenter}>
            <View style={styles.iconCircle}><Text style={styles.iconEmoji}>♿</Text></View>
            <Text style={styles.title}>खास मदद चाहिए?</Text>
            <Text style={styles.subtitle}>Do you need special assistance?</Text>
            <Text style={styles.hint}>बोलिए या नीचे से चुनिए</Text>

            <View style={styles.accessGrid}>
              {([
                { mode: 'visual' as AccessibilityMode, icon: '👁️', hi: 'आंखें कमज़ोर', en: 'Low Vision', desc: 'Big text + Voice' },
                { mode: 'hearing' as AccessibilityMode, icon: '👂', hi: 'सुनने में दिक्कत', en: 'Hard of Hearing', desc: 'Large text + Vibration' },
                { mode: 'illiterate' as AccessibilityMode, icon: '🗣️', hi: 'पढ़ना मुश्किल', en: 'Cannot Read', desc: 'Full voice mode' },
                { mode: 'motor' as AccessibilityMode, icon: '🤚', hi: 'हाथों से दिक्कत', en: 'Motor Difficulty', desc: 'Voice-only controls' },
                { mode: 'none' as AccessibilityMode, icon: '✅', hi: 'कोई ज़रूरत नहीं', en: 'No Need', desc: 'Standard mode' },
              ]).map(opt => (
                <TouchableOpacity
                  key={opt.mode}
                  style={[styles.accessCard, accessibilityMode === opt.mode && styles.accessCardActive]}
                  onPress={() => {
                    setAccessibilityMode(opt.mode);
                    if (opt.mode === 'visual') playAudio(AUDIO.visual_hi);
                    else if (opt.mode === 'hearing') playAudio(AUDIO.hearing_hi);
                    else if (opt.mode === 'illiterate') playAudio(AUDIO.illiterate_hi);
                    else if (opt.mode === 'none') playAudio(AUDIO.none_hi);
                  }}
                >
                  <Text style={styles.accessIcon}>{opt.icon}</Text>
                  <Text style={styles.accessHi}>{opt.hi}</Text>
                  <Text style={styles.accessEn}>{opt.en}</Text>
                  <Text style={styles.accessDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ═══ STEP: Complete ═══ */}
        {step === 'complete' && (
          <View style={styles.stepCenter}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.gold_dim }]}>
              <Text style={styles.iconEmoji}>🎉</Text>
            </View>
            <Text style={styles.title}>तैयार हैं!</Text>
            <Text style={styles.subtitle}>You are all set!</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Language</Text>
              <Text style={styles.summaryValue}>{SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.nativeName || selectedLang}</Text>
              <Text style={styles.summaryLabel}>Location</Text>
              <Text style={styles.summaryValue}>{detectedCity || 'India'}, {detectedState}</Text>
              <Text style={styles.summaryLabel}>Accessibility</Text>
              <Text style={styles.summaryValue}>{accessibilityMode === 'none' ? 'Standard' : accessibilityMode}</Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Nav buttons */}
      <View style={styles.navRow}>
        {stepIndex > 0 && step !== 'location' && (
          <TouchableOpacity style={styles.navBack} onPress={goBack}>
            <Text style={styles.navBackText}>← Back</Text>
          </TouchableOpacity>
        )}
        {step !== 'location' && step !== 'mic' && (
          <TouchableOpacity style={[styles.navNext, stepIndex === 0 && { flex: 1 }]} onPress={goNext}>
            <Text style={styles.navNextText}>
              {step === 'complete' ? 'Start VAANI →' : 'Next →'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg_base },
  progressRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    marginTop: Platform.OS === 'ios' ? 60 : 40,
  },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border_subtle },
  progressDotActive: { backgroundColor: COLORS.gold, width: 24 },
  skipBtn: { position: 'absolute', right: 20, top: Platform.OS === 'ios' ? 60 : 40, padding: 10 },
  skipText: { color: COLORS.text_tertiary, fontSize: 14 },
  content: { flex: 1, paddingHorizontal: 24 },
  stepCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.gold_dim, borderWidth: 1, borderColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  iconEmoji: { fontSize: 44 },
  title: { fontSize: 28, fontWeight: '300', color: COLORS.text_primary, letterSpacing: 1, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.text_secondary, marginTop: 4, textAlign: 'center' },
  hint: { fontSize: 12, color: COLORS.text_tertiary, marginTop: 12, textAlign: 'center', paddingHorizontal: 30 },

  // Location
  confirmBox: {
    marginTop: 24, padding: 20, backgroundColor: COLORS.bg_surface,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border_subtle, width: '100%',
  },
  confirmText: { fontSize: 16, color: COLORS.text_primary, textAlign: 'center', lineHeight: 24 },
  confirmEn: { fontSize: 13, color: COLORS.text_secondary },
  confirmLang: { fontSize: 13, color: COLORS.text_secondary, textAlign: 'center', marginTop: 12 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
  btnYes: {
    flex: 1, paddingVertical: 16, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gold, alignItems: 'center',
  },
  btnYesText: { fontSize: 16, fontWeight: '600', color: COLORS.text_inverse },
  btnNo: {
    flex: 1, paddingVertical: 16, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bg_surface, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.gold_dim,
  },
  btnNoText: { fontSize: 16, fontWeight: '500', color: COLORS.text_primary },

  // Language
  langScroll: { maxHeight: 300, marginTop: 16, width: '100%' },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  langCard: {
    width: (width - 80) / 3, paddingVertical: 14, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg_surface, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  langCardActive: { borderColor: COLORS.gold, backgroundColor: COLORS.gold_dim },
  langNative: { fontSize: 16, fontWeight: '600', color: COLORS.text_primary },
  langEn: { fontSize: 10, color: COLORS.text_tertiary, marginTop: 2 },

  // Mic
  micBtn: {
    marginTop: 30, width: 160, height: 160, borderRadius: 80,
    backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 15,
  },
  micBtnIcon: { fontSize: 50 },
  micBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.text_inverse, marginTop: 8 },

  // Accessibility
  accessGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 20 },
  accessCard: {
    width: (width - 80) / 2, paddingVertical: 18, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bg_surface, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  accessCardActive: { borderColor: COLORS.gold, backgroundColor: COLORS.gold_dim },
  accessIcon: { fontSize: 28, marginBottom: 6 },
  accessHi: { fontSize: 14, fontWeight: '600', color: COLORS.text_primary },
  accessEn: { fontSize: 11, color: COLORS.text_secondary, marginTop: 2 },
  accessDesc: { fontSize: 9, color: COLORS.text_tertiary, marginTop: 4 },

  // Summary
  summaryBox: {
    marginTop: 24, padding: 20, backgroundColor: COLORS.bg_surface,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.gold_dim, width: '100%',
  },
  summaryLabel: { fontSize: 10, color: COLORS.gold, letterSpacing: 1, textTransform: 'uppercase', marginTop: 12 },
  summaryValue: { fontSize: 16, color: COLORS.text_primary, fontWeight: '500' },

  // Nav
  navRow: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  navBack: {
    flex: 1, paddingVertical: 16, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bg_surface, alignItems: 'center',
  },
  navBackText: { fontSize: 16, fontWeight: '500', color: COLORS.text_primary },
  navNext: {
    flex: 2, paddingVertical: 16, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gold, alignItems: 'center',
  },
  navNextText: { fontSize: 16, fontWeight: '600', color: COLORS.text_inverse },
});
