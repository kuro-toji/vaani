import { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat.js';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import SuggestionChips from './SuggestionChips.jsx';
import LanguageSelector from './LanguageSelector.jsx';
import ChatInput from './ChatInput.jsx';
import { Volume2, VolumeX } from 'lucide-react';

export default function ChatWindow() {
  const { messages, isLoading, language, isLanguageManual, sendMessage, setLanguageManual, isMuted, setMuted } = useChat();
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="h-screen flex flex-col bg-[#FAFAF8]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-[#E5E7EB] px-4 flex items-center justify-between shrink-0">
        <span className="text-[20px] font-semibold text-[#0F6E56]">Vaani</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMuted(!isMuted)}
            className="p-2 rounded-full hover:bg-[#F3F4F6] transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX size={20} color="#9CA3AF" />
            ) : (
              <Volume2 size={20} color="#0F6E56" />
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
      <div className="bg-white border-t border-[#E5E7EB] px-4 py-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        <ChatInput onSend={sendMessage} isLoading={isLoading} language={language} isMuted={isMuted} />
      </div>
    </div>
  );
}