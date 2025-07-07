// =========================
// AuvCommandConsole Component
// =========================
// Demo panel to simulate sending commands to AUVs.
// Props:
//   onCommand: function to call with command string
import React from 'react';

function AuvCommandConsole({ onCommand }) {
  // Render command buttons for demo actions
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header">
        <h3 className="panel-title">AUV Command Console (Demo)</h3>
      </div>
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Command buttons */}
        <button className="btn w-full" onClick={() => onCommand('pause')}>Pause Mission</button>
        <button className="btn w-full" onClick={() => onCommand('return')}>Return to Base</button>
        <button className="btn w-full" onClick={() => onCommand('maintenance')}>Trigger Maintenance</button>
        <button className="btn w-full" onClick={() => onCommand('resume')}>Resume Mission</button>
      </div>
    </div>
  );
}

export default AuvCommandConsole;
