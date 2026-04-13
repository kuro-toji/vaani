import { createContext, useContext, useState, useEffect } from 'react';

/**
 * AccessibilityContext — Manages accessibility preferences.
 * 
 * How it works:
 * - Toggles set CSS custom properties on <html> via classes
 * - Components read these via var(--vaani-*) in their inline styles
 * - Large text: components check `largeText` prop and increase their own font sizes
 * - High contrast: CSS variables change, components using var() auto-update
 * - Default UI is 100% unaffected — no global font overrides
 */
const AccessibilityContext = createContext({
  largeText: false,
  highContrast: false,
  fullScreenPTT: false,
  toggleLargeText: () => {},
  toggleHighContrast: () => {},
  toggleFullScreenPTT: () => {},
});

const loadPref = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v === '1';
  } catch {
    return fallback;
  }
};

export function AccessibilityProvider({ children }) {
  const [largeText, setLargeText] = useState(() => loadPref('vaani_largeText', false));
  const [highContrast, setHighContrast] = useState(() => loadPref('vaani_highContrast', false));
  const [fullScreenPTT, setFullScreenPTT] = useState(() => loadPref('vaani_fullScreenPTT', false));
  const [announcement, setAnnouncement] = useState('');

  // Apply high-contrast class to <html> (this flips CSS variables)
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('vaani-high-contrast', highContrast);
    try { localStorage.setItem('vaani_highContrast', highContrast ? '1' : '0'); } catch {}
  }, [highContrast]);

  // Large text is handled by components checking the `largeText` value,
  // NOT by adding a CSS class that hijacks every element's font-size.
  useEffect(() => {
    try { localStorage.setItem('vaani_largeText', largeText ? '1' : '0'); } catch {}
  }, [largeText]);

  useEffect(() => {
    try { localStorage.setItem('vaani_fullScreenPTT', fullScreenPTT ? '1' : '0'); } catch {}
  }, [fullScreenPTT]);

  const announce = (msg) => {
    setAnnouncement(msg);
    setTimeout(() => setAnnouncement(''), 3000);
  };

  const toggleLargeText = () => setLargeText(p => { const n = !p; announce(n ? 'बड़ा टेक्सट चालू' : 'बड़ा टेक्सट बंद'); return n; });
  const toggleHighContrast = () => setHighContrast(p => { const n = !p; announce(n ? 'हाई कॉन्ट्रास्ट चालू' : 'हाई कॉन्ट्रास्ट बंद'); return n; });
  const toggleFullScreenPTT = () => setFullScreenPTT(p => { const n = !p; announce(n ? 'फुल स्क्रीन माइक चालू' : 'फुल स्क्रीन माइक बंद'); return n; });

  return (
    <AccessibilityContext.Provider value={{ largeText, highContrast, fullScreenPTT, toggleLargeText, toggleHighContrast, toggleFullScreenPTT }}>
      {children}
      <div role="status" aria-live="assertive" aria-atomic="true"
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

export default AccessibilityContext;