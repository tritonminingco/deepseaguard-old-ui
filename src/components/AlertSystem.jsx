import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';
import { useAlertFilters, useAlerts } from '../hooks/useAlerts.js';
import '../styles/AlertSystem.css';

/**
 * AlertSystem Component
 * 
 * This component is responsible for displaying and managing system alerts.
 * It provides functionalities to filter, sort, and dismiss alerts.
 * 
 * Props:
 * - onClose: Function to close the alert system modal.
 */
function AlertSystem({ onClose }) {
  const { 
    filteredAlerts, 
    loading, 
    error, 
    acknowledgeAlert, 
    resolveAlert, 
    markAsRead,
    deleteAlert,
    fetchAlerts 
  } = useAlerts();
  
  const { 
    filters, 
    setSeverityFilter, 
    setSortBy 
  } = useAlertFilters();

  // Load alerts on component mount
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Memoize severity counts for performance
  const severityCounts = useMemo(() => {
    return filteredAlerts.reduce(
      (counts, alert) => {
        counts[alert.severity] = (counts[alert.severity] || 0) + 1;
        return counts;
      },
      { high: 0, medium: 0, low: 0 }
    );
  }, [filteredAlerts]);

  const getSeverityIcon = (severity) => {
    const textLabels = { high: 'HIGH', medium: 'MED', low: 'LOW' };
    return textLabels[severity] || 'INFO';
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
      <div className="alert-system alert-system-bottom">
        <div className="alert-header">
          <div className="header-left">
            <h2 id="alert-system-title">System Alerts</h2>
            <div className="alert-summary">
              <span className="total-count">{filteredAlerts.length} alerts</span>
            </div>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close alert system">
            <span>CLOSE</span>
          </button>
        </div>

        <div className="alert-controls">
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="severity-filter">Filter by severity:</label>
              <select
                id="severity-filter"
                value={filters.severity}
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
                value={filters.sortBy}
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
                      className="acknowledge-button"
                      onClick={() => acknowledgeAlert(alert.id)}
                      title="Acknowledge alert"
                      disabled={alert.acknowledged}
                    >
                      {alert.acknowledged ? '✓' : 'ACK'}
                    </button>
                    <button
                      className="resolve-button"
                      onClick={() => resolveAlert(alert.id, 'Resolved by user')}
                      title="Resolve alert"
                      disabled={alert.resolved}
                    >
                      {alert.resolved ? 'RESOLVED' : 'RESOLVE'}
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => deleteAlert(alert.id)}
                      title="Delete alert"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="alert-footer">
          <div className="footer-info">
            <span>Showing {filteredAlerts.length} alerts</span>
            {loading.fetch && <span> (Loading...)</span>}
            {error && <span className="error"> Error: {error}</span>}
          </div>
          <div className="footer-actions">
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
  onClose: PropTypes.func.isRequired,
};

export default AlertSystem;

