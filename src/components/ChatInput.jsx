import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoice } from '../hooks/useVoice.js';
import useVibration from '../hooks/useVibration.js';
import ConfirmationModal from './ConfirmationModal.jsx';
import { useAccessibility } from '../context/AccessibilityContext.jsx';

const placeholders = [
  "Vaani से बात करें...",
  "Vaani-உடன் பேசுங்கள்...",
  "Vaani-తో మాట్లాడండి...",
  "Vaani-এর সাথে কথা বলুন...",
  "Chat with Vaani..."
];

export default function ChatInput({ onSend, isLoading, language, isMuted = false }) {
  const [message, setMessage] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const textareaRef = useRef(null);
  const { isListening, isModelLoading, sttError, startListening, stopListening, stopSpeaking } = useVoice();
  const { vibrateOnRecordingStart, vibrateListeningLoop, stopVibration } = useVibration();
  const { largeText } = useAccessibility();

  // Handle listening vibration loop
  useEffect(() => {
    if (isListening) {
      vibrateListeningLoop();
    } else {
      stopVibration();
    }
  }, [isListening, vibrateListeningLoop, stopVibration]);

  // Reset message when language changes
  useEffect(() => {
    setMessage('');
  }, [language]);

  // Placeholder rotation every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-resize textarea (up to ~5 lines max)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const lineHeight = 24;
      const maxLines = 5;
      const maxHeight = lineHeight * maxLines;
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;
    if (trimmed.length > 5000) {
      alert('Message too long. Please keep it under 5000 characters.');
      return;
    }
    onSend(trimmed);
    setMessage('');
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

  const handleStartListening = () => {
    vibrateOnRecordingStart();
    startListening(
      (transcript, isFinal) => {
        if (isFinal) {
          setTranscribedText(transcript)
          setShowConfirmation(true)
        }
      },
      (error) => console.error('Speech recognition error:', error),
      language
    )
  };

  return (
    <>
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: '10px',
      padding: '12px 16px',
      background: 'var(--vaani-bg)',
    }}>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'flex-end',
        background: '#F3F4F6', borderRadius: '24px',
        padding: '4px 16px', minHeight: largeText ? '64px' : '48px',
        border: '1px solid transparent',
        transition: 'border-color 0.2s ease',
      }}
        onFocus={e => e.currentTarget.style.borderColor = '#0F6E56'}
        onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
      >
        <textarea
          ref={textareaRef}
          dir="auto"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholders[placeholderIndex]}
          disabled={isLoading}
          maxLength={5000}
          style={{
            flex: 1, background: 'transparent', fontSize: largeText ? '20px' : '15px',
            resize: 'none', outline: 'none', border: 'none',
            minHeight: '24px', padding: '10px 0', lineHeight: '24px',
            fontFamily: 'inherit', color: 'var(--vaani-text)',
          }}
          aria-label="अपना संदेश लिखें"
        />
      </div>

      {/* Mic Button */}
      <button
        onClick={isListening ? stopListening : handleStartListening}
        disabled={isLoading || isMuted || isModelLoading}
        style={{
          width: '48px', height: '48px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, border: 'none', cursor: 'pointer',
          background: isListening ? '#EF4444' : isMuted ? '#9CA3AF' : 'linear-gradient(135deg, #0F6E56, #10B981)',
          boxShadow: isListening ? '0 0 0 4px rgba(239, 68, 68, 0.2)' : '0 2px 8px rgba(15, 110, 86, 0.3)',
          transition: 'all 0.2s ease',
          opacity: isModelLoading ? 0.5 : 1,
          animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
        aria-label={isModelLoading ? 'मॉडल लोड हो रहा है...' : isListening ? 'रिकॉर्डिंग बंद करें' : 'बोलें'}
        aria-pressed={isListening}
      >
        {isModelLoading ? (
          <span style={{ color: 'white', fontSize: '12px' }}>...</span>
        ) : isListening ? (
          <MicOff size={20} color="white" />
        ) : (
          <Mic size={20} color="white" />
        )}
      </button>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!message.trim() || isLoading}
        style={{
          width: '48px', height: '48px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, border: 'none', cursor: 'pointer',
          background: message.trim() ? 'linear-gradient(135deg, #0F6E56, #10B981)' : '#E5E7EB',
          boxShadow: message.trim() ? '0 2px 8px rgba(15, 110, 86, 0.3)' : 'none',
          transition: 'all 0.2s ease',
          opacity: (!message.trim() || isLoading) ? 0.4 : 1,
        }}
        aria-label="संदेश भेजें"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
    {sttError && (
      <div className="flex items-center gap-2 px-4 py-1">
        <p className="text-xs text-red-500">{sttError}</p>
        <button
          onClick={() => {
            vibrateOnRecordingStart();
            startListening(
              (transcript, isFinal) => setMessage(transcript),
              (error) => console.error('Speech recognition error:', error),
              language
            );
          }}
          className="text-xs text-[#0F6E56] font-medium underline vaani-touch-target px-4 py-2"
          aria-label="फिर से कोशिश करें"
        >
          Try Again
        </button>
      </div>
    )}
    {showConfirmation && (
      <ConfirmationModal
        text={transcribedText}
        language={language}
        onConfirm={() => {
          setMessage(transcribedText)
          setShowConfirmation(false)
          // Auto-send after confirm - this was a voice message
          if (transcribedText.trim()) {
            onSend(transcribedText, true) // fromVoice = true
            setTranscribedText('')
          }
        }}
        onRetry={() => {
          setShowConfirmation(false)
          setTranscribedText('')
          // Auto-open mic again after retry
          setTimeout(() => {
            vibrateOnRecordingStart();
            startListening(
              (transcript, isFinal) => {
                if (isFinal) {
                  setTranscribedText(transcript)
                  setShowConfirmation(true)
                }
              },
              (error) => console.error('Speech recognition error:', error),
              language
            )
          }, 300)
        }}
        onCancel={() => setShowConfirmation(false)}
      />
    )}
    </>
  );
}