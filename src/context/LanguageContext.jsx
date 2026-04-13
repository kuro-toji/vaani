import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

/**
 * LanguageProvider — global language state for the entire app.
 * 
 * On mount, reads from localStorage ('vaani_language') if available.
 * When lang code changes, syncs to localStorage automatically.
 * LandingPage and OnboardingFlow write to this; useChat and ChatWindow read from it.
 */
export function LanguageProvider({ children, initialLang }) {
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