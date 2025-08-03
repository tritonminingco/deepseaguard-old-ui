import '../styles/LoadingSpinner.css';

/**
 * Loading Spinner Component
 * 
 * Provides consistent loading states across the application
 * with different variants for different use cases.
 */
function LoadingSpinner({ 
  size = 'medium', 
  variant = 'primary', 
  text = 'Loading...', 
  inline = false,
  overlay = false 
}) {
  const sizeClasses = {
    small: 'loading-spinner--small',
    medium: 'loading-spinner--medium',
    large: 'loading-spinner--large'
  };

  const variantClasses = {
    primary: 'loading-spinner--primary',
    secondary: 'loading-spinner--secondary',
    marine: 'loading-spinner--marine',
    white: 'loading-spinner--white'
  };

  const containerClass = `
    loading-container 
    ${inline ? 'loading-container--inline' : ''}
    ${overlay ? 'loading-container--overlay' : ''}
  `.trim();

  const spinnerClass = `
    loading-spinner 
    ${sizeClasses[size] || sizeClasses.medium}
    ${variantClasses[variant] || variantClasses.primary}
  `.trim();

  if (overlay) {
    return (
      <div className={containerClass}>
        <div className="loading-backdrop">
          <div className="loading-content">
            <div className={spinnerClass}>
              <div className="loading-spinner__ring"></div>
              <div className="loading-spinner__ring"></div>
              <div className="loading-spinner__ring"></div>
            </div>
            {text && <p className="loading-text">{text}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={spinnerClass}>
        <div className="loading-spinner__ring"></div>
        <div className="loading-spinner__ring"></div>
        <div className="loading-spinner__ring"></div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}

/**
 * Species Loading Component - Specialized for FathomNet data loading
 */
export function SpeciesLoading({ species, count = 1 }) {
  return (
    <LoadingSpinner
      variant="marine"
      text={`Loading ${species || 'species'} data${count > 1 ? ` (${count} images)` : ''}...`}
    />
  );
}

/**
 * API Loading Component - For general API requests
 */
export function ApiLoading({ operation = 'data' }) {
  return (
    <LoadingSpinner
      size="small"
      variant="primary"
      text={`Loading ${operation}...`}
      inline
    />
  );
}

/**
 * Page Loading Component - Full page loading state
 */
export function PageLoading({ message = 'Initializing DeepSeaGuard...' }) {
  return (
    <LoadingSpinner
      size="large"
      variant="marine"
      text={message}
      overlay
    />
  );
}

export default LoadingSpinner;
