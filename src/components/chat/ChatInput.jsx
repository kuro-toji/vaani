import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', region: 'Delhi' },
  { code: 'bho', name: 'Bhojpuri', native: 'भोजपुरी', region: 'UP' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', region: 'West Bengal' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', region: 'Tamil Nadu' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', region: 'Telangana' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', region: 'Maharashtra' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'Karnataka' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', region: 'Kerala' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', region: 'Assam' },
  { code: 'raj', name: 'Rajasthani', native: 'राजस्थानी', region: 'Rajasthan' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली', region: 'Bihar' },
  { code: 'en', name: 'English', native: 'English', region: 'General' },
];

const EMOTION_KEYWORDS = {
  anxious: ['doob jayega', 'kho jayega', 'dar', 'safe hai kya', 'khatra', 'kya hoga', 'lose', 'risk'],
  confused: ['kya matlab', 'samajh nahi', 'kaisa', 'explain', 'batao', 'kaise', 'what is', 'kitna'],
  excited: ['badhiya', 'sahi', 'achha', 'mast', 'zordaar', 'great', 'wow', 'perfect'],
};

function detectEmotion(text) {
  const lower = text.toLowerCase();
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return emotion;
  }
  return 'neutral';
}

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 112) + 'px';
  }, []);

  const handleChange = (e) => {
    setValue(e.target.value);
    adjustHeight();
  };

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      background: 'rgba(10,15,14,0.95)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '12px 16px max(12px, env(safe-area-inset-bottom))',
      position: 'sticky',
      bottom: 0,
      zIndex: 20,
    }}>
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-end',
        maxWidth: '720px',
        margin: '0 auto',
      }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="VAANI se baat karein..."
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px',
            padding: '12px 14px',
            color: '#fff',
            fontSize: '14px',
            fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
            lineHeight: 1.5,
            outline: 'none',
            resize: 'none',
            maxHeight: '112px',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,107,0,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            style={{
              width: '44px', height: '44px',
              borderRadius: '50%',
              background: value.trim() && !disabled
                ? 'linear-gradient(135deg, #FF6B00, #E55A00)'
                : 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: value.trim() && !disabled ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
          >
            <Send size={18} color={value.trim() && !disabled ? '#fff' : 'rgba(255,255,255,0.3)'} />
          </motion.button>
          <button
            style={{
              width: '44px', height: '44px',
              borderRadius: '50%',
              background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Voice input"
          >
            <Mic size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { LANGUAGES, detectEmotion };