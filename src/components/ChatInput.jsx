import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import useVoice from '../hooks/useVoice.js';

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
  const textareaRef = useRef(null);
  const { isListening, isModelLoading, sttError, startListening, stopListening, stopSpeaking } = useVoice();

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
    if (message.trim() && !isLoading) {
      onSend(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };



  return (
    <>
    <div className="bg-white border-t border-[#E5E7EB] px-4 py-3 flex items-end gap-2">
      <textarea
        ref={textareaRef}
        dir="auto"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholders[placeholderIndex]}
        disabled={isLoading}
        className="flex-1 bg-transparent text-[15px] resize-none outline-none border-none no-scrollbar"
        style={{ minHeight: '24px' }}
      />
      <button
        onClick={isListening ? stopListening : () => startListening(
          (transcript, isFinal) => setMessage(transcript),
          (error) => console.error('Speech recognition error:', error),
          language
        )}
        disabled={isLoading || isMuted || isModelLoading}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isListening
            ? 'bg-[#EF4444] animate-pulse'
            : isMuted
            ? 'bg-[#9CA3AF] opacity-60'
            : 'bg-[#1D9E75]'
        } ${isModelLoading ? 'opacity-50 cursor-wait' : ''}`}
        title={isModelLoading ? 'Loading model...' : isListening ? 'Stop' : 'Speak'}
      >
        {isModelLoading ? (
          <span className="text-white text-xs">...</span>
        ) : isListening ? (
          <MicOff size={18} color="white" />
        ) : (
          <Mic size={18} color="white" />
        )}
      </button>
      <button
        onClick={handleSend}
        disabled={!message.trim() || isLoading}
        className="bg-[#1D9E75] text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
            startListening(
              (transcript, isFinal) => setMessage(transcript),
              (error) => console.error('Speech recognition error:', error),
              language
            );
          }}
          className="text-xs text-[#0F6E56] font-medium underline"
        >
          Try Again
        </button>
      </div>
    )}
    </>
  );
}
