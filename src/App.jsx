import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AppPage from './pages/AppPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DemoPage from './pages/DemoPage.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--gold)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Loading...</span>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/auth" />;
}

function AppRoutes() {
  const [appStarted, setAppStarted] = useState(false);
  const handleStart = () => setAppStarted(true);

  return (
    <Routes>
      <Route path="/" element={appStarted ? <Navigate to="/app" /> : <LandingPage onStart={handleStart} />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/app" element={<PrivateRoute><AppPage /></PrivateRoute>} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    const playWelcome = () => {
      if (!('speechSynthesis' in window)) return;
      const lang = localStorage.getItem('vaani_language') || 'hi';
      const messages = {
        hi: 'वाणी में आपका स्वागत है। मैं वाणी हूँ, आपकी वित्तीय सहायक।',
        en: 'Welcome to Vaani. I am Vaani, your financial assistant.',
        default: 'Welcome to Vaani. I am your financial assistant.',
      };
      const msg = messages[lang] || messages.default;
      const bcp47 = { hi: 'hi-IN', en: 'en-IN', bn: 'bn-IN', te: 'te-IN', ta: 'ta-IN', mr: 'mr-IN' };
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.lang = bcp47[lang] || 'hi-IN';
      utterance.rate = 0.9;
      utterance.volume = 0.8;
      setTimeout(() => window.speechSynthesis.speak(utterance), 800);
    };
    if (window.speechSynthesis.getVoices().length > 0) {
      playWelcome();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', playWelcome, { once: true });
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
