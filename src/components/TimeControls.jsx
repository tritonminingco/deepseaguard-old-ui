import React, { useState } from 'react';
import '../styles/TimeControls.css';

function TimeControls({ timeFrame, onTimeFrameChange, playbackSpeed, onPlaybackSpeedChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const timeFrameOptions = [
    { value: 'live', label: 'Live Data', icon: '🔴' },
    { value: 'past_hour', label: 'Past Hour', icon: '⏰' },
    { value: 'past_6_hours', label: 'Past 6 Hours', icon: '🕕' },
    { value: 'past_24_hours', label: 'Past 24 Hours', icon: '📅' },
    { value: 'past_week', label: 'Past Week', icon: '📊' },
    { value: 'past_month', label: 'Past Month', icon: '📈' }
  ];

  const playbackSpeeds = [
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 5, label: '5x' }
  ];

  const getCurrentTimeFrameLabel = () => {
    const option = timeFrameOptions.find(opt => opt.value === timeFrame);
    return option ? option.label : 'Unknown';
  };

  const getCurrentTimeFrameIcon = () => {
    const option = timeFrameOptions.find(opt => opt.value === timeFrame);
    return option ? option.icon : '❓';
  };

  const handleTimeFrameSelect = (value) => {
    onTimeFrameChange(value);
    setIsExpanded(false);
  };

  return (
    <div className="time-controls">
      <div className="time-controls-container">
        {/* Time Frame Selector */}
        <div className="control-group">
          <div className="control-header">
            <span className="control-icon">⏱️</span>
            <span className="control-label">Time Frame</span>
          </div>
          
          <div className={`time-frame-selector ${isExpanded ? 'expanded' : ''}`}>
            <button 
              className="current-selection"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="selection-icon">{getCurrentTimeFrameIcon()}</span>
              <span className="selection-label">{getCurrentTimeFrameLabel()}</span>
              <span className="dropdown-arrow">{isExpanded ? '▲' : '▼'}</span>
            </button>
            
            {isExpanded && (
              <div className="dropdown-menu">
                {timeFrameOptions.map(option => (
                  <button
                    key={option.value}
                    className={`dropdown-item ${timeFrame === option.value ? 'active' : ''}`}
                    onClick={() => handleTimeFrameSelect(option.value)}
                  >
                    <span className="item-icon">{option.icon}</span>
                    <span className="item-label">{option.label}</span>
                    {timeFrame === option.value && <span className="check-mark">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Playback Speed Control (only for historical data) */}
        {timeFrame !== 'live' && (
          <div className="control-group">
            <div className="control-header">
              <span className="control-icon">⚡</span>
              <span className="control-label">Playback Speed</span>
            </div>
            
            <div className="speed-controls">
              {playbackSpeeds.map(speed => (
                <button
                  key={speed.value}
                  className={`speed-button ${playbackSpeed === speed.value ? 'active' : ''}`}
                  onClick={() => onPlaybackSpeedChange(speed.value)}
                >
                  {speed.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time Zone Display */}
        <div className="control-group">
          <div className="control-header">
            <span className="control-icon">🌍</span>
            <span className="control-label">Time Zone</span>
          </div>
          
          <div className="timezone-display">
            <span className="timezone-value">UTC</span>
            <span className="timezone-offset">+00:00</span>
          </div>
        </div>

        {/* Current Time Display */}
        <div className="control-group">
          <div className="control-header">
            <span className="control-icon">🕐</span>
            <span className="control-label">Current Time</span>
          </div>
          
          <div className="current-time">
            <span className="time-value">
              {new Date().toLocaleTimeString('en-US', { 
                hour12: false,
                timeZone: 'UTC'
              })}
            </span>
            <span className="date-value">
              {new Date().toLocaleDateString('en-US', {
                timeZone: 'UTC',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="status-bar">
        {timeFrame === 'live' ? (
          <div className="live-status">
            <span className="live-dot"></span>
            <span>Live monitoring active</span>
          </div>
        ) : (
          <div className="historical-status">
            <span className="historical-icon">📊</span>
            <span>Historical data - {getCurrentTimeFrameLabel()} at {playbackSpeed}x speed</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeControls;

