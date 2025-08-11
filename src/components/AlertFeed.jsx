import { useEffect } from "react";
import { useAlerts, useBulkAlertOperations } from '../hooks/useAlerts.js';
import "../styles/alert-feed.css";

const AlertFeed = () => {
  // Use Redux hooks for alerts state
  const { 
    alerts, 
    loading, 
    error, 
    fetchAlerts, 
    markAsRead,
    createAlert 
  } = useAlerts();
  
  const { markAllAsRead } = useBulkAlertOperations();

  // Load alerts on component mount
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Simulate periodic new alerts (for demo purposes)
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly create new alerts (30% chance every 10 seconds)
      if (Math.random() > 0.7) {
        const alertTypes = ['environmental', 'operational', 'compliance', 'system'];
        const severities = ['high', 'medium', 'low'];
        const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        
        createAlert({
          type,
          severity,
          title: `New ${type} alert`,
          message: `Simulated ${severity} severity ${type} alert`,
          timestamp: new Date().toISOString()
        });
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [createAlert]);

  const formatTime = (iso) => {
    const date = new Date(iso);
    return date.toLocaleString();
  };

  const handleAlertClick = (alert) => {
    if (!alert.read) {
      markAsRead(alert.id);
    }
  };

  return (
    <div className="alert-feed">
      <div className="alert-feed-header">
        <h3>Recent Alerts</h3>
        <div className="alert-feed-controls">
          {alerts.length > 0 && (
            <button className="mark-read-btn" onClick={markAllAsRead}>
              Mark all as read
            </button>
          )}
          {loading.fetch && <span className="loading">Loading...</span>}
        </div>
      </div>
      
      {error && (
        <div className="alert-error">
          Error loading alerts: {error}
        </div>
      )}
      
      <div className="alert-content">
        {alerts.length === 0 && !loading.fetch ? (
          <div className="no-alerts">No active alerts</div>
        ) : (
          [...alerts] // Create a copy before sorting
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 20) // Show only the latest 20 alerts
            .map((alert) => (
              <div
                key={alert.id}
                className={`alert-item type-${alert.type} severity-${alert.severity} ${
                  alert.read ? "read" : "unread"
                } ${alert.acknowledged ? "acknowledged" : ""} ${
                  alert.resolved ? "resolved" : ""
                }`}
                onClick={() => handleAlertClick(alert)}
                role="button"
                tabIndex={0}
              >
                <div className="alert-title">{alert.title}</div>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">
                  {formatTime(alert.timestamp)}
                </div>
                <div className="alert-meta">
                  <span className={`alert-type type-${alert.type}`}>{alert.type}</span>
                  <span className="alert-source">{alert.source}</span>
                  {alert.acknowledged && (
                    <span className="alert-status acknowledged">ACK</span>
                  )}
                  {alert.resolved && (
                    <span className="alert-status resolved">RESOLVED</span>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default AlertFeed;
