import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants';
import { SCREEN } from '../navigation/AppNavigator';

interface AuthScreenProps {
  navigation: any;
}

export default function AuthScreen({ navigation }: AuthScreenProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'loading'>('phone');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    // Simulate OTP send - replace with actual Supabase call
    setTimeout(async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep('otp');
        setTimer(30);
        setLoading(false);
        
        // Start countdown
        const interval = setInterval(() => {
          setTimer((t) => {
            if (t <= 1) {
              clearInterval(interval);
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      } catch (error) {
        setLoading(false);
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    }, 1500);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    // Simulate verification - replace with actual Supabase call
    setTimeout(async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('Onboarding');
      } catch (error) {
        setLoading(false);
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    }, 1500);
  };

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setPhone(cleaned);
    }
  };

  const formatOtp = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 6) {
      setOtp(cleaned);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { opacity: fadeAnim }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🎙️</Text>
          </View>
          <Text style={styles.logoTitle}>VAANI</Text>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>
          {step === 'phone' ? 'अपना फ़ोन नंबर दें' : 'OTP भेजा गया'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'phone'
            ? "India's Voice-First Financial Advisor"
            : `+91 ${phone} पर 6-अंकों का OTP`}
        </Text>

        {/* Input Section */}
        <View style={styles.inputContainer}>
          {step === 'phone' ? (
            <>
              {/* Country code */}
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>

              {/* Phone input */}
              <TextInput
                style={styles.phoneInput}
                placeholder="9876543210"
                placeholderTextColor={COLORS.text_tertiary}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={formatPhone}
              />
            </>
          ) : (
            <>
              {/* OTP inputs */}
              <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.otpBox,
                      otp.length === i && styles.otpBoxActive,
                    ]}
                  >
                    <Text style={styles.otpDigit}>
                      {otp[i] ? '●' : ''}
                    </Text>
                  </View>
                ))}
              </View>
              <TextInput
                style={styles.otpHiddenInput}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={formatOtp}
                autoFocus
              />
            </>
          )}
        </View>

        {/* Timer */}
        {step === 'otp' && timer > 0 && (
          <Text style={styles.timerText}>
            {timer} सेकंड में दोबारा भेजें
          </Text>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            loading && styles.actionButtonLoading,
          ]}
          onPress={step === 'phone' ? handleSendOtp : handleVerifyOtp}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.text_primary} />
          ) : (
            <Text style={styles.actionButtonText}>
              {step === 'phone' ? 'OTP भेजें →' : 'OTP सत्यापित करें →'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend OTP */}
        {step === 'otp' && timer === 0 && (
          <TouchableOpacity onPress={handleSendOtp}>
            <Text style={styles.resendText}>OTP दोबारा भेजें</Text>
          </TouchableOpacity>
        )}

        {/* Terms */}
        <Text style={styles.terms}>
          जारी रखकर, आप हमारी{' '}
          <Text style={styles.termsLink}>सेवा की शर्तें</Text>
          {' '}और{' '}
          <Text style={styles.termsLink}>गोपनीयता नीति</Text> से सहमत होते हैं
        </Text>
      </View>

      {/* Language toggle */}
      <TouchableOpacity style={styles.langToggle}>
        <Text style={styles.langText}>हिंदी | English</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg_base,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gold_muted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  logoEmoji: {
    fontSize: 36,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text_primary,
    marginTop: 15,
    letterSpacing: 3,
  },
  title: {
    fontSize: SCREEN.isSmall ? 22 : 26,
    fontWeight: '700',
    color: COLORS.text_primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.text_secondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  countryCode: {
    backgroundColor: COLORS.bg_surface,
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderRadius: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.border_subtle,
    marginRight: 10,
  },
  countryCodeText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text_primary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.bg_surface,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: COLORS.text_primary,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  otpBox: {
    width: 45,
    height: 55,
    borderRadius: 12,
    backgroundColor: COLORS.bg_surface,
    borderWidth: 2,
    borderColor: COLORS.border_subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: COLORS.gold,
  },
  otpDigit: {
    fontSize: 24,
    color: COLORS.text_primary,
  },
  otpHiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: 0,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.text_tertiary,
    marginBottom: 20,
  },
  actionButton: {
    width: '100%',
    backgroundColor: COLORS.gold,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonLoading: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  resendText: {
    fontSize: 15,
    color: COLORS.gold,
    fontWeight: '600',
    marginTop: 20,
  },
  terms: {
    fontSize: 12,
    color: COLORS.text_tertiary,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.text_secondary,
    textDecorationLine: 'underline',
  },
  langToggle: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    alignSelf: 'center',
    padding: 10,
  },
  langText: {
    fontSize: 14,
    color: COLORS.text_secondary,
  },
});
