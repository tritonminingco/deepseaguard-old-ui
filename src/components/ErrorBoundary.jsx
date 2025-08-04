import React from 'react';
import '../styles/ErrorBoundary.css';

/**
 * Error Boundary Component for DeepSeaGuard
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('DeepSeaGuard Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>
              We're sorry, but something unexpected happened. 
              The DeepSeaGuard system encountered an error.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Mode)</summary>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="retry-button"
                disabled={this.state.retryCount >= 3}
              >
                {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="reload-button"
              >
                Reload Page
              </button>
            </div>
            
            <div className="error-help">
              <p>If this problem persists:</p>
              <ul>
                <li>Check your internet connection</li>
                <li>Clear your browser cache</li>
                <li>Contact technical support</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
