import React, { useState, useEffect, createContext, useContext } from 'react';
import { setAuthToken, getAuthToken, isAuthenticated, authenticate, logout } from '../utils/apiClient';
import '../styles/Authentication.css';

// Create Authentication Context
const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 * Manages user authentication state and provides auth context to child components
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if user is already authenticated
        if (isAuthenticated()) {
          // Validate token and get user info
          const response = await fetch('/api/auth/validate', {
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
          } else {
            // Token is invalid, clear it
            setAuthToken(null);
          }
        }
      } catch (err) {
        console.error('Authentication check error:', err);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authenticate(username, password);
      
      if (result.success) {
        setCurrentUser(result.user);
        return true;
      } else {
        setError(result.error || 'Authentication failed');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user has specific role
  const hasRole = (role) => {
    if (!currentUser) return false;
    return currentUser.role === role || currentUser.role === 'admin';
  };
  
  // Authentication context value
  const authContextValue = {
    currentUser,
    loading,
    error,
    login,
    logout: handleLogout,
    hasRole,
    isAuthenticated: !!currentUser
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Login Form Component
 * Handles user login interface
 */
export const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login, error, loading } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };
  
  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="login-header">
          <h2>DeepSeaGuard</h2>
          <p>Compliance Dashboard</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group remember-me">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember-me">Remember me</label>
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>© 2025 Triton Mining Co. All rights reserved.</p>
          <p>DeepSeaGuard v1.0</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Protected Route Component
 * Restricts access to authenticated users with specific roles
 */
export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, loading, hasRole } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!currentUser) {
    return <LoginForm />;
  }
  
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }
  
  return children;
};

/**
 * User Profile Component
 * Displays user information and provides logout functionality
 */
export const UserProfile = () => {
  const { currentUser, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  
  if (!currentUser) return null;
  
  return (
    <div className="user-profile">
      <div 
        className="profile-header" 
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="avatar">
          {currentUser.first_name ? currentUser.first_name[0] : currentUser.username[0]}
        </div>
        <span className="username">
          {currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : currentUser.username}
        </span>
        <span className={`role-badge ${currentUser.role}`}>
          {currentUser.role}
        </span>
        <i className={`dropdown-icon ${showDropdown ? 'open' : ''}`}></i>
      </div>
      
      {showDropdown && (
        <div className="profile-dropdown">
          <div className="dropdown-item">
            <i className="icon-profile"></i>
            <span>Profile</span>
          </div>
          <div className="dropdown-item">
            <i className="icon-settings"></i>
            <span>Settings</span>
          </div>
          <div className="dropdown-divider"></div>
          <div className="dropdown-item" onClick={logout}>
            <i className="icon-logout"></i>
            <span>Logout</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  AuthProvider,
  useAuth,
  LoginForm,
  ProtectedRoute,
  UserProfile
};
