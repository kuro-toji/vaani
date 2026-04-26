import { createContext, useContext } from 'react';

const AccessibilityContext = createContext({
  largeText: false,
  highContrast: false,
  fullScreenPTT: false,
  autoReadResponses: false,
  toggleLargeText: () => {},
  toggleHighContrast: () => {},
  toggleFullScreenPTT: () => {},
  toggleAutoRead: () => {},
});

export function AccessibilityProvider({ children }) {
  return (
    <AccessibilityContext.Provider value={{}}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

export default AccessibilityContext;