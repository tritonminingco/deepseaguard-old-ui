// =========================
// AuvMissionTimeline Component
// =========================
// Shows a visual timeline of missions for each AUV.
// Props:
//   missions: array of mission objects
//   selectedAUV: currently selected AUV ID
import React from 'react';

function AuvMissionTimeline({ missions, selectedAUV }) {
  // Render a list of mission timeline items
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header">
        <h3 className="panel-title">AUV Mission Timeline</h3>
      </div>
      <div className="panel-body">
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          (Demo: Timeline for {selectedAUV || 'all AUVs'})
        </div>
        <div className="timeline-list">
          {(missions || []).map(m => (
            <div key={m.id} className={`timeline-item status-${m.status}`}
              style={{ margin: '8px 0', padding: 8, borderLeft: '4px solid #3b82f6', background: '#1e293b22', borderRadius: 4 }}>
              <div><b>{m.description}</b></div>
              <div>Start: {new Date(m.start).toLocaleString()}</div>
              <div>End: {m.end ? new Date(m.end).toLocaleString() : 'Ongoing'}</div>
              <div>Status: {m.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AuvMissionTimeline;
