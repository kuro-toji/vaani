// ═══════════════════════════════════════════════════════════════════
// VAANI Voice Overlay — Tap-anywhere floating mic for accessibility
// Always visible, records voice → processes command → navigates/speaks
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Platform, Modal,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../constants';
import { transcribeAudio } from '../services/sttService';
import { processVoiceCommand, speak, stopSpeaking, tapFeedback, successFeedback, errorFeedback } from '../services/voiceNavService';

const { width } = Dimensions.get('window');

interface VoiceOverlayProps {
  navigation: any;
  language?: string;
  accessibilityMode?: string;
}

export default function VoiceOverlay({ navigation, language = 'hi', accessibilityMode = 'none' }: VoiceOverlayProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [showModal, setShowModal] = useState(false);
  const recording = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Larger button for visually impaired
  const isLargeMode = accessibilityMode === 'visual' || accessibilityMode === 'illiterate';
  const btnSize = isLargeMode ? 80 : 64;

  useEffect(() => {
    // Continuous glow animation for visibility
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const startListening = async () => {
    tapFeedback();
    setTranscript('');
    setResponse('');

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.current = rec;
      setIsListening(true);
      setShowModal(true);

      // Pulse animation while recording
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();

      // Auto-stop after 8 seconds
      setTimeout(() => {
        if (recording.current) stopListening();
      }, 8000);
    } catch (e) {
      console.error('[VoiceOverlay] Record error:', e);
      errorFeedback();
      speak(language === 'en' ? 'Could not start recording. Please check microphone.' : 'माइक शुरू नहीं हो पा रहा। कृपया माइक चेक करें।', language);
    }
  };

  const stopListening = async () => {
    pulseAnim.stopAnimation();
    setIsListening(false);

    if (!recording.current) return;

    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;

      if (!uri) return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      // Transcribe
      setTranscript('सुन रही हूं...');
      const result = await transcribeAudio(uri, language);

      if (!result || !result.text) {
        setTranscript('');
        setResponse(language === 'en' ? 'Could not understand. Try again.' : 'समझ नहीं आया, फिर से बोलिए।');
        speak(language === 'en' ? 'Sorry, I could not understand. Please try again.' : 'माफ़ कीजिए, समझ नहीं आया। फिर से बोलिए।', language);
        errorFeedback();
        setTimeout(() => setShowModal(false), 3000);
        return;
      }

      setTranscript(result.text);

      // Process the command
      const navResult = processVoiceCommand(result.text, language);
      setResponse(navResult.spoken);
      speak(navResult.spoken, language);
      successFeedback();

      // Navigate after speaking
      setTimeout(() => {
        setShowModal(false);
        if (navResult.screen) {
          navigation.navigate(navResult.screen);
        }
      }, 2500);

      // Cleanup audio file
      try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}
    } catch (e) {
      console.error('[VoiceOverlay] Stop error:', e);
      setShowModal(false);
    }
  };

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(201,168,76,0.2)', 'rgba(201,168,76,0.5)'],
  });

  return (
    <>
      {/* Floating Mic Button */}
      <Animated.View style={[styles.fabContainer, { bottom: isLargeMode ? 100 : 90 }]}>
        <Animated.View style={[styles.fabGlow, { backgroundColor: glowColor, width: btnSize + 20, height: btnSize + 20, borderRadius: (btnSize + 20) / 2 }]} />
        <TouchableOpacity
          style={[styles.fab, { width: btnSize, height: btnSize, borderRadius: btnSize / 2 }]}
          onPress={isListening ? stopListening : startListening}
          activeOpacity={0.7}
          accessibilityLabel={language === 'en' ? 'Tap to speak to VAANI' : 'VAANI से बात करने के लिए टैप करें'}
          accessibilityHint={language === 'en' ? 'Double tap to start voice recording' : 'डबल टैप करें वॉइस रिकॉर्डिंग शुरू करने के लिए'}
          accessibilityRole="button"
          accessibilityState={{ expanded: isListening, disabled: false }}
        >
          <Text style={[styles.fabIcon, isLargeMode && { fontSize: 32 }]}>{isListening ? '⏹️' : '🎤'}</Text>
          {isLargeMode && (
            <Text style={styles.accessibilityLabel}>
              {isListening ? (language === 'en' ? 'Recording' : 'रिकॉर्डिंग') : (language === 'en' ? 'Voice' : 'आवाज़')}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Voice Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => { stopSpeaking(); setShowModal(false); }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={isListening ? stopListening : () => setShowModal(false)}>
          <View style={styles.modalContent}>
            {/* Animated Orb */}
            <Animated.View style={[styles.orb, { transform: [{ scale: isListening ? pulseAnim : 1 }] }]}>
              <Text style={styles.orbIcon}>{isListening ? '🎤' : '🗣️'}</Text>
            </Animated.View>

            {/* Status */}
            <Text style={styles.statusText}>
              {isListening ? (language === 'en' ? 'Listening...' : 'सुन रही हूं...') : (language === 'en' ? 'Processing...' : 'समझ रही हूं...')}
            </Text>

            {/* Transcript */}
            {transcript ? (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>{language === 'en' ? 'You said:' : 'आपने बोला:'}</Text>
                <Text style={styles.transcriptText}>{transcript}</Text>
              </View>
            ) : null}

            {/* Response */}
            {response ? (
              <View style={styles.responseBox}>
                <Text style={styles.responseLabel}>VAANI:</Text>
                <Text style={styles.responseText}>{response}</Text>
              </View>
            ) : null}

            {/* Hint */}
            <Text style={styles.hint}>
              {isListening
                ? (language === 'en' ? 'Tap to stop' : 'रोकने के लिए टैप करें')
                : (language === 'en' ? 'Tap to close' : 'बंद करने के लिए टैप करें')}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute', right: 20, zIndex: 999, alignItems: 'center', justifyContent: 'center',
  },
  fabGlow: {
    position: 'absolute',
  },
  fab: {
    backgroundColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
  },
  fabIcon: { fontSize: 26 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalContent: {
    width: width * 0.85, backgroundColor: COLORS.bg_surface,
    borderRadius: 24, padding: 32, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.gold_dim,
  },
  orb: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 20,
  },
  orbIcon: { fontSize: 40 },
  statusText: {
    fontSize: 18, fontWeight: '300', color: COLORS.text_primary,
    marginBottom: 20, letterSpacing: 1,
  },
  transcriptBox: {
    width: '100%', backgroundColor: COLORS.bg_base, borderRadius: 12,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border_subtle,
  },
  transcriptLabel: { fontSize: 10, color: COLORS.text_tertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  transcriptText: { fontSize: 16, color: COLORS.text_primary, lineHeight: 22 },
  responseBox: {
    width: '100%', backgroundColor: 'rgba(201,168,76,0.08)', borderRadius: 12,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.gold_dim,
  },
  responseLabel: { fontSize: 10, color: COLORS.gold, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  responseText: { fontSize: 16, color: COLORS.text_primary, lineHeight: 22 },
  hint: { fontSize: 12, color: COLORS.text_tertiary, marginTop: 8 },
  accessibilityLabel: {
    fontSize: 10, color: COLORS.text_inverse, marginTop: 4, textAlign: 'center', fontWeight: '600',
  },
});
