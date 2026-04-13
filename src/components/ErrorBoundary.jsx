import { Component } from 'react';
import { ChevronLeft, RefreshCw, AlertCircle } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--vaani-space-6)',
            backgroundColor: 'var(--vaani-bg)',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              textAlign: 'center',
              padding: 'var(--vaani-space-8)',
              backgroundColor: 'white',
              borderRadius: 'var(--vaani-radius-xl)',
              boxShadow: 'var(--vaani-shadow-lg)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--vaani-radius-full)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--vaani-space-4)',
              }}
            >
              <AlertCircle size={32} color="var(--vaani-error)" />
            </div>

            <h1
              style={{
                fontSize: 'var(--vaani-text-xl)',
                fontWeight: '600',
                color: 'var(--vaani-text)',
                marginBottom: 'var(--vaani-space-2)',
              }}
            >
              कुछ गलत हो गया
            </h1>

            <p
              style={{
                fontSize: 'var(--vaani-text-sm)',
                color: 'var(--vaani-text-secondary)',
                marginBottom: 'var(--vaani-space-6)',
              }}
            >
              हमें माफ करें, कुछ तकनीकी समस्या हुई है। कृपया पुनः प्रयास करें।
            </p>

            <div
              style={{
                display: 'flex',
                gap: 'var(--vaani-space-3)',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={this.handleGoBack}
                className="btn btn-secondary"
              >
                <ChevronLeft size={18} />
                वापस जाएं
              </button>
              <button
                onClick={this.handleReload}
                className="btn btn-primary"
              >
                <RefreshCw size={18} />
                पुनः लोड करें
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                style={{
                  marginTop: 'var(--vaani-space-6)',
                  textAlign: 'left',
                  padding: 'var(--vaani-space-4)',
                  backgroundColor: 'var(--vaani-bg-secondary)',
                  borderRadius: 'var(--vaani-radius)',
                  fontSize: 'var(--vaani-text-xs)',
                  fontFamily: 'var(--vaani-font-mono)',
                  overflow: 'auto',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
                  Error Details
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
