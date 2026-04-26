import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const ChatContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [language, setLanguage] = useState('hi');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const socketRef = useRef(null);
  const streamingMessageId = useRef(null);

  const { user } = useAuth();

  // Auto-connect socket when user logs in
  useEffect(() => {
    if (user?.id) {
      connect(user.id);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id]);

  /** Connect socket and set up event listeners */
  const connect = useCallback((userId) => {
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { userId },
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Incoming token stream (word by word)
    socket.on('chat:token', (data) => {
      setStreamingText(prev => prev + data.token);
    });

    // Stream complete — finalize message
    socket.on('chat:done', (data) => {
      const finalMsg = {
        id: streamingMessageId.current,
        role: 'assistant',
        content: data.fullResponse || streamingText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, finalMsg]);
      setStreamingText('');
      setIsLoading(false);
      streamingMessageId.current = null;
    });

    socket.on('chat:error', (data) => {
      setError(data.message || 'Chat failed');
      setIsLoading(false);
      setStreamingText('');
    });

    socketRef.current = socket;
    return socket;
  }, []);

  /** Disconnect socket */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  /** Speak the last AI response aloud */
  const speak = useCallback((text = null, lang = null) => {
    if (isMuted) return;
    if (!('speechSynthesis' in window)) return;

    const toSpeak = text || streamingText || messages[messages.length - 1]?.content;
    if (!toSpeak) return;

    const bcp47 = {
      hi: 'hi-IN', en: 'en-IN', bn: 'bn-IN', te: 'te-IN',
      ta: 'ta-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN',
    };
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(toSpeak.substring(0, 500));
    utterance.lang = bcp47[lang || language] || 'hi-IN';
    utterance.rate = 0.9;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  }, [isMuted, streamingText, messages, language]);

  /**
   * Send a message — uses Socket.io streaming if connected,
   * falls back to HTTP POST if socket unavailable.
   */
  const sendMessage = useCallback(async (text, fromVoice = false) => {
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    // Stop any ongoing TTS
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const assistantId = `asst-${Date.now()}`;
    streamingMessageId.current = assistantId;
    setStreamingText('');

    if (socketRef.current?.connected) {
      // Stream via Socket.io — token-by-token updates
      socketRef.current.emit('chat:message', {
        text: text.trim(),
        language,
        fromVoice,
      });
    } else {
      // HTTP fallback — fetch with proper SSE handling
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            language,
            chatHistory: messages.slice(-10).map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok) throw new Error(`Server error ${res.status}`);

        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('text/event-stream')) {
          // SSE streaming — read token by token
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const token = line.slice(6).trim();
              if (token === '[DONE]') continue;
              accumulated += token;
              setStreamingText(accumulated);
            }
          }

          const finalMsg = {
            id: assistantId,
            role: 'assistant',
            content: accumulated,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, finalMsg]);
          setStreamingText('');
          if (!isMuted && accumulated) speak(accumulated, language);
        } else {
          // Plain JSON response
          const data = await res.json();
          const reply = data.reply || data.fullResponse || '...';
          const finalMsg = {
            id: assistantId,
            role: 'assistant',
            content: reply,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, finalMsg]);
          if (!isMuted && reply) speak(reply, language);
        }
      } catch (err) {
        setError(err.message);
        setMessages(prev => [...prev, {
          id: assistantId,
          role: 'assistant',
          content: language === 'hi'
            ? 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।'
            : 'Something went wrong. Please try again.',
          timestamp: new Date(),
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isLoading, language, isMuted, messages, connect]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        streamingText,
        isLoading,
        language,
        setLanguage,
        isConnected,
        error,
        isMuted,
        setIsMuted,
        connect,
        disconnect,
        sendMessage,
        speak,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}