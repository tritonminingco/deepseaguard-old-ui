import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import "../styles/alert-feed.css"

const severities = ["high", "medium", "low"];
const alertTitles = [
  "System Overload",
  "AUV Battery Low",
  "Telemetry Loss",
  "Compliance Breach",
  "Navigation Drift",
  "Hull Breach Detected",
  "Sonar Obstruction",
  "Thruster Malfunction",
  "Temperature Spike",
  "Pressure Anomaly",
  "GPS Signal Lost",
  "Data Corruption Detected",
  "Unauthorized Access Attempt",
  "Communication Latency High",
  "Mission Timer Expired",
];

const alertInfo = [
  "Immediate operator intervention required.",
  "Battery levels are critically low.",
  "Data stream has been interrupted.",
  "Detected unauthorized operation in protected zone.",
  "Deviation from planned route detected.",
  "Structural integrity compromised — investigate immediately.",
  "Sonar path is blocked — navigation accuracy may be reduced.",
  "One or more thrusters are offline — performance degraded.",
  "Internal temperature exceeding safe operational limits.",
  "Detected abnormal pressure fluctuations in main compartment.",
  "GPS tracking unavailable — switching to dead reckoning.",
  "Critical telemetry data corrupted — mission data at risk.",
  "Failed login attempt detected — possible security breach.",
  "High delay in communication — real-time control affected.",
  "Mission duration exceeded planned operational window.",
];


function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const AlertFeed = ({ alerts: initialAlerts }) => {
  const [alerts, setAlerts] = useState(initialAlerts || []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newAlert = {
        id: Date.now().toString(),
        title: getRandomItem(alertTitles),
        message: getRandomItem(alertInfo),
        timestamp: new Date().toISOString(),
        severity: getRandomItem(severities),
        type: "system",
        read: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const formatTime = (iso) => {
    const date = new Date(iso);
    return date.toLocaleString();
  };

  return (
    <div className="alert-feed">
      <div className="alert-feed-header">
        <h3>Recent Alerts</h3>
        {alerts.length > 0 && (
          <button className="mark-read-btn" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>
      <div className="alert-content">
        {alerts.length === 0 ? (
          <div className="no-alerts">No active alerts</div>
        ) : (
          alerts
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map((alert) => (
              <div
                key={alert.id}
                className={`alert-item severity-${alert.severity} ${
                  alert.read ? "read" : "unread"
                }`}
              >
                <div className="alert-header">
                  <span className="alert-title">{alert.title}</span>
                  <span className="alert-time">
                    {formatTime(alert.timestamp)}
                  </span>
                </div>
                <div className="alert-message">{alert.message}</div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

AlertFeed.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      severity: PropTypes.oneOf(["high", "medium", "low"]).isRequired,
      type: PropTypes.string.isRequired,
      read: PropTypes.bool,
    }),
  ),
};

export default AlertFeed;
