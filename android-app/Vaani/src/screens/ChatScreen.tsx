import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import * as SpeechRecognition from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../constants';
import { SCREEN } from '../navigation/AppNavigator';
import type { ChatMessage } from '../types';
import { sendChatMessage, handleFeatureIntent } from '../services/chatService';
import { matchCommand, extractEntities } from '../services/voiceCommandService';
import * as moneyService from '../services/moneyManagementService';
import * as idleMoneyService from '../services/idleMoneyService';
import * as taxIntelService from '../services/taxIntelligenceService';
import * as freelancerService from '../services/freelancerService';
import * as commandCenterService from '../services/commandCenterService';
import * as spendAwarenessService from '../services/spendAwarenessService';
import * as creditIntelService from '../services/creditIntelligenceService';

const { width, height } = Dimensions.get('window');

interface ChatScreenProps {
  navigation?: any;
}

export default function ChatScreen({ navigation }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('hi');
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef<string>('default_user');

  useEffect(() => {
    initApp();
    return () => {
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
    };
  }, []);

  const initApp = async () => {
    try {
      await moneyService.initDatabase();
      const welcomeMessage: ChatMessage = {
        id: '1',
        role: 'assistant',
        content: currentLanguage === 'hi' 
          ? 'नमस्ते! मैं VAANI हूं, आपका वित्तीय सलाहकार। आज मैं आपकी कैसे मदद कर सकता हूं?'
          : 'Hello! I am VAANI, your financial advisor. How can I help you today?',
        created_at: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Init error:', error);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const speakResponse = useCallback((text: string) => {
    try {
      Speech.speak(text, {
        language: currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'bn' ? 'bn-IN' : 'en-IN',
        rate: 0.9,
        pitch: 1,
      });
    } catch (error) {
      console.error('TTS error:', error);
    }
  }, [currentLanguage]);

  const addMessage = useCallback((content: string, role: 'user' | 'assistant') => {
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  const handleFeatureCommand = async (text: string): Promise<string | null> => {
    try {
      return await handleFeatureIntent(text, userIdRef.current, currentLanguage);
    } catch (error) {
      console.error('Feature intent error:', error);
      return null;
    }
  };

  const processUserMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg = addMessage(text, 'user');
    setIsTyping(true);

    // First check for feature command (instant response)
    const featureResponse = await handleFeatureCommand(text);
    
    if (featureResponse) {
      const aiMsg = addMessage(featureResponse, 'assistant');
      setIsTyping(false);
      speakResponse(featureResponse);
      return;
    }

    // Check for money/expense logging patterns
    const expenseMatch = text.match(/(\d+)\s*(?:₹|rs\.?|rupay[ae]?|पैसे?)/i);
    if (expenseMatch && (text.includes('kharch') || text.includes('खर्च') || text.includes('spent') || text.includes('दिया'))) {
      const amount = parseInt(expenseMatch[1]);
      const category = detectCategory(text);
      await moneyService.addExpense(amount, category, text);
      const response = currentLanguage === 'hi' 
        ? `हो गया! ₹${amount} का खर्चा दर्ज कर दिया।`
        : `Done! ₹${amount} expense logged.`;
      const aiMsg = addMessage(response, 'assistant');
      setIsTyping(false);
      speakResponse(response);
      return;
    }

    // Check for income logging patterns
    const incomeMatch = text.match(/(?:client|se|ne)\s+(\w+).*?(\d+)\s*(?:₹|rs\.?|पैसे?)/i);
    if (incomeMatch || text.includes('payment') || text.includes('aaya') || text.includes('आया')) {
      const clientName = incomeMatch?.[1] || 'Unknown';
      const amount = incomeMatch ? parseInt(incomeMatch[2]) : detectAmount(text);
      if (amount > 0) {
        const result = await freelancerService.logIncome(userIdRef.current, clientName, amount);
        const aiMsg = addMessage(result.voiceConfirmation, 'assistant');
        setIsTyping(false);
        speakResponse(result.voiceConfirmation);
        return;
      }
    }

    // Fallback to AI chat
    try {
      let fullResponse = '';
      await sendChatMessage(
        messages,
        text,
        currentLanguage,
        {
          userName: 'User',
          onToken: (token) => {
            fullResponse += token;
            setStreamingText(fullResponse);
          },
          onDone: (response) => {
            const aiMsg = addMessage(response, 'assistant');
            setIsTyping(false);
            setStreamingText('');
            speakResponse(response);
          },
          onError: (error) => {
            const errorMsg = currentLanguage === 'hi'
              ? 'Sorry, something went wrong. Please try again.'
              : 'Sorry, something went wrong. Please try again.';
            const aiMsg = addMessage(errorMsg, 'assistant');
            setIsTyping(false);
            setStreamingText('');
          },
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMsg = currentLanguage === 'hi'
        ? 'माफ़ कीजिए, कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।'
        : 'Sorry, something went wrong. Please try again.';
      const aiMsg = addMessage(fallbackMsg, 'assistant');
      setIsTyping(false);
    }
  };

  const detectCategory = (text: string): string => {
    const lower = text.toLowerCase();
    if (/chai|khana|food|doodh|sabzi/i.test(lower)) return 'food';
    if (/petrol|auto|uber|ola|bus|train/i.test(lower)) return 'transport';
    if (/bijli|pani|gas|recharge|wifi|bill/i.test(lower)) return 'utilities';
    if (/doctor|dawai|hospital|medical/i.test(lower)) return 'health';
    if (/school|college|book|fees/i.test(lower)) return 'education';
    if (/movie|game|netflix/i.test(lower)) return 'entertainment';
    if (/cloth|amazon|flipkart|kapda/i.test(lower)) return 'shopping';
    return 'other';
  };

  const detectAmount = (text: string): number => {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access for voice commands.');
        return;
      }

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

      // Auto-stop after 10 seconds
      recordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 10000);
    } catch (error) {
      console.error('Recording start error:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
    pulseAnim.stopAnimation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simulate voice input for demo - in production, use expo-speech recognition
    const voiceInput = inputText || generateDemoVoiceInput();
    if (voiceInput.trim()) {
      processUserMessage(voiceInput);
    }
  };

  const generateDemoVoiceInput = (): string => {
    // This simulates voice input for demo purposes
    // In production, integrate with actual STT
    return inputText;
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    processUserMessage(inputText);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageContainer, item.role === 'user' && styles.userMessageContainer]}>
      <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, item.role === 'user' && styles.userMessageText]}>
          {item.content}
        </Text>
      </View>
      <Text style={styles.messageTime}>
        {new Date(item.created_at).toLocaleTimeString(currentLanguage === 'hi' ? 'hi-IN' : 'en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  const quickActions = [
    { icon: '💰', label: 'खर्चा', action: () => setInputText('खर्चा जोड़ो') },
    { icon: '📊', label: 'नेट वर्थ', action: () => processUserMessage('net worth') },
    { icon: '📈', label: 'SIP', action: () => processUserMessage('SIP suggest karo') },
    { icon: '💳', label: 'EMI', action: () => processUserMessage('EMI kitna hai') },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backButton}>← <Text style={{ color: COLORS.gold }}>Back</Text></Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>VA<Text style={{ color: COLORS.gold }}>A</Text>NI</Text>
          <Text style={styles.headerSubtitle}>आपका वित्तीय सलाहकार</Text>
        </View>
        <TouchableOpacity onPress={() => setCurrentLanguage(currentLanguage === 'hi' ? 'en' : 'hi')}>
          <Text style={styles.langButton}>{currentLanguage === 'hi' ? 'EN' : 'हि'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {quickActions.map((action, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.quickActionBtn}
            onPress={action.action}
          >
            <Text style={styles.quickActionIcon}>{action.icon}</Text>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
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

      {/* Streaming indicator */}
      {streamingText && (
        <View style={styles.streamingContainer}>
          <Text style={styles.streamingText}>{streamingText}</Text>
        </View>
      )}

      {/* Typing indicator */}
      {isTyping && !streamingText && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingDots}>
            {[0, 1, 2].map(i => (
              <Animated.View key={i} style={[styles.typingDot, { opacity: 0.3 + i * 0.3 }]} />
            ))}
          </View>
          <Text style={styles.typingText}>VAANI सोच रहा है...</Text>
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
          placeholder={currentLanguage === 'hi' ? 'अपना संदेश लिखें...' : 'Type your message...'}
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
      <Text style={styles.voiceHint}>
        {isRecording ? '🔴 Recording...' : '🎤 दबाए रखें बोलने के लिए'}
      </Text>
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
    fontSize: 14,
    color: COLORS.text_secondary,
    fontWeight: '400',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: COLORS.text_primary,
    letterSpacing: 3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.text_secondary,
    marginTop: 2,
  },
  langButton: {
    fontSize: 13,
    color: COLORS.gold,
    fontWeight: '600',
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.gold_dim,
    borderRadius: 8,
  },
  menuButton: {
    fontSize: 24,
    color: COLORS.text_primary,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_subtle,
  },
  quickActionBtn: {
    backgroundColor: COLORS.gold_dim,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.gold_glow,
  },
  quickActionIcon: {
    fontSize: 16,
  },
  quickActionLabel: {
    fontSize: 12,
    color: COLORS.gold,
    fontWeight: '500',
  },
  streamingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  streamingText: {
    fontSize: 14,
    color: COLORS.text_secondary,
    lineHeight: 20,
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
    backgroundColor: COLORS.gold_dim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.gold_glow,
  },
  voiceButtonRecording: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
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
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.bg_elevated,
  },
  sendButtonIcon: {
    fontSize: 22,
    color: COLORS.text_inverse,
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
