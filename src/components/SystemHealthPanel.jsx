// =========================
// SystemHealthPanel Component
// =========================
// Shows backend/API/database/WebSocket health and latency.
// Props:
//   health: object with health status for each subsystem
import React from 'react';

function SystemHealthPanel({ health }) {
  // Render health status for each subsystem
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header">
        <h3 className="panel-title">System Health</h3>
      </div>
      <div className="panel-body">
        <div className="data-grid data-grid-2">
          {/* Backend status */}
          <div className="data-cell">
            <span className="data-label">Backend</span>
            <span className={`data-value status-${health.backend}`}>{health.backend}</span>
          </div>
          {/* API status */}
          <div className="data-cell">
            <span className="data-label">API</span>
            <span className={`data-value status-${health.api}`}>{health.api}</span>
          </div>
          {/* Database status */}
          <div className="data-cell">
            <span className="data-label">Database</span>
            <span className={`data-value status-${health.db}`}>{health.db}</span>
          </div>
          {/* WebSocket status */}
          <div className="data-cell">
            <span className="data-label">WebSocket</span>
            <span className={`data-value status-${health.ws}`}>{health.ws}</span>
          </div>
          {/* Latency */}
          <div className="data-cell">
            <span className="data-label">Latency</span>
            <span className="data-value">{health.latency} ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemHealthPanel;
