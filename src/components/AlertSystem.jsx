import React, { useState, useEffect } from 'react';
import '../styles/AlertSystem.css';

function AlertSystem({ alerts, onClose, onDismiss }) {
  const [filteredAlerts, setFilteredAlerts] = useState(alerts);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('time');

  useEffect(() => {
    let filtered = [...alerts];

    // Filter by severity
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    // Sort alerts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'severity':
          const severityOrder = { high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredAlerts(filtered);
  }, [alerts, severityFilter, sortBy]);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '❓';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'var(--accent-red)';
      case 'medium': return 'var(--accent-yellow)';
      case 'low': return 'var(--accent-blue)';
      default: return 'var(--text-medium)';
    }
  };

  const getAlertTypeIcon = (title) => {
    if (title.toLowerCase().includes('proximity')) return '🐙';
    if (title.toLowerCase().includes('battery')) return '🔋';
    if (title.toLowerCase().includes('oxygen')) return '💨';
    if (title.toLowerCase().includes('sediment')) return '🌫️';
    if (title.toLowerCase().includes('temperature')) return '🌡️';
    if (title.toLowerCase().includes('compliance')) return '📋';
    return '⚠️';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const severityCounts = {
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length
  };

  return (
    <div className="alert-system-overlay">
      <div className="alert-system">
        <div className="alert-header">
          <div className="header-left">
            <h2>System Alerts</h2>
            <div className="alert-summary">
              <span className="total-count">{alerts.length} total</span>
              <div className="severity-counts">
                <span className="count high">{severityCounts.high} high</span>
                <span className="count medium">{severityCounts.medium} medium</span>
                <span className="count low">{severityCounts.low} low</span>
              </div>
            </div>
          </div>
          
          <button className="close-button" onClick={onClose}>
            <span>×</span>
          </button>
        </div>

        <div className="alert-controls">
          <div className="filter-controls">
            <div className="filter-group">
              <label>Filter by severity:</label>
              <select 
                value={severityFilter} 
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="time">Most Recent</option>
                <option value="severity">Severity</option>
                <option value="title">Alert Type</option>
              </select>
            </div>
          </div>
        </div>

        <div className="alert-list">
          {filteredAlerts.length === 0 ? (
            <div className="no-alerts">
              <div className="no-alerts-icon">✅</div>
              <h3>No alerts match your filters</h3>
              <p>Try adjusting your filter settings to see more alerts.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div key={alert.id} className={`alert-item ${alert.severity}`}>
                <div className="alert-content">
                  <div className="alert-main">
                    <div className="alert-icons">
                      <span className="severity-icon">{getSeverityIcon(alert.severity)}</span>
                      <span className="type-icon">{getAlertTypeIcon(alert.title)}</span>
                    </div>
                    
                    <div className="alert-details">
                      <div className="alert-title">{alert.title}</div>
                      <div className="alert-message">{alert.message}</div>
                      <div className="alert-meta">
                        <span className="alert-time">{formatTimeAgo(alert.timestamp)}</span>
                        <span 
                          className="alert-severity"
                          style={{ color: getSeverityColor(alert.severity) }}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="alert-actions">
                    <button 
                      className="dismiss-button"
                      onClick={() => onDismiss(alert.id)}
                      title="Dismiss alert"
                    >
                      ✓
                    </button>
                  </div>
                </div>
                
                <div className="alert-timestamp">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="alert-footer">
          <div className="footer-info">
            <span>Showing {filteredAlerts.length} of {alerts.length} alerts</span>
          </div>
          
          <div className="footer-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                alerts.forEach(alert => onDismiss(alert.id));
              }}
              disabled={alerts.length === 0}
            >
              Dismiss All
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlertSystem;

