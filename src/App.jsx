import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { CognitiveModeProvider, useCognitiveMode } from './context/CognitiveModeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useVoice } from './hooks/useVoice.js';
import LandingPage from './pages/LandingPage';
import ChatWindow from './components/ChatWindow';
import CognitiveDashboard from './components/CognitiveDashboard';
import OnboardingFlow from './components/OnboardingFlow';
import { ChatPageWrapper } from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import ErrorBoundary from './components/ErrorBoundary';
import AuthPage from './pages/AuthPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
      <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
    </div>
  );
  return user ? children : <Navigate to="/auth" />;
}

function AppContent() {
  const [showApp, setShowApp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
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
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
            <CognitiveModeProvider>
              <ToastProvider>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                    <Route path="/chat" element={<PrivateRoute><ChatPageWrapper /></PrivateRoute>} />
                    <Route path="/*" element={<AppContent />} />
                  </Routes>
                </ErrorBoundary>
              </ToastProvider>
            </CognitiveModeProvider>
          </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;