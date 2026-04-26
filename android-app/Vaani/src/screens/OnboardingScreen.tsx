import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS, SUPPORTED_LANGUAGES } from '../constants';
import { SCREEN } from '../navigation/AppNavigator';

interface OnboardingScreenProps {
  navigation: any;
}

const { width, height } = Dimensions.get('window');

// Onboarding steps for accessibility setup
const STEPS = [
  {
    id: 'mic',
    title: 'माइक टेस्ट',
    titleEn: 'Microphone Test',
    description: 'Hold to record and say "Namaste"',
    descriptionEn: 'Hold to record and say "Namaste"',
    icon: '🎤',
    action: 'record',
  },
  {
    id: 'language',
    title: 'भाषा चुनें',
    titleEn: 'Choose Language',
    description: 'Select your preferred language',
    descriptionEn: 'Select your preferred language',
    icon: '🌍',
    action: 'language',
  },
  {
    id: 'volume',
    title: 'वॉल्यूम सेटिंग',
    titleEn: 'Volume Calibration',
    description: 'Say "Namaste" to set threshold',
    descriptionEn: 'Say "Namaste" to set threshold',
    icon: '🔊',
    action: 'calibrate',
  },
  {
    id: 'haptic',
    title: 'हैप्टिक फीडबैक',
    titleEn: 'Haptic Feedback',
    description: 'Enable vibration feedback',
    descriptionEn: 'Enable vibration feedback',
    icon: '📳',
    action: 'haptic',
  },
  {
    id: 'visual',
    title: 'विज़ुअल मोड',
    titleEn: 'Visual Mode',
    description: 'Choose display preference',
    descriptionEn: 'Choose display preference',
    icon: '👁️',
    action: 'visual',
  },
];

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [visualMode, setVisualMode] = useState<'normal' | 'large_text' | 'traffic_light'>('normal');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const step = STEPS[currentStep];

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      Animated.spring(slideAnim, {
        toValue: -(width * (currentStep + 1)),
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
      setCurrentStep(currentStep + 1);
    } else {
      navigation.replace('Auth');
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      Animated.spring(slideAnim, {
        toValue: -(width * (currentStep - 1)),
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start();
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepAction = () => {
    // Handle different step actions
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const VisualModeCard = ({ mode, label, labelEn, icon }: any) => (
    <TouchableOpacity
      style={[
        styles.visualCard,
        visualMode === mode && styles.visualCardSelected,
      ]}
      onPress={() => setVisualMode(mode)}
      activeOpacity={0.7}
    >
      <Text style={styles.visualIcon}>{icon}</Text>
      <Text style={styles.visualLabel}>{label}</Text>
      <Text style={styles.visualLabelEn}>{labelEn}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progressContainer}>
        {STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.replace('Auth')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Main content */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={{ width: width * STEPS.length }}
      >
        <Animated.View
          style={[
            styles.stepContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.stepIcon}>{step.icon}</Text>
          </View>

          {/* Title */}
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepTitleEn}>{step.titleEn}</Text>

          {/* Description */}
          <Text style={styles.stepDescription}>{step.description}</Text>

          {/* Step-specific content */}
          {step.id === 'mic' && (
            <TouchableOpacity
              style={[styles.micButton, { transform: [{ scale: scaleAnim }] }]}
              onPressIn={handleStepAction}
              onPressOut={() => goNext()}
            >
              <Text style={styles.micIcon}>🎤</Text>
              <Text style={styles.micText}>Hold to Speak</Text>
            </TouchableOpacity>
          )}

          {step.id === 'language' && (
            <View style={styles.languageGrid}>
              {SUPPORTED_LANGUAGES.slice(0, 8).map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageCard,
                    selectedLanguage === lang.code && styles.languageCardSelected,
                  ]}
                  onPress={() => setSelectedLanguage(lang.code)}
                >
                  <Text style={styles.languageName}>{lang.nativeName}</Text>
                  <Text style={styles.languageCode}>{lang.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {step.id === 'volume' && (
            <View style={styles.calibrateContainer}>
              <TouchableOpacity
                style={styles.calibrateButton}
                onPress={() => goNext()}
              >
                <Text style={styles.calibrateIcon}>🔊</Text>
                <Text style={styles.calibrateText}>Tap & Say "Namaste"</Text>
              </TouchableOpacity>
            </View>
          )}

          {step.id === 'haptic' && (
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, hapticEnabled && styles.toggleButtonActive]}
                onPress={() => setHapticEnabled(!hapticEnabled)}
              >
                <View style={[styles.toggleThumb, hapticEnabled && styles.toggleThumbActive]} />
              </TouchableOpacity>
              <Text style={styles.toggleLabel}>
                {hapticEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          )}

          {step.id === 'visual' && (
            <View style={styles.visualGrid}>
              <VisualModeCard
                mode="normal"
                label="सामान्य"
                labelEn="Normal"
                icon="📱"
              />
              <VisualModeCard
                mode="large_text"
                label="बड़ा टेक्स्ट"
                labelEn="Large Text"
                icon="🔤"
              />
              <VisualModeCard
                mode="traffic_light"
                label="ट्रैफ़िक लाइट"
                labelEn="Traffic Light"
                icon="🚦"
              />
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navButtons}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, currentStep === 0 && styles.nextButtonFull]}
          onPress={goNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === STEPS.length - 1 ? 'Get Started →' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg_base,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border_subtle,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 60 : 40,
    padding: 10,
  },
  skipText: {
    color: COLORS.text_secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  stepContainer: {
    width: SCREEN.width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary_muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stepIcon: {
    fontSize: 50,
  },
  stepTitle: {
    fontSize: SCREEN.isSmall ? 24 : 28,
    fontWeight: '700',
    color: COLORS.text_primary,
    textAlign: 'center',
  },
  stepTitleEn: {
    fontSize: 18,
    color: COLORS.text_secondary,
    textAlign: 'center',
    marginTop: 5,
  },
  stepDescription: {
    fontSize: 16,
    color: COLORS.text_secondary,
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
  },
  micButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  micIcon: {
    fontSize: 50,
  },
  micText: {
    color: COLORS.text_primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 30,
    gap: 10,
    maxWidth: SCREEN.width - 60,
  },
  languageCard: {
    width: (SCREEN.width - 80) / 2,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.bg_surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
  },
  languageCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary_muted,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  languageCode: {
    fontSize: 12,
    color: COLORS.text_secondary,
    marginTop: 4,
  },
  calibrateContainer: {
    marginTop: 30,
  },
  calibrateButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.accent_muted,
    borderWidth: 3,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calibrateIcon: {
    fontSize: 60,
  },
  calibrateText: {
    color: COLORS.text_primary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  toggleContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  toggleButton: {
    width: 80,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bg_elevated,
    padding: 4,
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.text_secondary,
  },
  toggleThumbActive: {
    backgroundColor: COLORS.text_primary,
    alignSelf: 'flex-end',
  },
  toggleLabel: {
    color: COLORS.text_secondary,
    fontSize: 16,
    marginTop: 15,
  },
  visualGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    gap: 15,
  },
  visualCard: {
    width: (SCREEN.width - 90) / 3,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: COLORS.bg_surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
  },
  visualCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary_muted,
  },
  visualIcon: {
    fontSize: 30,
  },
  visualLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text_primary,
    marginTop: 8,
  },
  visualLabelEn: {
    fontSize: 10,
    color: COLORS.text_secondary,
    marginTop: 2,
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    gap: 15,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.bg_surface,
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.text_primary,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    color: COLORS.text_primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
