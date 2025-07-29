// React and React Leaflet imports for map rendering and interactivity
import React, { useState, useEffect, useRef } from 'react';
import MissionControlPanel from './MissionControlPanel';
import { AUVService } from '../utils/dataService';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
// Leaflet core library for map and marker utilities
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Custom styles for the map view
import '../styles/MapView.css';

// Fix for default markers in React Leaflet:
// Remove the default icon URLs so we can use custom icons for AUVs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Creates a custom Leaflet divIcon for AUV markers.
 * The color and size depend on the AUV's status and selection state.
 * @param {string} status - The status of the AUV (active, warning, critical, etc.)
 * @param {boolean} isSelected - Whether this AUV is currently selected
 * @returns {L.DivIcon} - The custom icon for the marker
 */
const createAUVIcon = (status, isSelected) => {
  // Choose color based on status
  const color = status === 'active' ? '#10b981' : 
               status === 'warning' ? '#f59e0b' : 
               status === 'critical' ? '#ef4444' : '#6b7280';
  // Selected AUVs are larger
  const size = isSelected ? 20 : 16;
  // Return a styled divIcon
  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ${isSelected ? 'animation: pulse 2s infinite;' : ''}
    "></div>`,
    className: 'auv-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// Component to update map view based on selected AUV
function MapController({ selectedAUV, auvs }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedAUV && auvs) {
      const auv = auvs.find(a => a.id === selectedAUV);
      if (auv) {
        map.setView([auv.lat, auv.lng], 12, { animate: true });
      }
    }
  }, [selectedAUV, auvs, map]);
  
  return null;
}

