import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import MessageBubble from './MessageBubble.jsx';
import StreamingText from './StreamingText.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import ChatInput from './ChatInput.jsx';
import LanguageDropdown from './LanguageDropdown.jsx';

const PLACEHOLDER_MESSAGES = [
  'FD rates ke baare mein batao',
  'SIP shuru karne ka tarika',
  'Emergency fund kaise banayein',
  'Crypto portfolio dekhao',
];

function SuggestionChips({ onSend }) {
  return (
    <div className="flex flex-col gap-2 mb-4 px-1">
      <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Try asking:</p>
      <div className="flex flex-col gap-2">
        {PLACEHOLDER_MESSAGES.map((msg, i) => (
          <button
            key={i}
            onClick={() => onSend(msg)}
            className="text-left px-4 py-3 rounded-xl text-sm cursor-pointer w-full"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.2s var(--ease-spring)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--glass-elevated-bg)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--glass-bg)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {msg}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatWindow({ onClose }) {
  const { messages, streamingText, isLoading, language, setLanguage, isMuted, setIsMuted, sendMessage, speak, isConnected } = useChat();
  const { language: globalLang, setLanguage: setGlobalLang } = useLanguage();
  const messagesEndRef = useRef(null);
  const [muteLabel, setMuteLabel] = useState('');

  // Sync global language → chat
  useEffect(() => {
    if (globalLang) setLanguage(globalLang);
  }, [globalLang]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Mute label
  useEffect(() => {
    setMuteLabel(isMuted ? 'Unmute' : 'Mute');
  }, [isMuted]);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}
    >
      {/* ── HEADER ── */}
      <header
        className="flex items-center px-4 gap-3"
        style={{
          height: '60px',
          background: 'rgba(8,8,8,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        {/* Back button (mobile only) */}
        {onClose && (
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon hidden"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        )}

        {/* Logo + title */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              boxShadow: '0 2px 8px rgba(29,158,117,0.3)',
            }}
          >
            <span className="font-bold text-sm" style={{ color: '#fff' }}>V</span>
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>VAANI</div>
            <div className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: isConnected ? 'var(--success)' : 'var(--text-tertiary)' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {isConnected ? 'Online' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Language dropdown */}
          <LanguageDropdown
            language={language}
            onSelect={(code) => { setLanguage(code); setGlobalLang(code); }}
          />

          {/* Mute button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="btn btn-ghost btn-icon"
            aria-label={muteLabel}
            title={muteLabel}
          >
            {isMuted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ── MESSAGES AREA ── */}
      <div
        className="chat-messages flex-1"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && !isLoading && (
          <SuggestionChips onSend={sendMessage} />
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} language={language} />
        ))}

        {/* Streaming text — appears word by word */}
        {streamingText && (
          <StreamingText text={streamingText} language={language} />
        )}

        {/* Typing indicator */}
        {isLoading && !streamingText && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT ── */}
      <div
        style={{
          padding: '12px 16px 16px',
          background: 'rgba(8,8,8,0.9)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          language={language}
          isMuted={isMuted}
          onSpeak={() => speak()}
        />
      </div>
    </div>
  );
}