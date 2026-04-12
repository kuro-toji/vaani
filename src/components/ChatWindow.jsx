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
import VaaniScoreGauge from './VaaniScoreGauge.jsx';
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
  const [activePanel, setActivePanel] = useState(null); // scanner, export, family, schemes, aa
  const [showToolbar, setShowToolbar] = useState(false);

  // Record streak on mount
  useEffect(() => {
    recordActivity();
  }, []);

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
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // VAANI Score
  const vaaniScore = calculateVaaniScore(messages);

  // Build className for accessibility modes
  const containerClass = [
    'flex-1', 'w-full', 'flex', 'flex-col',
    'bg-[var(--vaani-bg)]', 'text-[var(--vaani-text)]',
    'overflow-hidden',
    largeText ? 'vaani-large-text' : '',
    highContrast ? 'vaani-high-contrast' : '',
  ].filter(Boolean).join(' ');

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
        <div 
          role="alert" aria-live="assertive"
          style={{
            background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
            borderBottom: '1px solid #F59E0B',
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', fontSize: '13px', color: '#92400E',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          }}
        >
          <span>📶</span>
          <span>ऑफलाइन है — संदेश कतार में जमा होंगे</span>
        </div>
      )}

      <div className={containerClass}>
        {/* Premium Header */}
        <header
          role="banner"
          aria-label="Vaani चैट"
          style={{
            height: '60px',
            borderBottom: '1px solid var(--vaani-border)',
            padding: '0 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--vaani-bg)',
            backdropFilter: 'blur(20px)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--vaani-user-bubble)' }}>Vaani</span>
            {vaaniScore.score > 0 && (
              <span style={{
                padding: '2px 10px', borderRadius: '980px', fontSize: '12px', fontWeight: 700,
                background: vaaniScore.level === 'excellent' ? '#D1FAE5' : vaaniScore.level === 'good' ? '#FEF3C7' : '#FEE2E2',
                color: vaaniScore.level === 'excellent' ? '#065F46' : vaaniScore.level === 'good' ? '#92400E' : '#991B1B',
              }}>
                {vaaniScore.emoji} {vaaniScore.score}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Feature Toolbar Toggle */}
            <button onClick={() => setShowToolbar(!showToolbar)}
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: showToolbar ? '#E5E7EB' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s' }}
              aria-label="फीचर टूलबार" title="टूल्स"
            >⚡</button>

            <button onClick={toggleCognitiveMode}
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s' }}
              aria-pressed={cognitiveMode} aria-label="सरल मोड" title="सरल मोड"
            >🧠</button>

            <button onClick={toggleLargeText}
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: largeText ? '#E5E7EB' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#0F6E56', transition: 'all 0.2s' }}
              aria-pressed={largeText} aria-label="बड़ा टेक्सट"
            >Aa</button>

            <button onClick={toggleFullScreenPTT}
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s' }}
              aria-pressed={fullScreenPTT} aria-label="पूर्ण स्क्रीन माइक"
            >📱</button>

            <button onClick={toggleHighContrast}
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: highContrast ? '#E5E7EB' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s' }}
              aria-pressed={highContrast} aria-label="हाई कॉन्ट्रास्ट"
            >◑</button>

            <button onClick={() => setShowIconMode(!showIconMode)}
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: showIconMode ? '#E5E7EB' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s' }}
              aria-pressed={showIconMode} aria-label="आइकन मोड"
            >⌨️</button>

            <button onClick={() => setMuted(!isMuted)}
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              aria-label={isMuted ? 'ध्वनि चालू' : 'ध्वनि बंद'}
            >
              {isMuted ? <VolumeX size={20} color="#9CA3AF" /> : <Volume2 size={20} color="var(--vaani-user-bubble)" />}
            </button>

            <LanguageSelector language={language} onSelect={setLanguageManual} isManual={isLanguageManual} />
          </div>
        </header>

        {/* Feature Toolbar */}
        {showToolbar && (
          <div style={{
            display: 'flex', gap: '8px', padding: '10px 16px',
            borderBottom: '1px solid var(--vaani-border)', background: 'var(--vaani-bg)',
            overflowX: 'auto', flexShrink: 0,
          }}>
            {toolbarButtons.map(btn => (
              <button key={btn.id} onClick={() => { setActivePanel(btn.id); setShowToolbar(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '980px', border: '1px solid var(--vaani-border)',
                  background: 'var(--vaani-bg)', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                  color: 'var(--vaani-text)',
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#0F6E56'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--vaani-border)'}
              >
                <span>{btn.emoji}</span> {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Streak Banner */}
        <div style={{ padding: '8px 16px 0', flexShrink: 0 }}>
          <StreakBanner />
        </div>

        {/* Messages */}
        <div
          role="log" aria-live="polite" aria-label="संदेश"
          style={{
            flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain',
            padding: '16px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
            display: 'flex', flexDirection: 'column', gap: '12px',
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

        {/* Icon Card Grid */}
        {showIconMode && (
          <IconCardGrid 
            onSendMessage={sendMessage} 
            isVisible={showIconMode}
            onClose={() => setShowIconMode(false)}
          />
        )}

        {/* Input */}
        <div role="form" aria-label="संदेश भेजें" style={{
          background: 'var(--vaani-bg)', borderTop: '1px solid var(--vaani-border)',
          padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}>
          <ChatInput onSend={sendMessage} isLoading={isLoading} language={language} isMuted={isMuted} />
        </div>
      </div>

      {/* Feature Panels (Modals) */}
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
      {activePanel === 'export' && <ExportSummary onClose={() => setActivePanel(null)} />}
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