function MapView({ timeFrame, selectedAUV, onAUVSelect, playbackSpeed }) {
  const [auvs, setAuvs] = useState([]);
  const [sedimentPlumes, setSedimentPlumes] = useState([]);
  const [mapCenter] = useState([-12.0, -77.0]); // Pacific Ocean coordinates
  const [mapZoom] = useState(8);
  const mapRef = useRef();

  // Legend filter state
  const [auvStatusFilter, setAuvStatusFilter] = useState(null); // 'active', 'warning', 'critical', or null for all

  // Playback state for historical mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const playbackInterval = useRef(null);

  // Collapsible panel state
  const [collapse, setCollapse] = useState({
    fleet: true,
    system: true,
    alerts: true,
    timeline: true,
    compliance: true,
    isa: true,
    species: true,
    export: true,
    user: true,
    health: true
  });

  const toggleCollapse = key => setCollapse(c => ({ ...c, [key]: !c[key] }));

  // Fetch AUV data from centralized data service
  useEffect(() => {
    async function fetchAUVs() {
      try {
        let auvs = [];
        if (timeFrame === 'live') {
          auvs = await AUVService.getAllAUVs();
        } else {
          // Simulate historical playback with a time series array (mocked for now)
          // Replace with real historical fetch if available
          auvs = await AUVService.getAllAUVs();
        }
        setAuvs(auvs || []);
        setPlaybackIndex(0); // Reset playback index on new data
      } catch (err) {
        setAuvs([]);
      }
    }
    fetchAUVs();
  }, [timeFrame]);
  // Playback controls for historical mode
  useEffect(() => {
    if (timeFrame === 'live') return; // Only for historical
    if (isPlaying) {
      playbackInterval.current = setInterval(() => {
        setPlaybackIndex(idx => idx + 1);
      }, 1000 / playbackSpeed);
    } else if (playbackInterval.current) {
      clearInterval(playbackInterval.current);
    }
    return () => {
      if (playbackInterval.current) clearInterval(playbackInterval.current);
    };
  }, [isPlaying, playbackSpeed, timeFrame]);

  // Filtered AUVs for legend interactivity
  const filteredAuvs = auvStatusFilter ? auvs.filter(a => a.status === auvStatusFilter) : auvs;

  // Fetch sediment plume data from centralized data service
  useEffect(() => {
    async function fetchPlumes() {
      try {
        // Use MapService for sediment plumes
        let plumes = [];
        if (AUVService?.getPlumeData) {
          plumes = await AUVService.getPlumeData();
        } else if (window.apiClient?.fetchData) {
          // fallback for legacy
          plumes = await window.apiClient.fetchData(`/telemetry/sediment_plumes?timeFrame=${timeFrame}`);
        }
        setSedimentPlumes(plumes || []);
      } catch (err) {
        setSedimentPlumes([]);
      }
    }
    fetchPlumes();
  }, [timeFrame]);

  const handleAUVClick = (auvId) => {
    onAUVSelect(auvId);
  };

  const getPlumeColor = (sedimentLevel) => {
    if (sedimentLevel > 25) return '#ef4444'; // Red - above ISA threshold
    if (sedimentLevel > 15) return '#f59e0b'; // Yellow - warning level
    return '#10b981'; // Green - safe level
  };

  // Mission Control Panel state (mocked command log)
  const [commandLog, setCommandLog] = useState([
    { cmd: 'Started Mission', ts: '10:00:01' },
    { cmd: 'Set Waypoint', ts: '10:01:12' },
    { cmd: 'Snapshot Taken', ts: '10:02:05' },
    { cmd: 'Paused', ts: '10:03:00' },
    { cmd: 'Resumed', ts: '10:03:30' },
  ]);

  // Find selected AUV object
  const selectedAUVObj = auvs.find(a => a.id === selectedAUV);

  // Mission Control Panel actions (mocked)
  const handlePause = () => setCommandLog(log => [{ cmd: 'Paused', ts: new Date().toLocaleTimeString() }, ...log.slice(0, 4)]);
  const handleAbort = () => setCommandLog(log => [{ cmd: 'Aborted', ts: new Date().toLocaleTimeString() }, ...log.slice(0, 4)]);
  const handleLogEvent = () => setCommandLog(log => [{ cmd: 'Event Logged', ts: new Date().toLocaleTimeString() }, ...log.slice(0, 4)]);
  const handleCenter = () => {
    if (selectedAUVObj && mapRef.current) {
      mapRef.current.setView([selectedAUVObj.lat, selectedAUVObj.lng], 12, { animate: true });
    }
  };

  return (
    <main className="dashboard" style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
      <div className="map-view" style={{ flex: 1, minWidth: 0 }}>
        <div className="map-header">
          <h2>Ocean Floor Monitoring</h2>
          <div className="map-status">
            <span className={`status-indicator ${timeFrame === 'live' ? 'live' : 'historical'}`}>
              {timeFrame === 'live' ? '● LIVE' : `Historical: ${timeFrame}`}
            </span>
            {timeFrame !== 'live' && (
              <span className="playback-speed">
                Speed: {playbackSpeed}x
              </span>
            )}
          </div>
          {/* Playback controls for historical mode */}
          {timeFrame !== 'live' && (
            <div className="playback-controls" style={{ marginTop: 8 }}>
              <button onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button onClick={() => setPlaybackIndex(idx => Math.max(0, idx - 1))}>
                ◀
              </button>
              <button onClick={() => setPlaybackIndex(idx => idx + 1)}>
                ▶
              </button>
              <span style={{ marginLeft: 8 }}>Step: {playbackIndex}</span>
            </div>
          )}
        </div>

        <div className="map-container">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {/* Map controller for centering on selected AUV */}
            <MapController selectedAUV={selectedAUV} auvs={filteredAuvs} />
            {/* AUV Markers (filtered by legend) */}
            {filteredAuvs.map(auv => (
              <Marker
                key={auv.id}
                position={[auv.lat, auv.lng]}
                icon={createAUVIcon(auv.status, selectedAUV === auv.id)}
                eventHandlers={{
                  click: () => handleAUVClick(auv.id)
                }}
              >
                <Popup>
                  <div className="auv-popup">
                    <h3>{auv.id}</h3>
                    <div className="auv-details">
                      <p><strong>Status:</strong> {auv.status}</p>
                      <p><strong>Battery:</strong> {auv.battery}%</p>
                      <p><strong>Depth:</strong> {auv.depth}m</p>
                      <p><strong>Speed:</strong> {auv.speed} m/s</p>
                      <p><strong>Heading:</strong> {auv.heading}°</p>
                      <hr />
                      <p><strong>Mission:</strong> {auv.mission.id}</p>
                      <p><strong>Duration:</strong> {auv.mission.duration}</p>
                      <p><strong>Progress:</strong> {auv.mission.progress}%</p>
                      <p><strong>Nodules:</strong> {auv.mission.nodulesCollected}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            {/* Sediment Plumes */}
            {sedimentPlumes.map(plume => (
              <CircleMarker
                key={plume.id}
                center={[plume.lat, plume.lng]}
                radius={plume.radius / 20} // Scale for visibility
                pathOptions={{
                  color: getPlumeColor(plume.sedimentLevel),
                  fillColor: getPlumeColor(plume.sedimentLevel),
                  fillOpacity: plume.intensity * 0.3,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="plume-popup">
                    <h4>Sediment Plume</h4>
                    <p><strong>Sediment Level:</strong> {plume.sedimentLevel} mg/L</p>
                    <p><strong>ISA Threshold:</strong> 25 mg/L</p>
                    <p><strong>Status:</strong> 
                      <span className={`status ${plume.sedimentLevel > 25 ? 'violation' : 'compliant'}`}>
                        {plume.sedimentLevel > 25 ? ' VIOLATION' : ' Compliant'}
                      </span>
                    </p>
                    <p><strong>Radius:</strong> {plume.radius}m</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="map-legend">
          <div className="legend-section">
            <h4>AUV Status</h4>
            <div className="legend-item" style={{ cursor: 'pointer', fontWeight: auvStatusFilter === 'active' ? 'bold' : 'normal' }} onClick={() => setAuvStatusFilter(auvStatusFilter === 'active' ? null : 'active')}>
              <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
              <span>Active</span>
            </div>
            <div className="legend-item" style={{ cursor: 'pointer', fontWeight: auvStatusFilter === 'warning' ? 'bold' : 'normal' }} onClick={() => setAuvStatusFilter(auvStatusFilter === 'warning' ? null : 'warning')}>
              <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
              <span>Warning</span>
            </div>
            <div className="legend-item" style={{ cursor: 'pointer', fontWeight: auvStatusFilter === 'critical' ? 'bold' : 'normal' }} onClick={() => setAuvStatusFilter(auvStatusFilter === 'critical' ? null : 'critical')}>
              <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
              <span>Critical</span>
            </div>
          </div>
          <div className="legend-section">
            <h4>Sediment Levels</h4>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
              <span>&lt; 15 mg/L</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
              <span>15-25 mg/L</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
              <span>&gt; 25 mg/L (ISA Violation)</span>
            </div>
          </div>
        </div>

        {/* AUV Fleet Panel */}
        <div className="auv-fleet-panel" style={{ marginTop: 24, background: '#f8fafc', borderRadius: 8, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h4 style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCollapse('fleet')}>
            {collapse.fleet ? '▼' : '►'} AUV Fleet
          </h4>
          {collapse.fleet && (
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#e5e7eb' }}>
                  <th style={{ padding: 4, textAlign: 'left' }}>ID</th>
                  <th style={{ padding: 4, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 4, textAlign: 'left' }}>Battery</th>
                  <th style={{ padding: 4, textAlign: 'left' }}>Mission</th>
                  <th style={{ padding: 4, textAlign: 'left' }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuvs.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No AUVs</td></tr>
                )}
                {filteredAuvs.map(auv => (
                  <tr key={auv.id} style={{ cursor: 'pointer', background: selectedAUV === auv.id ? '#dbeafe' : 'transparent' }} onClick={() => handleAUVClick(auv.id)}>
                    <td style={{ padding: 4 }}>{auv.id}</td>
                    <td style={{ padding: 4 }}>{auv.status}</td>
                    <td style={{ padding: 4 }}>{auv.battery}%</td>
                    <td style={{ padding: 4 }}>{auv.mission?.id || '-'}</td>
                    <td style={{ padding: 4 }}>{auv.mission?.progress ?? '-'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* System Status Panel */}
        <div className="system-status-panel" style={{ marginTop: 24, background: '#f1f5f9', borderRadius: 8, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h4 style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCollapse('system')}>
            {collapse.system ? '▼' : '►'} System Status
          </h4>
          {collapse.system && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ minWidth: 120 }}>
              <strong>WEBSOCKET</strong><br />
              <span style={{ color: '#ef4444', fontWeight: 600 }}>DISCONNECTED</span>
            </div>
            <div style={{ minWidth: 120 }}>
              <strong>API</strong><br />
              <span style={{ color: '#10b981', fontWeight: 600 }}>ONLINE</span>
            </div>
            <div style={{ minWidth: 120 }}>
              <strong>DATABASE</strong><br />
              <span style={{ color: '#10b981', fontWeight: 600 }}>ACTIVE</span>
            </div>
            <div style={{ minWidth: 120 }}>
              <strong>COMPLIANCE</strong><br />
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>MONITORING</span>
            </div>
          </div>
          )}
        </div>

        {/* Recent Alerts Panel */}
        <div className="recent-alerts-panel" style={{ marginTop: 24, background: '#fef9c3', borderRadius: 8, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h4 style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCollapse('alerts')}>
            {collapse.alerts ? '▼' : '►'} Recent Alerts
          </h4>
          {collapse.alerts && (
          <div style={{ color: '#888', fontStyle: 'italic' }}>NO ACTIVE ALERTS</div>
          )}
        </div>

        {/* Mission Timeline / Activity Log */}
        <div className="mission-timeline-panel" style={{ marginTop: 24, background: '#f3f4f6', borderRadius: 8, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h4 style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCollapse('timeline')}>
            {collapse.timeline ? '▼' : '►'} Mission Timeline / Activity Log
          </h4>
          {collapse.timeline && (
          <div style={{ maxHeight: 120, overflowY: 'auto' }}>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              <li style={{ marginBottom: 6 }}>
                <span style={{ color: '#0ea5e9', fontWeight: 600 }}>AUV-1</span> started mission "Survey-Alpha" at 10:02 UTC
                <button style={{ marginLeft: 8 }} disabled>View Details</button>
              </li>
              <li style={{ marginBottom: 6 }}>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>AUV-2</span> battery low at 09:55 UTC
                <button style={{ marginLeft: 8 }} disabled>View Details</button>
              </li>
              <li style={{ marginBottom: 6 }}>
                <span style={{ color: '#10b981', fontWeight: 600 }}>AUV-3</span> completed mission "Transect-Beta" at 09:30 UTC
                <button style={{ marginLeft: 8 }} disabled>View Details</button>
              </li>
            </ul>
          </div>
          )}
        </div>

        {/* Compliance & Environmental Summary */}
        <div className="compliance-summary-panel" style={{ marginTop: 24, background: '#e0f2fe', borderRadius: 8, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h4 style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCollapse('compliance')}>
            {collapse.compliance ? '▼' : '►'} Compliance & Environmental Summary
          </h4>
          {collapse.compliance && (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <strong>Compliance:</strong> <span style={{ color: '#10b981' }}>All Zones Compliant</span>
            </div>
            <div>
              <strong>Temperature:</strong> 2.7°C
            </div>
            <div>
              <strong>Turbidity:</strong> 1.2 NTU
            </div>
            <div>
              <strong>O2:</strong> 6.8 mg/L
            </div>
          </div>
          )}
        </div>

        {/* ISA Zone Overview */}
        <div className="isa-zone-panel" style={{ marginTop: 24, background: '#f1f5f9', borderRadius: 8, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h4 style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCollapse('isa')}>
            {collapse.isa ? '▼' : '►'} ISA Zone Overview
          </h4>
          {collapse.isa && (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#e5e7eb' }}>
                <th style={{ padding: 4, textAlign: 'left' }}>Zone</th>
                <th style={{ padding: 4, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 4, textAlign: 'left' }}>AUVs</th>
                <th style={{ padding: 4, textAlign: 'left' }}></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: 4 }}>Zone-Alpha</td>
                <td style={{ padding: 4, color: '#10b981' }}>Compliant</td>
                <td style={{ padding: 4 }}>2</td>
                <td style={{ padding: 4 }}><button disabled>View on Map</button></td>
              </tr>
              <tr>
                <td style={{ padding: 4 }}>Zone-Beta</td>
                <td style={{ padding: 4, color: '#ef4444' }}>Violation</td>
                <td style={{ padding: 4 }}>1</td>
                <td style={{ padding: 4 }}><button disabled>View on Map</button></td>
              </tr>
            </tbody>
          </table>
          )}
        </div>

        {/* Protected Species Sightings */}
        <div className="species-sightings-panel" style={{ marginTop: 24, background: '#f3e8ff', borderRadius: 8, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h4 style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCollapse('species')}>
            {collapse.species ? '▼' : '►'} Protected Species Sightings
          </h4>
          {collapse.species && (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#e5e7eb' }}>
                <th style={{ padding: 4, textAlign: 'left' }}>Time</th>
                <th style={{ padding: 4, textAlign: 'left' }}>Species</th>
                <th style={{ padding: 4, textAlign: 'left' }}>AUV</th>
                <th style={{ padding: 4, textAlign: 'left' }}>Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: 4 }}>10:12 UTC</td>
                <td style={{ padding: 4 }}>Leatherback Turtle</td>
                <td style={{ padding: 4 }}>AUV-2</td>
                <td style={{ padding: 4 }}>-12.1, -77.2</td>
              </tr>
              <tr>
                <td style={{ padding: 4 }}>09:48 UTC</td>
                <td style={{ padding: 4 }}>Sperm Whale</td>
                <td style={{ padding: 4 }}>AUV-1</td>
                <td style={{ padding: 4 }}>-12.3, -77.0</td>
              </tr>
            </tbody>
          </table>
          )}
        </div>

        {/* Export & Reporting */}
        <div className="export-report-panel" style={{ marginTop: 24, background: '#f1f5f9', borderRadius: 8, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 16, alignItems: 'center' }}>
          <h4 style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCollapse('export')}>
            {collapse.export ? '▼' : '►'} Export & Reporting
          </h4>
          {collapse.export && (
          <>
            <button disabled>Export CSV</button>
            <button disabled>Export PDF</button>
            <button disabled>Generate ISA Report</button>
          </>
          )}
        </div>

        {/* User/Operator Panel */}
        <div className="user-operator-panel" style={{ marginTop: 24, background: '#e0e7ff', borderRadius: 8, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <h4 style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCollapse('user')}>
            {collapse.user ? '▼' : '►'} User / Operator
          </h4>
          {collapse.user && (
          <>
            <div>
              <strong>User:</strong> <span>demo@deepseaguard.com</span>
            </div>
            <div>
              <strong>Role:</strong> <span>Scientist</span>
            </div>
            <button disabled>Settings</button>
            <button disabled>Logout</button>
          </>
          )}
        </div>

        {/* System Health Graphs (placeholder) */}
        <div className="system-health-graphs-panel" style={{ marginTop: 24, background: '#f1f5f9', borderRadius: 8, padding: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h4 style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleCollapse('health')}>
            {collapse.health ? '▼' : '►'} System Health
          </h4>
          {collapse.health && (
          <div style={{ color: '#888', fontStyle: 'italic' }}>[System health graphs coming soon]</div>
          )}
        </div>
      </div>

      {/* Mission Control Panel Sidebar (new component) */}
      <MissionControlPanel selectedAUV={selectedAUVObj} />
    </main>
  );
}

export default MapView;

