import { useState, useEffect, useRef } from 'react';

function Map3D({ timeFrame, onAUVSelect, selectedAUV }) {
  const [mapData, setMapData] = useState({
    auvs: [
      { id: 'AUV-001', position: [0, 0, -2450], status: 'active', battery: 85 },
      { id: 'AUV-002', position: [500, 200, -2380], status: 'warning', battery: 32 },
      { id: 'AUV-003', position: [-300, 400, -2520], status: 'active', battery: 67 }
    ],
    zones: [
      { id: 'zone-1', name: 'Collection Area A', type: 'collection' },
      { id: 'zone-2', name: 'Sensitive Habitat', type: 'protected' }
    ]
  });

  const [viewMode, setViewMode] = useState('overview');
  const [showLayers, setShowLayers] = useState({
    auvs: true,
    zones: true,
    bathymetry: true,
    sensitiveAreas: true
  });

  const handleAUVClick = (auvId) => {
    onAUVSelect(auvId);
  };

  const toggleLayer = (layerName) => {
    setShowLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  return (
    <div className="map3d-container">
      <div className="map3d-header">
        <h3>3D Ocean Map</h3>
        <div className="view-controls">
          <button 
            className={viewMode === 'overview' ? 'active' : ''}
            onClick={() => setViewMode('overview')}
          >
            Overview
          </button>
          <button 
            className={viewMode === 'detailed' ? 'active' : ''}
            onClick={() => setViewMode('detailed')}
          >
            Detailed
          </button>
        </div>
      </div>

      <div className="map3d-viewport">
        {/* Simplified 3D visualization placeholder */}
        <div className="map3d-scene">
          <div className="ocean-floor">
            <div className="depth-indicator">Ocean Floor: ~2500m depth</div>
          </div>
          
          {/* AUV representations */}
          {showLayers.auvs && mapData.auvs.map(auv => (
            <div 
              key={auv.id}
              className={`auv-marker ${auv.status} ${selectedAUV === auv.id ? 'selected' : ''}`}
              onClick={() => handleAUVClick(auv.id)}
              style={{
                left: `${50 + auv.position[0] / 20}%`,
                top: `${50 + auv.position[1] / 20}%`
              }}
            >
              <div className="auv-icon">🤖</div>
              <div className="auv-label">
                {auv.id}
                <br />
                Battery: {auv.battery}%
                <br />
                Depth: {Math.abs(auv.position[2])}m
              </div>
            </div>
          ))}

          {/* Zone representations */}
          {showLayers.zones && mapData.zones.map(zone => (
            <div 
              key={zone.id}
              className={`zone-marker ${zone.type}`}
            >
              <div className="zone-label">{zone.name}</div>
            </div>
          ))}

          {/* Bathymetry grid */}
          {showLayers.bathymetry && (
            <div className="bathymetry-grid">
              <div className="grid-lines"></div>
            </div>
          )}
        </div>
      </div>

      <div className="map3d-controls">
        <div className="layer-controls">
          <h4>Layers</h4>
          <label>
            <input 
              type="checkbox" 
              checked={showLayers.auvs} 
              onChange={() => toggleLayer('auvs')} 
            />
            <span>AUVs</span>
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={showLayers.zones} 
              onChange={() => toggleLayer('zones')} 
            />
            <span>Zones</span>
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={showLayers.bathymetry} 
              onChange={() => toggleLayer('bathymetry')} 
            />
            <span>Bathymetry</span>
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={showLayers.sensitiveAreas} 
              onChange={() => toggleLayer('sensitiveAreas')} 
            />
            <span>Sensitive Areas</span>
          </label>
        </div>
        
        <div className="time-indicator">
          {timeFrame === 'live' ? (
            <span className="live-indicator">● LIVE</span>
          ) : (
            <span>Historical: {timeFrame.replace('_', ' ')}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Map3D;

