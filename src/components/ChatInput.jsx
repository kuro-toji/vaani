import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import useVoice from '../hooks/useVoice.js';
import useVibration from '../hooks/useVibration.js';
import ConfirmationModal from './ConfirmationModal.jsx';

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
  const { vibrateOnRecordingStart, vibrateOnTap } = useVibration();

  // Reset message when language changes
  useEffect(() => {
    setMessage('');
  }, [language]);

  // Listen for voice start event from voice navigation
  useEffect(() => {
    const handleStartVoice = () => {
      if (!isListening && !isLoading && !isMuted && !isModelLoading) {
        handleStartListening();
      }
    };

    window.addEventListener('vaani-start-voice', handleStartVoice);
    return () => window.removeEventListener('vaani-start-voice', handleStartVoice);
  }, [isListening, isLoading, isMuted, isModelLoading]);

  // Placeholder rotation every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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
          setTranscribedText(transcript);
          setShowConfirmation(true);
        }
      },
      (error) => console.error('Speech recognition error:', error),
      language
    );
  };

  return (
    <>
      <div className="bg-[var(--vaani-bg)] border-t border-[var(--vaani-border)] px-3 py-2 pb-[max(16px,env(safe-area-inset-bottom))]">
        {/* Row: textarea + send button */}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            dir="auto"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[placeholderIndex]}
            disabled={isLoading}
            maxLength={5000}
            className="flex-1 bg-white text-[16px] resize-none outline-none border border-[var(--vaani-border)] rounded-2xl px-4 py-3"
            style={{ minHeight: '48px', maxHeight: '120px' }}
            aria-label="अपना संदेश लिखें"
            aria-placeholder={placeholders[placeholderIndex]}
          />

          {/* Send button — right side, thumb reachable */}
          <button
            onClick={() => { vibrateOnTap(); handleSend(); }}
            disabled={!message.trim() || isLoading}
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-[#1D9E75] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform vaani-touch-target"
            aria-label="संदेश भेजें"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* STT error */}
        {sttError && (
          <div className="flex items-center gap-2 px-1 pt-1">
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
              className="text-xs text-[#0F6E56] font-medium underline vaani-touch-target px-2 py-1"
              aria-label="फिर से कोशिश करें"
            >
              Try Again
            </button>
          </div>
        )}

        {/* BIG mic button — bottom center, prime thumb zone */}
        <div className="flex justify-center mt-3">
          <button
            onClick={() => {
              if (isListening) {
                vibrateOnTap();
                stopListening();
              } else {
                handleStartListening();
              }
            }}
            disabled={isLoading || isMuted || isModelLoading}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all vaani-touch-target ${
              isListening
                ? 'bg-[#EF4444] animate-pulse scale-110'
                : isMuted
                ? 'bg-[#9CA3AF] opacity-60'
                : 'bg-[#1D9E75] active:scale-95'
            } ${isModelLoading ? 'opacity-50 cursor-wait' : ''}`}
            aria-label={
              isModelLoading
                ? 'मॉडल लोड हो रहा है...'
                : isListening
                ? 'रिकॉर्डिंग बंद करें'
                : 'बोलें'
            }
            aria-pressed={isListening}
          >
            {isModelLoading ? (
              <span className="text-white text-xs font-medium">...</span>
            ) : isListening ? (
              <MicOff size={32} color="white" />
            ) : (
              <Mic size={32} color="white" />
            )}
          </button>
        </div>
      </div>

      {showConfirmation && (
        <ConfirmationModal
          text={transcribedText}
          language={language}
          onConfirm={() => {
            setMessage(transcribedText);
            setShowConfirmation(false);
            if (transcribedText.trim()) {
              onSend(transcribedText, true); // fromVoice = true
              setTranscribedText('');
            }
          }}
          onRetry={() => {
            setShowConfirmation(false);
            setTranscribedText('');
            setTimeout(() => {
              vibrateOnRecordingStart();
              startListening(
                (transcript, isFinal) => {
                  if (isFinal) {
                    setTranscribedText(transcript);
                    setShowConfirmation(true);
                  }
                },
                (error) => console.error('Speech recognition error:', error),
                language
              );
            }, 300);
          }}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </>
  );
}
