import { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat.js';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import SuggestionChips from './SuggestionChips.jsx';
import LanguageSelector from './LanguageSelector.jsx';
import ChatInput from './ChatInput.jsx';
import FlashNotification from './FlashNotification.jsx';
import IconCardGrid from './IconCardGrid.jsx';
import { Volume2, VolumeX } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { useCognitiveMode } from '../context/CognitiveModeContext.jsx';
import CognitiveDashboard from './CognitiveDashboard.jsx';
import FullScreenPTT from './FullScreenPTT.jsx';
import StreakBanner from './StreakBanner.jsx';
import PassbookScanner from './PassbookScanner.jsx';
import ExportSummary from './ExportSummary.jsx';
import FamilyManager from './FamilyManager.jsx';
import SchemeMatcher from './SchemeMatcher.jsx';
import AccountAggregator from './AccountAggregator.jsx';
import { calculateVaaniScore } from '../services/vaaniScoreService.js';
import { recordActivity } from '../services/streakService.js';
import { detectAndCaptureLead } from '../services/leadService.js';

export default function ChatWindow() {
  const { cognitiveMode, toggleCognitiveMode } = useCognitiveMode();
  const { messages, isLoading, language, isLanguageManual, sendMessage, setLanguageManual, isMuted, setMuted } = useChat();
  const messagesEndRef = useRef(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { largeText, highContrast, fullScreenPTT, toggleLargeText, toggleHighContrast, toggleFullScreenPTT } = useAccessibility();
  const [showIconMode, setShowIconMode] = useState(false);
  const [flashTrigger, setFlashTrigger] = useState(0);
  const prevMessageCount = useRef(messages.length);

  // Feature panel states
  const [activePanel, setActivePanel] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showAccessMenu, setShowAccessMenu] = useState(false);

  // Record streak on mount
  useEffect(() => { recordActivity(); }, []);

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
      
      {/* Offline Banner */}
      {!isOnline && (
        <div role="alert" aria-live="assertive" style={{
          background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
          borderBottom: '1px solid #F59E0B', padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '8px', fontSize: '13px', color: '#92400E',
        }}>
          <span>📶</span><span>ऑफलाइन है — संदेश कतार में जमा होंगे</span>
        </div>
      )}

      <div style={{
        flex: 1, width: '100%', display: 'flex', flexDirection: 'column',
        background: 'var(--vaani-bg)', color: 'var(--vaani-text)',
        overflow: 'hidden', height: '100dvh',
        fontSize: largeText ? '20px' : undefined,
      }}>
        {/* ── Header ── */}
        <header style={{
          height: '56px', minHeight: '56px',
          borderBottom: '1px solid var(--vaani-border)',
          padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--vaani-bg)', flexShrink: 0, position: 'relative', zIndex: 50,
        }}>
          {/* Left: Title + Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--vaani-user-bubble)' }}>Vaani</span>
            {vaaniScore.score > 0 && (
              <span style={{
                padding: '2px 8px', borderRadius: '980px', fontSize: '11px', fontWeight: 700,
                background: vaaniScore.level === 'excellent' ? '#D1FAE5' : vaaniScore.level === 'good' ? '#FEF3C7' : '#FEE2E2',
                color: vaaniScore.level === 'excellent' ? '#065F46' : vaaniScore.level === 'good' ? '#92400E' : '#991B1B',
              }}>
                {vaaniScore.emoji} {vaaniScore.score}
              </span>
            )}
          </div>

          {/* Right: Compact button group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            {/* Tools ⚡ */}
            <button onClick={() => { setShowToolbar(!showToolbar); setShowAccessMenu(false); }}
              style={headerBtn(showToolbar)} aria-label="टूल्स" title="टूल्स">⚡</button>

            {/* Accessibility ♿ — opens sub-menu */}
            <button onClick={() => { setShowAccessMenu(!showAccessMenu); setShowToolbar(false); }}
              style={headerBtn(showAccessMenu)} aria-label="सुलभता" title="सुलभता">♿</button>

            {/* Mute */}
            <button onClick={() => setMuted(!isMuted)}
              style={headerBtn(false)} aria-label={isMuted ? 'ध्वनि चालू' : 'ध्वनि बंद'}>
              {isMuted ? <VolumeX size={18} color="#9CA3AF" /> : <Volume2 size={18} color="var(--vaani-user-bubble)" />}
            </button>

            {/* Language Selector */}
            <LanguageSelector language={language} onSelect={setLanguageManual} isManual={isLanguageManual} />
          </div>
        </header>

        {/* ── Accessibility sub-menu ── */}
        {showAccessMenu && (
          <div style={{
            display: 'flex', gap: '6px', padding: '8px 12px', flexWrap: 'wrap',
            borderBottom: '1px solid var(--vaani-border)', background: 'var(--vaani-bg)', flexShrink: 0,
          }}>
            <button onClick={toggleCognitiveMode} style={chipBtn(cognitiveMode)}>🧠 सरल मोड</button>
            <button onClick={toggleLargeText} style={chipBtn(largeText)}>Aa बड़ा टेक्सट</button>
            <button onClick={toggleFullScreenPTT} style={chipBtn(fullScreenPTT)}>📱 फुल स्क्रीन माइक</button>
            <button onClick={toggleHighContrast} style={chipBtn(highContrast)}>◑ हाई कॉन्ट्रास्ट</button>
            <button onClick={() => setShowIconMode(!showIconMode)} style={chipBtn(showIconMode)}>⌨️ आइकन मोड</button>
          </div>
        )}

        {/* ── Feature Toolbar ── */}
        {showToolbar && (
          <div style={{
            display: 'flex', gap: '8px', padding: '8px 12px',
            borderBottom: '1px solid var(--vaani-border)', background: 'var(--vaani-bg)',
            overflowX: 'auto', flexShrink: 0,
          }}>
            {toolbarButtons.map(btn => (
              <button key={btn.id} onClick={() => { setActivePanel(btn.id); setShowToolbar(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '980px', border: '1px solid var(--vaani-border)',
                  background: 'var(--vaani-bg)', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  whiteSpace: 'nowrap', color: 'var(--vaani-text)',
                }}
              >
                <span>{btn.emoji}</span> {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Streak Banner ── */}
        <div style={{ padding: '6px 12px 0', flexShrink: 0 }}>
          <StreakBanner />
        </div>

        {/* ── Messages ── */}
        <div role="log" aria-live="polite" aria-label="संदेश"
          style={{
            flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain',
            padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: '10px',
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

        {/* ── Icon Card Grid ── */}
        {showIconMode && (
          <IconCardGrid 
            onSendMessage={sendMessage} 
            isVisible={showIconMode}
            onClose={() => setShowIconMode(false)}
          />
        )}

        {/* ── Input ── */}
        <div role="form" aria-label="संदेश भेजें" style={{
          background: 'var(--vaani-bg)', borderTop: '1px solid var(--vaani-border)',
        }}>
          <ChatInput onSend={sendMessage} isLoading={isLoading} language={language} isMuted={isMuted} />
        </div>
      </div>

      {/* ── Feature Panels (Modals) ── */}
      {activePanel === 'scanner' && (
        <PassbookScanner
          onExtracted={(data) => {
            const summary = `पासबुक स्कैन:\n🏦 ${data.bankName || 'Unknown'}\n💰 शेष: ₹${data.balance?.toLocaleString('en-IN') || 'N/A'}\n📋 खाता: ${data.accountNumber || 'N/A'}`;
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
    </>
  );
}

// ── Style helpers ──
function headerBtn(active) {
  return {
    width: '36px', height: '36px', borderRadius: '50%', border: 'none',
    background: active ? '#E5E7EB' : 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', transition: 'all 0.15s', flexShrink: 0,
  };
}

function chipBtn(active) {
  return {
    padding: '6px 12px', borderRadius: '980px', fontSize: '13px', fontWeight: 600,
    border: active ? '2px solid #0F6E56' : '1px solid var(--vaani-border)',
    background: active ? '#E1F5EE' : 'var(--vaani-bg)', cursor: 'pointer',
    color: active ? '#0F6E56' : 'var(--vaani-text)', whiteSpace: 'nowrap',
  };
}
