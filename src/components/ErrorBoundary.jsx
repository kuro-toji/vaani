import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            कुछ गलत हो गया
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px', maxWidth: '400px' }}>
            Application में तकनीकी दिक्कत आ गई है। Page reload करें।
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 32px',
              backgroundColor: '#10B981',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            🔄 Reload करें
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '24px', textAlign: 'left', maxWidth: '600px', fontSize: '12px', color: '#F87171' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Error Details</summary>
              <pre style={{ overflow: 'auto', padding: '12px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                {this.state.error.toString()}
                {'\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
