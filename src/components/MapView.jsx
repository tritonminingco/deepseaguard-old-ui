import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/MapView.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom AUV icon
const createAUVIcon = (status, isSelected) => {
  const color = status === 'active' ? '#10b981' : 
               status === 'warning' ? '#f59e0b' : 
               status === 'critical' ? '#ef4444' : '#6b7280';
  
  const size = isSelected ? 20 : 16;
  
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

  // Fetch AUV data from backend
  useEffect(() => {
    async function fetchAUVs() {
      try {
        const auvs = await window.apiClient.fetchData(`/telemetry/auvs?timeFrame=${timeFrame}`);
        setAuvs(auvs || []);
      } catch (err) {
        setAuvs([]);
      }
    }
    fetchAUVs();
  }, [timeFrame]);

  // Fetch sediment plume data from backend
  useEffect(() => {
    async function fetchPlumes() {
      try {
        const plumes = await window.apiClient.fetchData(`/telemetry/sediment_plumes?timeFrame=${timeFrame}`);
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

  return (
    <div className="map-view">
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
          <MapController selectedAUV={selectedAUV} auvs={auvs} />
          
          {/* AUV Markers */}
          {auvs.map(auv => (
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
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
            <span>Active</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>Warning</span>
          </div>
          <div className="legend-item">
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
    </div>
  );
}

export default MapView;

