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
import TrafficLightDashboard from './TrafficLightDashboard.jsx';
import { calculateVaaniScore } from '../services/vaaniScoreService.js';
import { recordActivity } from '../services/streakService.js';
import { detectAndCaptureLead } from '../services/leadService.js';
import { vibrateAISpoke } from '../hooks/useVibration.js';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation.js';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function ChatWindow() {
  const { cognitiveMode, toggleCognitiveMode } = useCognitiveMode();
  const { messages, isLoading, language, isLanguageManual, sendMessage, setLanguageManual, setMuted, isMuted, error } = useChat();
  const { speak } = useVoice();
  const { largeText, highContrast, fullScreenPTT, autoReadResponses, toggleLargeText, toggleHighContrast, toggleFullScreenPTT, toggleAutoRead } = useAccessibility();
  const { language: globalLanguage, setLanguage: setGlobalLanguage } = useLanguage();
  const messagesEndRef = useRef(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIconMode, setShowIconMode] = useState(false);
  const [showTrafficLight, setShowTrafficLight] = useState(false);
  const [voiceNavEnabled, setVoiceNavEnabled] = useState(false);
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

  // Auto-read new AI responses aloud when autoReadResponses is enabled
  useEffect(() => {
    if (!autoReadResponses || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last?.id !== 'greeting_assistant') {
      window.vaaniSpeak?.(last.content, language);
    }
  }, [messages, autoReadResponses, language]);

  // Vibrate when AI responds (if auto-read is on)
  useEffect(() => {
    if (!autoReadResponses || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      vibrateAISpoke();
    }
  }, [messages, autoReadResponses]);

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

  // Sync global language changes (from LandingPage detection) → useChat's manual mode
  useEffect(() => {
    if (globalLanguage) {
      setLanguageManual(globalLanguage);
    }
  }, [globalLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  // VAANI Score
  const vaaniScore = calculateVaaniScore(messages);

  const { isActive: voiceNavActive } = useVoiceNavigation({
    enabled: voiceNavEnabled,
    onBack: () => window.history.back(),
    onSend: () => sendMessage(''),
    onMute: () => setMuted(true),
    onUnmute: () => setMuted(false),
    onSimpleMode: () => setShowTrafficLight(p => !p),
    onIconMode: () => setShowIconMode(p => !p),
  });

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
      <div className="flex flex-col flex-1 w-full text-[var(--vaani-text)] overflow-hidden h-full min-h-screen transition"
        style={{ fontSize: largeText ? '20px' : undefined }}
      >
        {/* ── Apple-style Header ── */}
        <header style={{
          display: 'flex', alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(15,23,42,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          gap: '8px',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          {/* Left: Back button */}
          <button
            aria-label="वापस"
            style={{
              width: '44px', height: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderRadius: '50%',
              color: '#8E8E93',
              fontSize: '28px',
              flexShrink: 0,
            }}
          >‹</button>

          {/* Center: stacked title + online status */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '17px', fontWeight: 600, color: '#1C1C1E', lineHeight: 1.2 }}>
              Vaani
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34C759', display: 'inline-block' }} />
              <span style={{ fontSize: '12px', color: '#34C759', fontWeight: 400 }}>Online</span>
            </div>
          </div>

          {/* Right: condensed icon buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            {/* Mute */}
            <button 
              onClick={() => setMuted(!isMuted)}
              style={{
                width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderRadius: '50%',
              }}
              aria-label={isMuted ? 'ध्वनि चालू' : 'ध्वनि बंद'}
            >
              {isMuted ? <VolumeX size={18} color="#8E8E93" /> : <Volume2 size={18} color="#0F6E56" />}
            </button>

            {/* Language Selector */}
            <LanguageSelector language={language} onSelect={(code) => { setLanguageManual(code); setGlobalLanguage(code); }} isManual={isLanguageManual} />

            {/* Personal Dashboard */}
            <button 
              onClick={() => setShowPersonalDashboard(true)}
              style={{
                width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderRadius: '50%',
                fontSize: '20px',
              }}
              aria-label="डैशबोर्ड"
            >
              📊
            </button>
          </div>
        </header>

        {/* ── Messages (iOS grouped background) ── */}
        <div 
          role="log" 
          aria-live="polite" 
          aria-label="संदेश"
          id="chat-messages"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 16px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.15) transparent',
          }}
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

        {/* ── Traffic Light Dashboard ── */}
        {showTrafficLight && (
          <TrafficLightDashboard
            balance={0}
            lastMsg={messages[messages.length - 1]?.content || ''}
            onAsk={(text) => { sendMessage(text); setShowTrafficLight(false); }}
          />
        )}

        {/* ── Icon Card Grid ── */}
        {showIconMode && (
          <IconCardGrid 
            onSendMessage={sendMessage} 
            isVisible={showIconMode}
            onClose={() => setShowIconMode(false)}
          />
        )}

        {/* ── Quick Icon Strip ── */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '8px',
          padding: '6px 12px',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          flexShrink: 0,
        }}>
          {[
            { emoji: '🎙️', prompt: '__VOICE_NAV__' },
            { emoji: '🚦', prompt: '__TRAFFIC_LIGHT__' },
            { emoji: '🚜', prompt: 'मेरी खेती से जो आमदनी होती है उसे FD में लगाऊं या कहीं और? सबसे सुरक्षित विकल्प बताओ।' },
            { emoji: '🏥', prompt: 'इमरजेंसी फंड कितना रखना चाहिए और कहां रखूं? अगर अचानक हॉस्पिटल जाना पड़े तो?' },
            { emoji: '💒', prompt: 'शादी के लिए पैसे बचाना है। 2-3 साल में, सबसे अच्छा बचत विकल्प बताओ।' },
            { emoji: '📚', prompt: 'बच्चों की पढ़ाई के लिए कितना पैसा बचाना शुरू करूं? सबसे सुरक्षित तरीका बताओ।' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => {
                if (item.prompt === '__VOICE_NAV__') {
                  setVoiceNavEnabled(p => !p);
                } else if (item.prompt === '__TRAFFIC_LIGHT__') {
                  setShowTrafficLight(p => !p);
                } else {
                  sendMessage(item.prompt);
                }
              }}
              aria-label={item.prompt === '__TRAFFIC_LIGHT__' ? 'Traffic Light Dashboard' : item.prompt.substring(0, 40)}
              style={{
                width: '48px', height: '48px', borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)',
                backgroundColor: 'rgba(255,255,255,0.8)',
                fontSize: '24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >{item.emoji}</button>
          ))}
        </div>

        {/* ── Input (iOS Messages style) ── */}
        <div role="form" aria-label="संदेश भेजें" style={{
          padding: '12px 16px 20px',
          background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          flexShrink: 0,
        }}>
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

.bg-warning\\/10 {
  background-color: rgba(245, 158, 11, 0.1);
}

.border-warning {
  border-color: var(--vaani-warning);
}

.text-warning {
  color: var(--vaani-warning);
}

.bg-error\\/10 {
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
