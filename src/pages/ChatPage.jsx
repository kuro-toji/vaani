import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from '../components/chat/MessageBubble';
import ChatInput, { LANGUAGES, detectEmotion } from '../components/chat/ChatInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import LanguageDropdown from '../components/chat/LanguageDropdown';

function buildSystemPrompt(language, emotion) {
  return `You are VAANI, a warm rural Indian finance advisor. Language: ${language}. Emotion detected: ${emotion}.
Rules:
- Respond in ${language} dialect (use Devanagari script for Hindi/Bhojpuri/Rajasthani/Maithili, Bengali script for Bengali, Tamil script for Tamil, etc.)
- Use village analogies when emotion=anxious (e.g. "paisa galla mein band hai jaise darwaza")
- Suggest specific FD products from Suryoday 9.1%, Utkarsh 8.5%, Jana 8.25% with real rates
- Always end with a reassuring phrase (e.g. "Chinta mat kar, hum hain na")
- Never use English banking jargon
- Give rupee examples specific to rural India (e.g. "₹5000 se shuru karein")
- When emotion=excited, give precise numbers and bold suggestions
- When emotion=confused, explain slowly with examples`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('bho');
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const lang = localStorage.getItem('vaani_language') || 'bho';
    setLanguage(lang);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const emotion = detectEmotion(text);
    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const assistantMsg = { role: 'assistant', content: '', timestamp: Date.now() };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      abortRef.current = new AbortController();
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language,
          emotionState: emotion,
          chatHistory: history,
          systemPrompt: buildSystemPrompt(language, emotion),
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const token = line.slice(6).trim();
            if (token && token !== '[DONE]') {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  last.content += token;
                }
                return updated;
              });
            }
          }
        }
      }

      // Post-process: attach action cards based on keywords in response
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant') {
          if (last.content.includes('Suryoday') || last.content.includes('Utkarsh')) {
            last.actionCard = { type: 'fd', bank: 'Suryoday', rate: '9.1%', amount: '₹20,000', maturity: 'Jun 2027', onAction: () => {} };
          }
          if (last.content.includes('shaadi') || last.content.includes('Beti')) {
            last.actionCard = { type: 'goal', name: 'Beti ki Shaadi', nameHin: 'बेटी की शादी', target: 200000, current: 142000, monthsLeft: 6, onAction: () => {} };
          }
          if (last.content.includes('risk') || last.content.includes('dar')) {
            last.actionCard = { type: 'warning', message: 'Har investment mein risk hota hai — FD sabse surakshit maana jaata hai.' };
          }
        }
        return updated;
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant') {
          last.content = 'Maaf kijiye, kuch technical problem ho gaya. Please dobara try karein.';
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const isStreaming = isLoading && messages[messages.length - 1]?.role === 'assistant';

  return (
    <div style={{
      height: '100dvh',
      background: '#0A0F0E',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <header style={{
        padding: '12px 20px',
        background: 'rgba(10,15,14,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
          <motion.div
            animate={{
              background: ['linear-gradient(135deg, #FF6B00, #E55A00)', 'linear-gradient(135deg, #E55A00, #FF6B00)'],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 800, color: '#fff',
            }}
          >व</motion.div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', border: '2px solid #0A0F0E' }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>VAANI</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{currentLang.name} · {currentLang.region}</div>
        </div>

        <LanguageDropdown value={language} onChange={setLanguage} />
      </header>

      {/* Messages */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '4px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} isStreaming={isStreaming && i === messages.length - 1} />
          ))}
        </AnimatePresence>
        {isStreaming && (
          <div style={{ maxWidth: '70%', alignSelf: 'flex-start' }}>
            <TypingIndicator />
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}

export function ChatPageWrapper() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}