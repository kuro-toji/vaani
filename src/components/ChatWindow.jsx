import { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat.js';
import { useVoice } from '../hooks/useVoice.js';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import SuggestionChips from './SuggestionChips.jsx';
import LanguageSelector from './LanguageSelector.jsx';
import ChatInput from './ChatInput.jsx';
import FlashNotification from './FlashNotification.jsx';
import IconCardGrid from './IconCardGrid.jsx';
import PersonalDashboard from './PersonalDashboard.jsx';
import { Volume2, VolumeX, WifiOff, AlertCircle } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { useCognitiveMode } from '../context/CognitiveModeContext.jsx';
import CognitiveDashboard from './CognitiveDashboard.jsx';
import FullScreenPTT from './FullScreenPTT.jsx';
import StreakBanner from './StreakBanner.jsx';
import PassbookScanner from './PassbookScanner.jsx';
import { formatPassbookSummary } from '../services/ocrService.js';
import ExportSummary from './ExportSummary.jsx';
import FamilyManager from './FamilyManager.jsx';
import SchemeMatcher from './SchemeMatcher.jsx';
import AccountAggregator from './AccountAggregator.jsx';
import { calculateVaaniScore } from '../services/vaaniScoreService.js';
import { recordActivity } from '../services/streakService.js';
import { detectAndCaptureLead } from '../services/leadService.js';

export default function ChatWindow() {
  const { cognitiveMode, toggleCognitiveMode } = useCognitiveMode();
  const { messages, isLoading, language, isLanguageManual, sendMessage, setLanguageManual, isMuted, setMuted, error } = useChat();
  const { speak } = useVoice();
  const messagesEndRef = useRef(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { largeText, highContrast, fullScreenPTT, autoReadResponses, toggleLargeText, toggleHighContrast, toggleFullScreenPTT, toggleAutoRead } = useAccessibility();
  const [showIconMode, setShowIconMode] = useState(false);
  const [flashTrigger, setFlashTrigger] = useState(0);
  const prevMessageCount = useRef(messages.length);

  // Feature panel states
  const [activePanel, setActivePanel] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  const [showPersonalDashboard, setShowPersonalDashboard] = useState(false);

  // Record streak on mount + auto-activate fullScreenPTT if set during onboarding
  useEffect(() => {
    recordActivity();
    try {
      if (localStorage.getItem('vaani_fullScreenPTT') === '1' && !fullScreenPTT) {
        toggleFullScreenPTT();
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect leads from user messages
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'user') {
        detectAndCaptureLead(lastMsg.content, { language });
      }
      if (lastMsg?.role === 'assistant') {
        setFlashTrigger(prev => prev + 1);
      }
    }
    prevMessageCount.current = messages.length;
  }, [messages, language]);

  // Auto-read new AI responses aloud when autoReadResponses is enabled (for blind users)
  useEffect(() => {
    if (!autoReadResponses || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last?.id !== 'greeting_assistant') {
      window.vaaniSpeak?.(last.content, language);
    }
  }, [messages, autoReadResponses, language]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Online/offline detection
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // VAANI Score
  const vaaniScore = calculateVaaniScore(messages);

  if (cognitiveMode) return <CognitiveDashboard />;

  if (fullScreenPTT) {
    return (
      <FullScreenPTT 
        language={language} 
        onSend={(text) => sendMessage(text, true)}
        onClose={toggleFullScreenPTT}
      />
    );
  }

  // Feature toolbar buttons
  const toolbarButtons = [
    { id: 'scanner', emoji: '📷', label: 'पासबुक स्कैन' },
    { id: 'aa', emoji: '🔗', label: 'बैंक कनेक्ट' },
    { id: 'family', emoji: '👨‍👩‍👧‍👦', label: 'परिवार' },
    { id: 'schemes', emoji: '🏛️', label: 'सरकारी योजना' },
    { id: 'export', emoji: '📄', label: 'निर्यात' },
  ];

  return (
    <>
      <FlashNotification trigger={flashTrigger} />
      
      {/* Skip to content link for keyboard/screen reader users */}
      <a
        href="#chat-messages"
        style={{
          position: 'absolute', top: '-40px', left: 0,
          background: '#0F6E56', color: 'white',
          padding: '8px', borderRadius: '4px', zIndex: 9999,
          textDecoration: 'none', fontSize: '14px',
        }}
        onFocus={(e) => e.currentTarget.style.top = '0'}
        onBlur={(e) => e.currentTarget.style.top = '-40px'}
      >Skip to messages</a>
      
      {/* ── Offline Banner ── */}
      {!isOnline && (
        <div 
          role="alert" 
          aria-live="assertive" 
          className="flex items-center justify-center gap-2 py-2 px-4 bg-warning/10 border-b border-warning text-warning text-sm font-medium animate-fadeIn"
        >
          <WifiOff size={16} className="text-warning" />
          <span>ऑफलाइन है — संदेश कतार में जमा होंगे</span>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div 
          role="alert" 
          aria-live="assertive" 
          className="flex items-center justify-center gap-2 py-2 px-4 bg-error/10 border-b border-error text-error text-sm font-medium animate-fadeIn"
        >
          <AlertCircle size={16} className="text-error" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Chat Container ── */}
      <div className="flex flex-col flex-1 w-full bg-[var(--vaani-bg)] text-[var(--vaani-text)] overflow-hidden h-full min-h-screen transition"
        style={{ fontSize: largeText ? '20px' : undefined }}
      >
        {/* ── Header ── */}
        <header className="flex items-center justify-between h-14 min-h-14 px-3 border-b border-[var(--vaani-border)] bg-[var(--vaani-bg)] relative z-50 flex-shrink-0">
          {/* Left: Title + Score */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <h1 className="text-xl font-bold text-primary">Vaani</h1>
            {vaaniScore.score > 0 && (
              <span className={`badge ${
                vaaniScore.level === 'excellent' ? 'badge-success' : 
                vaaniScore.level === 'good' ? 'badge-warning' : 'badge-error'
              }`}>
                {vaaniScore.emoji} {vaaniScore.score}
              </span>
            )}
          </div>

          {/* Right: Compact button group */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Tools ⚡ */}
            <button 
              onClick={() => { setShowToolbar(!showToolbar); setShowAccessMenu(false); }}
              className={`btn btn-ghost btn-icon w-9 h-9 transition-fast ${showToolbar ? 'bg-secondary' : ''}`}
              aria-label="टूल्स" 
              title="टूल्स"
            >
              ⚡
            </button>

            {/* Accessibility ♿ — opens sub-menu */}
            <button 
              onClick={() => { setShowAccessMenu(!showAccessMenu); setShowToolbar(false); }}
              className={`btn btn-ghost btn-icon w-9 h-9 transition-fast ${showAccessMenu ? 'bg-secondary' : ''}`}
              aria-label="सुलभता" 
              title="सुलभता"
            >
              ♿
            </button>

            {/* Mute */}
            <button 
              onClick={() => setMuted(!isMuted)}
              className="btn btn-ghost btn-icon w-9 h-9 transition-fast"
              aria-label={isMuted ? 'ध्वनि चालू' : 'ध्वनि बंद'}
            >
              {isMuted ? <VolumeX size={18} className="text-muted" /> : <Volume2 size={18} className="text-primary" />}
            </button>

            {/* Language Selector */}
            <LanguageSelector language={language} onSelect={setLanguageManual} isManual={isLanguageManual} />

            {/* Personal Dashboard */}
            <button 
              onClick={() => setShowPersonalDashboard(true)}
              className={`btn btn-ghost btn-icon w-9 h-9 transition-fast ${showPersonalDashboard ? 'bg-secondary' : ''}`}
              aria-label="डैशबोर्ड" 
              title="मेरा डैशबोर्ड"
            >
              📊
            </button>
          </div>
        </header>

        {/* ── Accessibility sub-menu ── */}
        {showAccessMenu && (
          <div className="flex flex-wrap gap-2 p-2 border-b border-[var(--vaani-border)] bg-[var(--vaani-bg)] flex-shrink-0 animate-fadeInDown">
            <button onClick={toggleCognitiveMode} className={`chip-btn ${cognitiveMode ? 'chip-active' : ''}`}>🧠 सरल मोड</button>
            <button onClick={toggleLargeText} className={`chip-btn ${largeText ? 'chip-active' : ''}`}>Aa बड़ा टेक्सट</button>
            <button onClick={toggleFullScreenPTT} className={`chip-btn ${fullScreenPTT ? 'chip-active' : ''}`}>📱 फुल स्क्रीन माइक</button>
            <button onClick={toggleHighContrast} className={`chip-btn ${highContrast ? 'chip-active' : ''}`}>◑ हाई कॉन्ट्रास्ट</button>
            <button onClick={toggleAutoRead} className={`chip-btn ${autoReadResponses ? 'chip-active' : ''}`} aria-label="स्वचालित पठन चालू/बंद">🔊 ऑटो पढ़ें</button>
            <button onClick={() => setShowIconMode(!showIconMode)} className={`chip-btn ${showIconMode ? 'chip-active' : ''}`}>⌨️ आइकन मोड</button>
          </div>
        )}

        {/* ── Feature Toolbar ── */}
        {showToolbar && (
          <div className="flex gap-2 p-2 border-b border-[var(--vaani-border)] bg-[var(--vaani-bg)] overflow-x-auto flex-shrink-0 animate-fadeInDown">
            {toolbarButtons.map(btn => (
              <button 
                key={btn.id} 
                onClick={() => { setActivePanel(btn.id); setShowToolbar(false); }}
                className="toolbar-btn"
              >
                <span>{btn.emoji}</span> {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Streak Banner ── */}
        <div className="px-3 pt-2 flex-shrink-0">
          <StreakBanner />
        </div>

        {/* ── Messages ── */}
        <div 
          role="log" 
          aria-live="polite" 
          aria-label="संदेश"
          id="chat-messages"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 flex flex-col gap-3"
        >
          {messages.length === 0 && !isLoading && (
            <SuggestionChips language={language} onSend={sendMessage} />
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} language={language} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Icon Card Grid ── */}
        {showIconMode && (
          <IconCardGrid 
            onSendMessage={sendMessage} 
            isVisible={showIconMode}
            onClose={() => setShowIconMode(false)}
          />
        )}

        {/* ── Quick Icon Strip (always visible for non-readers) ── */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '8px',
          padding: '6px 12px',
          borderTop: '1px solid var(--vaani-border)',
          backgroundColor: 'var(--vaani-bg)',
          flexShrink: 0,
        }}>
          {[
            { emoji: '🚜', prompt: 'मेरी खेती से जो आमदनी होती है उसे FD में लगाऊं या कहीं और? सबसे सुरक्षित विकल्प बताओ।' },
            { emoji: '🏥', prompt: 'इमरजेंसी फंड कितना रखना चाहिए और कहां रखूं? अगर अचानक हॉस्पिटल जाना पड़े तो?' },
            { emoji: '💒', prompt: 'शादी के लिए पैसे बचाना है। 2-3 साल में, सबसे अच्छा बचत विकल्प बताओ।' },
            { emoji: '📚', prompt: 'बच्चों की पढ़ाई के लिए कितना पैसा बचाना शुरू करूं? सबसे सुरक्षित तरीका बताओ।' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => sendMessage(item.prompt)}
              aria-label={item.prompt.substring(0, 40)}
              style={{
                width: '48px', height: '48px', borderRadius: '12px',
                border: '1px solid var(--vaani-border)',
                backgroundColor: 'var(--vaani-bg-secondary)',
                fontSize: '24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >{item.emoji}</button>
          ))}
        </div>

        {/* ── Input ── */}
        <div role="form" aria-label="संदेश भेजें" className="bg-[var(--vaani-bg)] border-t border-[var(--vaani-border)] flex-shrink-0">
          <ChatInput onSend={sendMessage} isLoading={isLoading} language={language} isMuted={isMuted} />
        </div>
      </div>

      {/* ── Feature Panels (Modals) ── */}
      {activePanel === 'scanner' && (
        <PassbookScanner
          onExtracted={(data) => {
            const summary = formatPassbookSummary(data);
            sendMessage(summary);
            setActivePanel(null);
          }}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === 'export' && <ExportSummary messages={messages} onClose={() => setActivePanel(null)} />}
      {activePanel === 'family' && <FamilyManager onClose={() => setActivePanel(null)} />}
      {activePanel === 'schemes' && <SchemeMatcher onClose={() => setActivePanel(null)} />}
      {activePanel === 'aa' && (
        <AccountAggregator
          onClose={() => setActivePanel(null)}
          onDataFetched={(data) => {
            const summary = `AA डेटा:\n🏦 ${data.bankName}\n💰 कुल शेष: ₹${data.totalBalance.toLocaleString('en-IN')}\n📊 बचत दर: ${data.savingsRate}%`;
            sendMessage(summary);
          }}
        />
      )}

      {/* Personal Dashboard */}
      {showPersonalDashboard && (
        <PersonalDashboard onClose={() => setShowPersonalDashboard(false)} />
      )}
    </>
  );
}

// ── Additional design system styles ──
const styles = `
.chip-btn {
  padding: 6px 12px;
  border-radius: var(--vaani-radius-full);
  font-size: var(--vaani-text-sm);
  font-weight: 600;
  border: 1px solid var(--vaani-border);
  background: var(--vaani-bg);
  cursor: pointer;
  color: var(--vaani-text);
  white-space: nowrap;
  transition: all var(--vaani-transition-fast);
}

.chip-btn:hover {
  background: var(--vaani-bg-secondary);
  border-color: var(--vaani-primary);
}

.chip-active {
  border: 2px solid var(--vaani-primary);
  background: rgba(15, 110, 86, 0.1);
  color: var(--vaani-primary);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--vaani-radius-full);
  border: 1px solid var(--vaani-border);
  background: var(--vaani-bg);
  cursor: pointer;
  font-size: var(--vaani-text-sm);
  font-weight: 600;
  white-space: nowrap;
  color: var(--vaani-text);
  transition: all var(--vaani-transition-fast);
}

.toolbar-btn:hover {
  background: var(--vaani-bg-secondary);
  border-color: var(--vaani-primary);
  transform: translateY(-1px);
  box-shadow: var(--vaani-shadow-sm);
}

.btn-ghost {
  background: transparent;
  color: var(--vaani-text);
}

.btn-ghost:hover {
  background: var(--vaani-bg-secondary);
}

.bg-warning\/10 {
  background-color: rgba(245, 158, 11, 0.1);
}

.border-warning {
  border-color: var(--vaani-warning);
}

.text-warning {
  color: var(--vaani-warning);
}

.bg-error\/10 {
  background-color: rgba(239, 68, 68, 0.1);
}

.border-error {
  border-color: var(--vaani-error);
}

.text-error {
  color: var(--vaani-error);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
