import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { CognitiveModeProvider, useCognitiveMode } from './context/CognitiveModeContext';
import { ToastProvider } from './context/ToastContext';
import { useVoice } from './hooks/useVoice.js';
import LandingPage from './pages/LandingPage';
import ChatWindow from './components/ChatWindow';
import CognitiveDashboard from './components/CognitiveDashboard';
import OnboardingFlow from './components/OnboardingFlow';
import DashboardPage from './pages/DashboardPage';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const [showApp, setShowApp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showA11yPrompt, setShowA11yPrompt] = useState(false);
  const { cognitiveMode } = useCognitiveMode();
  const { speak } = useVoice();

  useEffect(() => {
    window.vaaniSpeak = speak;
    return () => { delete window.vaaniSpeak; };
  }, [speak]);

  useEffect(() => {
    const playWelcome = () => {
      if (!('speechSynthesis' in window)) return;
      const lang = localStorage.getItem('vaani_language') || 'hi';
      const welcomeMessages = {
        hi: 'वाणी में आपका स्वागत है। मैं वाणी हूँ, आपकी वित्तीय सहायक।',
        en: 'Welcome to Vaani. I am Vaani, your financial assistant.',
        bn: 'ভাণীতে আপনাকে স্বাগতম। আমি ভাণী, আপনার আর্থिक সহায়ক।',
        te: 'వాని కి స్వాగతం। నేను వాని, మీ ఆర్థిక సహాయకురాలు।',
        ta: 'வாணிக்கு வரவேற்கிறோம்। நான் வாணி, உங்கள் நிதி உதவியாளர்।',
        mr: 'वाणीमध्ये आपले स्वागत आहे। मी वाणी आहे, तुमची आर्थिक सहाय्यक।',
        default: 'Welcome to Vaani. I am your financial assistant.'
      };
      const msg = welcomeMessages[lang] || welcomeMessages.default;
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.lang = { hi: 'hi-IN', en: 'en-IN', bn: 'bn-IN', te: 'te-IN', ta: 'ta-IN', mr: 'mr-IN' }[lang] || 'hi-IN';
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      }, 800);
    };
    if (window.speechSynthesis.getVoices().length > 0) {
      playWelcome();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', playWelcome, { once: true });
    }
  }, []);

  useEffect(() => {
    const detected = localStorage.getItem('vaani_a11y_detected');
    if (detected) return;
    setTimeout(() => setShowA11yPrompt(true), 4000);
  }, []);

  useEffect(() => {
    try {
      const onboardingDone = localStorage.getItem('vaani_onboarding_complete');
      if (!onboardingDone) setShowOnboarding(true);
    } catch {}
  }, []);

  const renderView = () => {
    if (showOnboarding) return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />;
    if (showApp) return cognitiveMode ? <CognitiveDashboard /> : <ChatWindow />;
    return <LandingPage onStart={() => setShowApp(true)} />;
  };

  return (
    <>
      {renderView()}
      {showA11yPrompt && !showOnboarding && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#0F172A', border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: '20px', padding: '20px 24px', zIndex: 9999,
          maxWidth: '340px', width: 'calc(100% - 40px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          <style>{`@keyframes slideUp { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }`}</style>
          <p style={{ color: 'white', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
            Do you need any accessibility help?
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '16px' }}>
            क्या आपको किसी सहायता की आवश्यकता है?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: '👁️ I am visually impaired', key: 'visual' },
              { label: '🤚 I have motor difficulty', key: 'motor' },
              { label: '👴 I prefer large text', key: 'elderly' },
              { label: '✅ I am fine, no help needed', key: 'none' },
            ].map(opt => (
              <button key={opt.key} onClick={() => {
                localStorage.setItem('vaani_a11y_detected', opt.key);
                setShowA11yPrompt(false);
                if (opt.key === 'visual') { localStorage.setItem('vaani_autoRead', '1'); localStorage.setItem('vaani_fullScreenPTT', '1'); }
                if (opt.key === 'motor') { localStorage.setItem('vaani_fullScreenPTT', '1'); }
                if (opt.key === 'elderly') { localStorage.setItem('vaani_largeText', '1'); }
                if (opt.key !== 'none') window.location.reload();
              }} style={{
                padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >{opt.label}</button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AccessibilityProvider>
          <CognitiveModeProvider>
            <ToastProvider>
              <ErrorBoundary>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/*" element={<AppContent />} />
                </Routes>
              </ErrorBoundary>
            </ToastProvider>
          </CognitiveModeProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;