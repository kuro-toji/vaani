import { createContext, useContext, useState, useEffect, useRef } from 'react';

/**
 * Trigger a water-drop ripple animation on the next language change.
 * Components listening to 'vaani:triggerWaterDrop' will activate their animation.
 */
export function triggerWaterDrop() {
  window.dispatchEvent(new CustomEvent('vaani:triggerWaterDrop', { detail: { timestamp: Date.now() } }));
}

/**
 * Subscribe to water-drop triggers — call this in LandingPage to start the animation.
 * Returns a useEffect-like cleanup function.
 */
export function onWaterDrop(callback) {
  const handler = (e) => callback(e.detail);
  window.addEventListener('vaani:triggerWaterDrop', handler);
  return () => window.removeEventListener('vaani:triggerWaterDrop', handler);
}

const LanguageContext = createContext(null);

/**
 * LanguageProvider — global language state for the entire app.
 * 
 * On mount, reads from localStorage ('vaani_language') if available.
 * When lang code changes, syncs to localStorage automatically.
 * LandingPage and OnboardingFlow write to this; useChat and ChatWindow read from it.
 */
export function LanguageProvider({ children, initialLang }) {
  const isFirstRender = useRef(true);

  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('vaani_language') || initialLang || 'hi';
    } catch {
      return initialLang || 'hi';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vaani_language', language);
    } catch {}
    // Don't trigger water drop on initial render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    triggerWaterDrop();
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export default LanguageContext;