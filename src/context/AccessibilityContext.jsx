import { createContext, useContext, useState, useEffect } from 'react';

/**
 * AccessibilityContext - Manages accessibility preferences
 * - Large text mode: increases base font size to 1.25rem
 * - High contrast mode: changes color scheme for better visibility
 */
const AccessibilityContext = createContext({
  largeText: false,
  highContrast: false,
  fullScreenPTT: false,
  toggleLargeText: () => {},
  toggleHighContrast: () => {},
  toggleFullScreenPTT: () => {},
});

// Load preferences from localStorage
const loadPreference = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    if (stored === '1' || stored === 'true') return true;
    if (stored === '0' || stored === 'false') return false;
    return defaultValue;
  } catch {
    return defaultValue;
  }
};

export function AccessibilityProvider({ children }) {
  const [largeText, setLargeText] = useState(() => loadPreference('vaani_largeText', false));
  const [highContrast, setHighContrast] = useState(() => loadPreference('vaani_highContrast', false));
  const [fullScreenPTT, setFullScreenPTT] = useState(() => loadPreference('vaani_fullScreenPTT', false));

  // Persist preferences when they change
  useEffect(() => {
    try {
      localStorage.setItem('vaani_largeText', largeText ? '1' : '0');
    } catch {}
  }, [largeText]);

  useEffect(() => {
    try {
      localStorage.setItem('vaani_highContrast', highContrast ? '1' : '0');
    } catch {}
  }, [highContrast]);

  useEffect(() => {
    try {
      localStorage.setItem('vaani_fullScreenPTT', fullScreenPTT ? '1' : '0');
    } catch {}
  }, [fullScreenPTT]);

  const toggleLargeText = () => setLargeText(prev => !prev);
  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const toggleFullScreenPTT = () => setFullScreenPTT(prev => !prev);

  return (
    <AccessibilityContext.Provider value={{ largeText, highContrast, fullScreenPTT, toggleLargeText, toggleHighContrast, toggleFullScreenPTT }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    // Return defaults if context not available (for SSR or if provider missing)
    return { largeText: false, highContrast: false, fullScreenPTT: false, toggleLargeText: () => {}, toggleHighContrast: () => {}, toggleFullScreenPTT: () => {} };
  }
  return context;
}

export default AccessibilityContext;