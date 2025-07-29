import React from 'react';
import '../styles/MissionControlPanel.css';

// Mock telemetry data for demonstration
const mockTelemetry = {
  id: 'AUV-003',
  battery: 32,
  depth: 3210,
  heading: 278,
  speed: 1.2,
  lastCommands: [
    { timestamp: '17:43:00', command: 'Set waypoint' },
    { timestamp: '17:42:30', command: 'Log event: species detected' },
    { timestamp: '17:42:10', command: 'Reroute' }
  ]
};

function MissionControlPanel({ selectedAUV = mockTelemetry }) {
  const auv = selectedAUV;

  return (
    <div className="mission-control-panel">
      <h3>Mission Control</h3>
      <div className="telemetry">
        <div className="telemetry-item"><strong>ID:</strong> {auv.id}</div>
        <div className="telemetry-item"><strong>Battery:</strong> {auv.battery}%</div>
        <div className="telemetry-item"><strong>Depth:</strong> {auv.depth} m</div>
        <div className="telemetry-item"><strong>Heading:</strong> {auv.heading}&deg;</div>
        <div className="telemetry-item"><strong>Speed:</strong> {auv.speed} knots</div>
      </div>

      <div className="controls">
        <button className="control-button abort">Abort</button>
        <button className="control-button pause">Pause</button>
        <button className="control-button log">Log Event</button>
        <button className="control-button center">Center on AUV</button>
      </div>

      <div className="command-log">
        <h4>Recent Commands</h4>
        <ul>
          {auv.lastCommands.map((cmd, idx) => (
            <li key={idx}><span className="cmd-time">{cmd.timestamp}</span> - {cmd.command}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MissionControlPanel;
