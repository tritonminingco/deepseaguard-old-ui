// =========================
// AlertFilterPanel Component
// =========================
// Provides UI for filtering and searching alerts by severity, type, or AUV.
// Props:
//   alerts: array of alert objects
//   onFilter: function to call with filter params
import React, { useState } from 'react';

function AlertFilterPanel({ alerts, onFilter }) {
  // Local state for filter fields
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [auv, setAuv] = useState('');

  // Call parent handler with filter params
  const handleFilter = () => {
    onFilter({ search, severity, auv });
  };

  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header">
        <h3 className="panel-title">Alert Filter & Search</h3>
      </div>
      <div className="panel-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {/* Search input */}
        <input
          type="text"
          placeholder="Search alerts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          style={{ flex: 1 }}
        />
        {/* Severity dropdown */}
        <select value={severity} onChange={e => setSeverity(e.target.value)} className="input">
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        {/* AUV ID input */}
        <input
          type="text"
          placeholder="AUV ID..."
          value={auv}
          onChange={e => setAuv(e.target.value)}
          className="input"
          style={{ width: 100 }}
        />
        {/* Apply filter button */}
        <button className="btn btn-primary" onClick={handleFilter}>Apply</button>
      </div>
    </div>
  );
}

export default AlertFilterPanel;
