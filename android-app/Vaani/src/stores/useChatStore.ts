// ═══════════════════════════════════════════════════════════════════
// VAANI Chat Store — Zustand
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import * as DB from '../database';
import { sendChatMessage, parseExpenseIntent } from '../services/chatService';
import { transcribeAudio } from '../services/sttService';
import { speak, stopSpeaking } from '../services/ttsService';
import { startRecording, stopRecording, cancelRecording } from '../services/voiceService';
import { VOICE_CONFIG } from '../constants';
import type { ChatMessage, ActionCard } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isRecording: boolean;
  isTranscribing: boolean;
  isStreaming: boolean;
  isSpeaking: boolean;
  transcribedText: string;
  autoSendCountdown: number;
  autoSendTimer: ReturnType<typeof setInterval> | null;

  // Actions
  loadMessages: (userId: string) => Promise<void>;
  sendTextMessage: (userId: string, text: string, language: string, options?: { userName?: string; region?: string }) => Promise<void>;
  startVoiceInput: () => Promise<void>;
  stopVoiceInput: (userId: string, language: string) => Promise<void>;
  cancelVoiceInput: () => Promise<void>;
  confirmAutoSend: (userId: string, language: string, options?: { userName?: string; region?: string }) => void;
  cancelAutoSend: () => void;
  clearChat: (userId: string) => Promise<void>;
  stopTTS: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isRecording: false,
  isTranscribing: false,
  isStreaming: false,
  isSpeaking: false,
  transcribedText: '',
  autoSendCountdown: 0,
  autoSendTimer: null,

  loadMessages: async (userId) => {
    try {
      const messages = await DB.getChatMessages(userId, 50);
      if (messages.length === 0) {
        // Add welcome message
        const welcomeMsg: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: 'नमस्ते! 🙏 मैं VAANI हूं, आपका वित्तीय सलाहकार। बोलिए या लिखिए — मैं आपकी मदद के लिए हाज़िर हूं!',
          created_at: new Date().toISOString(),
        };
        set({ messages: [welcomeMsg] });
      } else {
        set({ messages: messages as ChatMessage[] });
      }
    } catch (error) {
      console.error('[Chat] Load messages failed:', error);
    }
  },

  sendTextMessage: async (userId, text, language, options) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      language,
      created_at: new Date().toISOString(),
    };

    set(s => ({ messages: [...s.messages, userMsg], isStreaming: true }));

    // Save to DB
    await DB.addChatMessage({ user_id: userId, role: 'user', content: text, language });

    // Create streaming assistant message
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      language,
      streaming: true,
      created_at: new Date().toISOString(),
    };

    set(s => ({ messages: [...s.messages, assistantMsg] }));

    // Send to AI
    try {
      const fullResponse = await sendChatMessage(
        get().messages.filter(m => !m.streaming),
        text,
        language,
        {
          userName: options?.userName,
          region: options?.region,
          onToken: (token) => {
            set(s => ({
              messages: s.messages.map(m =>
                m.id === assistantId ? { ...m, content: m.content + token } : m
              ),
            }));
          },
          onActionCard: (card) => {
            set(s => ({
              messages: s.messages.map(m =>
                m.id === assistantId
                  ? { ...m, action_cards: [...(m.action_cards || []), card] }
                  : m
              ),
            }));
          },
          onDone: async (response) => {
            set(s => ({
              messages: s.messages.map(m =>
                m.id === assistantId ? { ...m, content: response, streaming: false } : m
              ),
              isStreaming: false,
            }));

            // Save to DB
            await DB.addChatMessage({ user_id: userId, role: 'assistant', content: response, language });

            // Auto-read response
            set({ isSpeaking: true });
            await speak(response, language, {
              onDone: () => set({ isSpeaking: false }),
            });
          },
          onError: (error) => {
            set(s => ({
              messages: s.messages.map(m =>
                m.id === assistantId
                  ? { ...m, content: 'माफ़ कीजिए, कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।', streaming: false }
                  : m
              ),
              isStreaming: false,
            }));
          },
        }
      );
    } catch (error) {
      set({ isStreaming: false });
    }
  },

  startVoiceInput: async () => {
    await stopSpeaking();
    const started = await startRecording(() => {
      // Silence detected — auto-stop
      const state = get();
      if (state.isRecording) {
        // Will be handled by stopVoiceInput call
      }
    });

    if (started) {
      set({ isRecording: true, transcribedText: '' });
    }
  },

  stopVoiceInput: async (userId, language) => {
    set({ isRecording: false, isTranscribing: true });

    const result = await stopRecording();
    if (!result) {
      set({ isTranscribing: false, transcribedText: '' });
      return;
    }

    // Transcribe
    const transcription = await transcribeAudio(result.uri, language);

    if (!transcription || !transcription.text) {
      set({ isTranscribing: false, transcribedText: '' });
      return;
    }

    set({ isTranscribing: false, transcribedText: transcription.text });

    // Start auto-send countdown
    let countdown = VOICE_CONFIG.auto_send_countdown / 1000;
    set({ autoSendCountdown: countdown });

    const timer = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(timer);
        set({ autoSendTimer: null, autoSendCountdown: 0 });
        // Auto-send
        const state = get();
        if (state.transcribedText) {
          state.sendTextMessage(userId, state.transcribedText, language);
          set({ transcribedText: '' });
        }
      } else {
        set({ autoSendCountdown: countdown });
      }
    }, 1000);

    set({ autoSendTimer: timer });
  },

  cancelVoiceInput: async () => {
    await cancelRecording();
    const timer = get().autoSendTimer;
    if (timer) clearInterval(timer);
    set({ isRecording: false, isTranscribing: false, transcribedText: '', autoSendCountdown: 0, autoSendTimer: null });
  },

  confirmAutoSend: (userId, language, options) => {
    const timer = get().autoSendTimer;
    if (timer) clearInterval(timer);

    const text = get().transcribedText;
    if (text) {
      get().sendTextMessage(userId, text, language, options);
    }
    set({ transcribedText: '', autoSendCountdown: 0, autoSendTimer: null });
  },

  cancelAutoSend: () => {
    const timer = get().autoSendTimer;
    if (timer) clearInterval(timer);
    set({ transcribedText: '', autoSendCountdown: 0, autoSendTimer: null });
  },

  clearChat: async (userId) => {
    await DB.clearChatMessages(userId);
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: 'चैट साफ़ कर दी गई। नमस्ते! मैं VAANI हूं, आपकी क्या मदद कर सकता हूं?',
      created_at: new Date().toISOString(),
    };
    set({ messages: [welcomeMsg] });
  },

  stopTTS: async () => {
    await stopSpeaking();
    set({ isSpeaking: false });
  },
}));
