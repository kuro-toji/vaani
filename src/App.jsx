import { Component, useEffect } from 'react'
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext'
import ChatWindow from './components/ChatWindow'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Vaani Error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAF8',
          padding: '20px',
          textAlign: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <h2 style={{ color: '#DC2626', fontSize: '20px', marginBottom: '12px', fontWeight: 600 }}>
              कुछ गलत हो गया
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              Vaani थक गया है। कृपया रीलोड करें।
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#0F6E56',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              रीलोड करें
            </button>
            <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '16px' }}>
              Reload page to continue
            </p>
          </div>
        </div>
      )
    }
    return <ChatWindow />
  }
}

function ThemedApp() {
  const { largeText, highContrast } = useAccessibility()

  useEffect(() => {
    const htmlElem = document.documentElement;
    if (htmlElem) {
      if (largeText) {
        htmlElem.classList.add('vaani-large-text');
        htmlElem.style.fontSize = '20px';
      } else {
        htmlElem.classList.remove('vaani-large-text');
        htmlElem.style.fontSize = '';
      }
      
      htmlElem.classList.toggle('vaani-high-contrast', highContrast);
    }
  }, [largeText, highContrast]);

  return <ErrorBoundary />;
}

function App() {
  return (
    <AccessibilityProvider>
      <ThemedApp />
    </AccessibilityProvider>
  )
}

export default App