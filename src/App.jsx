import { useState, useEffect } from 'react';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { CognitiveModeProvider, useCognitiveMode } from './context/CognitiveModeContext';
import { ToastProvider } from './context/ToastContext';
import LandingPage from './pages/LandingPage';
import ChatWindow from './components/ChatWindow';
import CognitiveDashboard from './components/CognitiveDashboard';
import OnboardingFlow from './components/OnboardingFlow';
// import PartnerDashboard from './pages/PartnerDashboard';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const [showApp, setShowApp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const { cognitiveMode } = useCognitiveMode();

  // Check for first visit (onboarding) and hash routes
  useEffect(() => {
    // [DISABLED] Check URL hash for dashboard route
    // if (window.location.hash === '#/dashboard') {
    //   setShowDashboard(true);
    // }

    // Show onboarding on first visit
    try {
      const onboardingDone = localStorage.getItem('vaani_onboarding_complete');
      if (!onboardingDone) {
        setShowOnboarding(true);
      }
    } catch {}

    // [DISABLED] Listen for hash changes
    // const handleHash = () => {
    //   if (window.location.hash === '#/dashboard') {
    //     setShowDashboard(true);
    //   } else {
    //     setShowDashboard(false);
    //   }
    // };
    // window.addEventListener('hashchange', handleHash);
    // return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // [DISABLED] Partner Dashboard route
  // if (showDashboard) {
  //   return (
  //     <PartnerDashboard onBack={() => {
  //       window.location.hash = '';
  //       setShowDashboard(false);
  //     }} />
  //   );
  // }

  // Onboarding for first-time users
  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />;
  }
  
  return (
    <>
      {showApp ? (
        cognitiveMode ? (
          <CognitiveDashboard />
        ) : (
          <ChatWindow />
        )
      ) : (
        <LandingPage onStart={() => setShowApp(true)} />
      )}
    </>
  );
}

function App() {
  return (
    <AccessibilityProvider>
      <CognitiveModeProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </ToastProvider>
      </CognitiveModeProvider>
    </AccessibilityProvider>
  );
}

export default App;
