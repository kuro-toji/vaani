import { useState, useEffect, useRef } from 'react';

const placeholders = [
  "Vaani से बात करें...",
  "Vaani-உடன் பேசுங்கள்...",
  "Vaani-తో మాట్లాడండి...",
  "Vaani-এর সাথে কথা বলুন...",
  "Chat with Vaani..."
];

export default function ChatInput({ onSend, isLoading, language }) {
  const [message, setMessage] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const textareaRef = useRef(null);

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
    <div className="bg-white border-t border-[#E5E7EB] px-4 py-3 flex row items-end gap-2">
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
  );
}
