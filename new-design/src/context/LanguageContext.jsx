import { createContext, useContext, useState, useEffect } from 'react';

/**
 * LanguageProvider — global language state for the entire app.
 * Reads from localStorage on mount, auto-syncs on change.
 * Used by LandingPage (pincode detection), ChatWindow, useChat.
 */
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('vaani_language') || 'hi'; } catch { return 'hi'; }
  });

  useEffect(() => {
    try { localStorage.setItem('vaani_language', language); } catch {}
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