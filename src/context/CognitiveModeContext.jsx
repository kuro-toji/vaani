import { createContext, useContext, useState } from 'react';

const CognitiveModeContext = createContext({
  cognitiveMode: false,
  toggleCognitiveMode: () => {},
  financialStatus: 'unknown', // 'green', 'yellow', 'red'
  setFinancialStatus: () => {},
});

export function CognitiveModeProvider({ children }) {
  const [cognitiveMode, setCognitiveMode] = useState(false);
  const [financialStatus, setFinancialStatus] = useState('unknown'); // 'green', 'yellow', 'red'

  const toggleCognitiveMode = () => {
    setCognitiveMode(prev => !prev);
  };

  return (
    <CognitiveModeContext.Provider value={{
      cognitiveMode,
      toggleCognitiveMode,
      financialStatus,
      setFinancialStatus,
    }}>
      {children}
    </CognitiveModeContext.Provider>
  );
}

export function useCognitiveMode() {
  return useContext(CognitiveModeContext);
}

export default CognitiveModeContext;
