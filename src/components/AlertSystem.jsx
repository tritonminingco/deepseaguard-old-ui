import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../styles/AlertSystem.css';

/**
 * AlertSystem Component
 * 
 * This component is responsible for displaying and managing system alerts.
 * It provides functionalities to filter, sort, and dismiss alerts.
 * 
 * Props:
 * - alerts: Array of alert objects containing id, title, message, severity, and timestamp.
 * - onClose: Function to close the alert system modal.
 * - onDismiss: Function to dismiss individual alerts.
 */
function AlertSystem({ alerts, onClose, onDismiss }) {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('time');

  // Memoize filtered and sorted alerts to avoid unnecessary re-computations
  const filteredAlerts = useMemo(() => {
    let filtered = [...alerts];

    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

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

    return filtered;
  }, [alerts, severityFilter, sortBy]);

  // Memoize severity counts for performance
  const severityCounts = useMemo(() => {
    return alerts.reduce(
      (counts, alert) => {
        counts[alert.severity] = (counts[alert.severity] || 0) + 1;
        return counts;
      },
      { high: 0, medium: 0, low: 0 }
    );
  }, [alerts]);

  const getSeverityIcon = (severity) => {
    const icons = { high: '🚨', medium: '⚠️', low: 'ℹ️' };
    return icons[severity] || '❓';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      high: 'var(--accent-red)',
      medium: 'var(--accent-yellow)',
      low: 'var(--accent-blue)',
    };
    return colors[severity] || 'var(--text-medium)';
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

  return (
    <div className="alert-system-overlay" role="dialog" aria-labelledby="alert-system-title">
      <div className="alert-system">
        <div className="alert-header">
          <div className="header-left">
            <h2 id="alert-system-title">System Alerts</h2>
            <div className="alert-summary">
              <span className="total-count">{alerts.length} total</span>
              <div className="severity-counts">
                <span className="count high">{severityCounts.high} high</span>
                <span className="count medium">{severityCounts.medium} medium</span>
                <span className="count low">{severityCounts.low} low</span>
              </div>
            </div>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close alert system">
            <span>×</span>
          </button>
        </div>

        <div className="alert-controls">
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="severity-filter">Filter by severity:</label>
              <select
                id="severity-filter"
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
              <label htmlFor="sort-by">Sort by:</label>
              <select
                id="sort-by"
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
              <div
                key={alert.id}
                className={`alert-item ${alert.severity}`}
                style={{ animation: 'fadeIn 0.3s' }}
              >
                <div className="alert-content">
                  <div className="alert-main">
                    <div className="alert-icons">
                      <span className="severity-icon">{getSeverityIcon(alert.severity)}</span>
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
              onClick={() => alerts.forEach(alert => onDismiss(alert.id))}
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

AlertSystem.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      severity: PropTypes.oneOf(['high', 'medium', 'low']).isRequired,
      timestamp: PropTypes.string.isRequired,
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default AlertSystem;

