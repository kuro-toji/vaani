import { useState } from 'react';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { CognitiveModeProvider, useCognitiveMode } from './context/CognitiveModeContext';
import LandingPage from './pages/LandingPage';
import ChatWindow from './components/ChatWindow';
import CognitiveDashboard from './components/CognitiveDashboard';

function AppContent() {
  const [showApp, setShowApp] = useState(false);
  const { cognitiveMode } = useCognitiveMode();
  
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
        <AppContent />
      </CognitiveModeProvider>
    </AccessibilityProvider>
  );
}

export default App;
