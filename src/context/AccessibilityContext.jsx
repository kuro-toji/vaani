import { createContext, useContext, useState, useEffect } from 'react';

/**
 * AccessibilityContext - Manages accessibility preferences
 * - Large text mode: increases base font size to 1.25rem
 * - High contrast mode: changes color scheme for better visibility
 */
const AccessibilityContext = createContext({
  largeText: false,
  highContrast: false,
  toggleLargeText: () => {},
  toggleHighContrast: () => {},
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

  const toggleLargeText = () => setLargeText(prev => !prev);
  const toggleHighContrast = () => setHighContrast(prev => !prev);

  return (
    <AccessibilityContext.Provider value={{ largeText, highContrast, toggleLargeText, toggleHighContrast }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    // Return defaults if context not available (for SSR or if provider missing)
    return { largeText: false, highContrast: false, toggleLargeText: () => {}, toggleHighContrast: () => {} };
  }
  return context;
}

export default AccessibilityContext;