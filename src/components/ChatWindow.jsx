import { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat.js';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import SuggestionChips from './SuggestionChips.jsx';
import LanguageSelector from './LanguageSelector.jsx';
import ChatInput from './ChatInput.jsx';
import FlashNotification from './FlashNotification.jsx';
import { Volume2, VolumeX } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';

export default function ChatWindow() {
  const { messages, isLoading, language, isLanguageManual, sendMessage, setLanguageManual, isMuted, setMuted } = useChat();
  const messagesEndRef = useRef(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { largeText, highContrast, toggleLargeText, toggleHighContrast } = useAccessibility();
  
  // Track message count for flash notification trigger
  const [flashTrigger, setFlashTrigger] = useState(0);
  const prevMessageCount = useRef(messages.length);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Detect new AI messages for flash notification
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        setFlashTrigger(prev => prev + 1);
      }
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Build className for accessibility modes
  const containerClass = [
    'h-screen',
    'flex',
    'flex-col',
    'bg-[var(--vaani-bg)]',
    'text-[var(--vaani-text)]',
    largeText ? 'vaani-large-text' : '',
    highContrast ? 'vaani-high-contrast' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <FlashNotification trigger={flashTrigger} />
      {!isOnline && (
        <div 
          role="alert" 
          aria-live="assertive"
          style={{
            backgroundColor: '#FEF3C7',
            borderBottom: '1px solid #F59E0B',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#92400E',
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
          }}
        >
          <span>📶</span>
          <span>ऑफलाइन है — कृपया इंटरनेट चालू करें</span>
        </div>
      )}
    <div className={containerClass}>
      {/* Header */}
      <header role="banner" aria-label="Vaani चैट" className="h-14 bg-white border-b border-[#E5E7EB] px-4 flex items-center justify-between shrink-0">
        <span className="text-[20px] font-semibold text-[#0F6E56]">Vaani</span>
        <div className="flex items-center gap-2">
          {/* Large Text Toggle */}
          <button
            onClick={toggleLargeText}
            aria-pressed={largeText}
            aria-label="बड़ा टेक्सट मोड"
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-[#F3F4F6] vaani-touch-target"
            title="बड़ा टेक्सट"
          >
            <span className="text-sm font-bold text-[#0F6E56]">Aa</span>
          </button>
          
          {/* High Contrast Toggle */}
          <button
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            aria-label="हाई कॉन्ट्रास्ट मोड"
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-[var(--vaani-border)] vaani-touch-target"
            title="हाई कॉन्ट्रास्ट"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--vaani-user-bubble)]">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2v20"/>
              <path d="M12 2a10 10 0 0 1 0 20"/>
            </svg>
          </button>
          
          <button
            onClick={() => setMuted(!isMuted)}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-[#F3F4F6] vaani-touch-target"
            aria-label={isMuted ? 'ध्वनि बंद करें' : 'ध्वनि चालू करें'}
          >
            {isMuted ? (
              <VolumeX size={20} color="#9CA3AF" />
            ) : (
              <Volume2 size={20} color="var(--vaani-user-bubble)" />
            )}
          </button>
          <LanguageSelector
            language={language}
            onSelect={setLanguageManual}
            isManual={isLanguageManual}
          />
        </div>
      </header>

      {/* Messages */}
      <div
        role="log"
        aria-live="polite"
        aria-label="संदेश"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pb-[max(20px,env(safe-area-inset-bottom))] flex flex-col gap-3"
        ref={messagesEndRef}
      >
        {messages.length === 0 && !isLoading && (
          <SuggestionChips language={language} onSend={sendMessage} />
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} language={language} />
        ))}
        {isLoading && <TypingIndicator />}
      </div>

      {/* Input */}
      <div role="form" aria-label="संदेश भेजें" className="bg-[var(--vaani-bg)] border-t border-[var(--vaani-border)] px-4 py-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        <ChatInput onSend={sendMessage} isLoading={isLoading} language={language} isMuted={isMuted} />
      </div>
    </div>
    </>
  );
}