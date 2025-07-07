import React, { useState } from 'react';
import '../styles/Header.css';

function Header({ timeFrame, onTimeFrameChange, alerts, onAlertClick, darkMode, onToggleDarkMode }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const timeFrameOptions = [
    { value: 'live', label: 'Live Data' },
    { value: 'past_hour', label: 'Past Hour' },
    { value: 'past_6_hours', label: 'Past 6 Hours' },
    { value: 'past_24_hours', label: 'Past 24 Hours' },
    { value: 'past_week', label: 'Past Week' },
    { value: 'past_month', label: 'Past Month' }
  ];

  const getAlertCount = () => {
    return alerts ? alerts.length : 0;
  };

  const getHighPriorityCount = () => {
    return alerts ? alerts.filter(alert => alert.severity === 'high').length : 0;
  };

  const getCurrentTimeFrameLabel = () => {
    const option = timeFrameOptions.find(opt => opt.value === timeFrame);
    return option ? option.label : 'Live Data';
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo and Title */}
        <div className="header-left">
          <div className="logo-section">
            <div className="logo">
              <span className="logo-icon">🌊</span>
              <div className="logo-text">
                <h1>DeepSeaGuard</h1>
                <span className="subtitle">Compliance Dashboard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Controls */}
        <div className="header-center">
          <div className="time-frame-control">
            <label htmlFor="timeFrame" className="control-label">
              Time Frame:
            </label>
            <select
              id="timeFrame"
              value={timeFrame}
              onChange={(e) => onTimeFrameChange(e.target.value)}
              className="time-frame-select"
            >
              {timeFrameOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Controls */}
        <div className="header-right">
          {/* Alert Button */}
          <button 
            className={`alert-button ${getHighPriorityCount() > 0 ? 'has-high-priority' : ''}`}
            onClick={onAlertClick}
            title={`${getAlertCount()} alerts (${getHighPriorityCount()} high priority)`}
          >
            <span className="alert-icon">🔔</span>
            {getAlertCount() > 0 && (
              <span className="alert-badge">{getAlertCount()}</span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button 
            className="theme-toggle"
            onClick={onToggleDarkMode}
            title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          >
            <span className="theme-icon">
              {darkMode ? '☀️' : '🌙'}
            </span>
          </button>

          {/* User Menu */}
          <div className="user-menu">
            <button 
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-icon">👤</span>
              <span className="user-name">Admin</span>
              <span className="dropdown-arrow">{showUserMenu ? '▲' : '▼'}</span>
            </button>
            
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <div className="user-avatar">👤</div>
                  <div className="user-details">
                    <div className="user-name-full">Administrator</div>
                    <div className="user-role">System Admin</div>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item">
                  <span className="item-icon">⚙️</span>
                  <span>Settings</span>
                </button>
                
                <button className="dropdown-item">
                  <span className="item-icon">📊</span>
                  <span>Reports</span>
                </button>
                
                <button className="dropdown-item">
                  <span className="item-icon">❓</span>
                  <span>Help</span>
                </button>
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item logout">
                  <span className="item-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <div className="connection-status">
            <span className="status-dot connected"></span>
            <span>Connected to AUV Network</span>
          </div>
          
          <div className="data-status">
            <span className="status-indicator">
              {timeFrame === 'live' ? (
                <>
                  <span className="live-dot"></span>
                  <span>Live Data Stream</span>
                </>
              ) : (
                <>
                  <span className="historical-icon">📊</span>
                  <span>Historical Data - {getCurrentTimeFrameLabel()}</span>
                </>
              )}
            </span>
          </div>
        </div>
        
        <div className="status-right">
          <div className="system-time">
            <span className="time-label">UTC:</span>
            <span className="time-value">
              {new Date().toLocaleTimeString('en-US', { 
                hour12: false,
                timeZone: 'UTC'
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

