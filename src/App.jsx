import React from 'react'
import ChatWindow from './components/ChatWindow'

console.log('Vaani App rendering...')

class ErrorBoundary extends React.Component {
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
          padding: '20px', 
          backgroundColor: '#FAFAF8', 
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <h1 style={{ color: '#DC2626', fontSize: '18px' }}>Something went wrong</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>{this.state.error?.message || 'Unknown error'}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#1D9E75', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return <ChatWindow />
  }
}

function App() {
  return <ErrorBoundary><ChatWindow /></ErrorBoundary>
}

export default App
