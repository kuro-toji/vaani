import { createContext, useContext, useState, useEffect } from 'react';

/**
 * AccessibilityContext — Manages accessibility preferences.
 * Applies CSS classes directly to <html> element so they cascade globally.
 *
 * Features:
 * - Large text mode: increases all font sizes via CSS cascade
 * - High contrast mode: switches to high-contrast color scheme
 * - Full-screen PTT: entire screen becomes a microphone button
 * - Screen reader announcements via aria-live region
 */
const AccessibilityContext = createContext({
  largeText: false,
  highContrast: false,
  fullScreenPTT: false,
  toggleLargeText: () => {},
  toggleHighContrast: () => {},
  toggleFullScreenPTT: () => {},
});

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
  const [announcement, setAnnouncement] = useState('');

  // ── Apply CSS classes to <html> so they cascade globally ──
  useEffect(() => {
    const html = document.documentElement;
    if (largeText) {
      html.classList.add('vaani-large-text');
    } else {
      html.classList.remove('vaani-large-text');
    }
    try { localStorage.setItem('vaani_largeText', largeText ? '1' : '0'); } catch {}
  }, [largeText]);

  useEffect(() => {
    const html = document.documentElement;
    if (highContrast) {
      html.classList.add('vaani-high-contrast');
    } else {
      html.classList.remove('vaani-high-contrast');
    }
    try { localStorage.setItem('vaani_highContrast', highContrast ? '1' : '0'); } catch {}
  }, [highContrast]);

  useEffect(() => {
    try { localStorage.setItem('vaani_fullScreenPTT', fullScreenPTT ? '1' : '0'); } catch {}
  }, [fullScreenPTT]);

  // Announce mode changes to screen readers
  const announce = (msg) => {
    setAnnouncement(msg);
    setTimeout(() => setAnnouncement(''), 3000);
  };

  const toggleLargeText = () => {
    setLargeText(prev => {
      const next = !prev;
      announce(next ? 'बड़ा टेक्सट मोड चालू' : 'बड़ा टेक्सट मोड बंद');
      return next;
    });
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => {
      const next = !prev;
      announce(next ? 'हाई कॉन्ट्रास्ट मोड चालू' : 'हाई कॉन्ट्रास्ट मोड बंद');
      return next;
    });
  };

  const toggleFullScreenPTT = () => {
    setFullScreenPTT(prev => {
      const next = !prev;
      announce(next ? 'पूर्ण स्क्रीन माइक मोड चालू' : 'पूर्ण स्क्रीन माइक मोड बंद');
      return next;
    });
  };

  return (
    <AccessibilityContext.Provider value={{ 
      largeText, highContrast, fullScreenPTT, 
      toggleLargeText, toggleHighContrast, toggleFullScreenPTT 
    }}>
      {children}
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          position: 'absolute', width: '1px', height: '1px', padding: 0,
          margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap', border: 0,
        }}
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    return { largeText: false, highContrast: false, fullScreenPTT: false, toggleLargeText: () => {}, toggleHighContrast: () => {}, toggleFullScreenPTT: () => {} };
  }
  return context;
}

export default AccessibilityContext;