// =========================
// ExportCenter Component
// =========================
// Central panel to export all data types (telemetry, environmental, compliance, event log).
// Props:
//   onExport: function to call with export type
import React from 'react';

function ExportCenter({ onExport }) {
  // Render export buttons for each data type
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header">
        <h3 className="panel-title">Export Center</h3>
      </div>
      <div className="panel-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Export buttons */}
          <button className="btn w-full" onClick={() => onExport('telemetry')}>Export Telemetry (CSV)</button>
          <button className="btn w-full" onClick={() => onExport('environmental')}>Export Environmental (CSV)</button>
          <button className="btn w-full" onClick={() => onExport('compliance')}>Export Compliance (CSV)</button>
          <button className="btn w-full" onClick={() => onExport('eventlog')}>Export Event Log (CSV)</button>
          <button className="btn w-full" onClick={() => onExport('all')}>Export All Data (JSON)</button>
        </div>
      </div>
    </div>
  );
}

export default ExportCenter;
