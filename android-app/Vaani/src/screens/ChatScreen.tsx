import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { COLORS } from '../constants';
import { SCREEN } from '../navigation/AppNavigator';
import type { ChatMessage } from '../types';
import { getFDRecommendations, getSIPRecommendations, formatRecommendationForVoice } from '../services/recommendationEngine';

const { width, height } = Dimensions.get('window');

// Example conversation
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'नमस्ते! मैं VAANI हूं, आपका वित्तीय सलाहकार। आज मैं आपकी कैसे मदद कर सकता हूं?',
    created_at: new Date().toISOString(),
  },
];

interface ChatScreenProps {
  navigation?: any;
}

export default function ChatScreen({ navigation }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        setIsRecording(true);
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.3,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    pulseAnim.stopAnimation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user's message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: 'आज मेरे खाते में कितना पैसा है?',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Simulate AI typing
    setIsTyping(true);
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'आपके खाते में कुल ₹2,45,678 हैं। इसमें FD में ₹1,50,000, SIP में ₹80,000, और बचत खाते में ₹15,678 शामिल हैं।',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      
      // Speak the response
      Speech.speak(aiMessage.content, {
        language: 'hi-IN',
        rate: 0.9,
        pitch: 1,
      });
    }, 1500);
  };

  // Check for recommendation intents
  const checkRecommendationIntent = async (text: string): Promise<string | null> => {
    const lower = text.toLowerCase();
    
    // FD recommendation patterns
    if (lower.includes('fd') && (lower.includes('suggest') || lower.includes('recommend') || lower.includes('best') || lower.includes('konsa') || lower.includes('बताओ'))) {
      const profile = { age: 30, incomeRange: 'medium' as const, investmentGoal: 'wealthBuild' as const, timeHorizon: 'medium' as const, liquidityNeed: 'medium' as const, riskAppetite: 'moderate' as const, isSenior: false };
      const result = await getFDRecommendations(profile, { limit: 3 });
      return formatRecommendationForVoice(result);
    }
    
    // SIP recommendation patterns
    if (lower.includes('sip') && (lower.includes('suggest') || lower.includes('recommend') || lower.includes('mutual fund') || lower.includes('निवेश'))) {
      const profile = { age: 30, incomeRange: 'medium' as const, investmentGoal: 'wealthBuild' as const, timeHorizon: 'long' as const, liquidityNeed: 'low' as const, riskAppetite: 'moderate' as const, isSenior: false };
      const result = await getSIPRecommendations(profile, { limit: 3 });
      return formatRecommendationForVoice(result);
    }
    
    return null;
  };

  const handleAIMessage = async (userText: string) => {
    setIsTyping(true);
    
    // Check for recommendation intent first
    const recommendationResponse = await checkRecommendationIntent(userText);
    
    if (recommendationResponse) {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: recommendationResponse,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      Speech.speak(recommendationResponse, { language: 'hi-IN', rate: 0.9 });
      return;
    }
    
    // Default responses
    setTimeout(() => {
      const responses = [
        'मैं समझ गया। आपके खर्चों का विश्लेषण करके बता रहा हूं।',
        'आपका बजट इस महीने 80% खर्च हो चुका है। बाकी 20% में सावधानी से खर्च करें।',
        'FD के बारे में और जानकारी चाहिए? मैं बता सकता हूं।',
        'SIP के बारे में बताइए, मैं आपको सही फंड सुझा सकता हूं।',
      ];
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      Speech.speak(aiMessage.content, { language: 'hi-IN', rate: 0.9 });
    }, 1200);
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    handleAIMessage(inputText);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageContainer, item.role === 'user' && styles.userMessageContainer]}>
      <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, item.role === 'user' && styles.userMessageText]}>
          {item.content}
        </Text>
      </View>
      <Text style={styles.messageTime}>
        {new Date(item.created_at).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backButton}>← वापस</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>VAANI AI</Text>
          <Text style={styles.headerSubtitle}>आपका वित्तीय सलाहकार</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.menuButton}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingDots}>
            {[0, 1, 2].map(i => (
              <Animated.View key={i} style={styles.typingDot} />
            ))}
          </View>
          <Text style={styles.typingText}>VAANI टाइप कर रहा है...</Text>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputArea}>
        {/* Voice Button */}
        <TouchableOpacity
          style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={styles.voiceButtonIcon}>
              {isRecording ? '⏹️' : '🎤'}
            </Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder="अपना संदेश लिखें..."
          placeholderTextColor={COLORS.text_tertiary}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
          multiline
        />

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonIcon}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Voice hint */}
      <Text style={styles.voiceHint}>🎤 दबाए रखें बोलने के लिए</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg_base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    backgroundColor: COLORS.bg_surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_subtle,
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text_primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.text_secondary,
  },
  menuButton: {
    fontSize: 24,
    color: COLORS.text_primary,
  },
  messagesList: {
    padding: 20,
    paddingBottom: 100,
  },
  messageContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
  },
  aiBubble: {
    backgroundColor: COLORS.bg_surface,
    borderBottomLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text_primary,
    lineHeight: 22,
  },
  userMessageText: {
    color: COLORS.text_primary,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.text_tertiary,
    marginTop: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.text_tertiary,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.text_tertiary,
  },
  inputArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: COLORS.bg_surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border_subtle,
    paddingBottom: Platform.OS === 'ios' ? 35 : 15,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary_muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  voiceButtonRecording: {
    backgroundColor: COLORS.danger,
  },
  voiceButtonIcon: {
    fontSize: 22,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.bg_elevated,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text_primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.bg_elevated,
  },
  sendButtonIcon: {
    fontSize: 22,
    color: COLORS.text_primary,
    fontWeight: '700',
  },
  voiceHint: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    alignSelf: 'center',
    fontSize: 12,
    color: COLORS.text_tertiary,
  },
});
