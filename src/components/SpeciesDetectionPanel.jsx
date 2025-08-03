import { useState } from 'react';
import fathomNetWS from '../utils/fathomNetWebSocket';
import FathomNetSearch from './FathomNetSearch';

/**
 * Species Detection Panel
 * 
 * A panel that combines manual species search with recent species detections
 * and displays FathomNet reference data for marine species.
 */
function SpeciesDetectionPanel() {
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [recentDetections, setRecentDetections] = useState([
    {
      id: 1,
      species: 'Dumbo Octopus',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      auv: 'AUV-001',
      confidence: 0.87,
      distance: 45
    },
    {
      id: 2,
      species: 'Atolla Jellyfish',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      auv: 'AUV-002',
      confidence: 0.92,
      distance: 78
    }
  ]);

  const handleSpeciesSelect = (speciesData) => {
    setSelectedSpecies(speciesData);
  };

  const triggerSpeciesAlert = (species) => {
    // Use the enhanced WebSocket service to trigger species alert
    fathomNetWS.triggerSpeciesAlert(species, 'AUV-001');
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <div className="panel species-detection-panel">
      <div className="panel-header">
        <h3 className="panel-title">🐙 Species Detection</h3>
      </div>
      <div className="panel-body">
        {/* Species Search Section */}
        <div className="search-section">
          <div className="section-header">
            <h4>Search Marine Species</h4>
          </div>
          <FathomNetSearch 
            onSpeciesSelect={handleSpeciesSelect}
            className="species-search"
          />
        </div>

        {/* Selected Species Display */}
        {selectedSpecies && (
          <div className="selected-species">
            <div className="section-header">
              <h4>Species Information</h4>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => triggerSpeciesAlert(selectedSpecies.species)}
                title="Simulate detection alert"
              >
                Trigger Alert
              </button>
            </div>
            
            <div className="species-card">
              <div className="species-header">
                <h5>{selectedSpecies.species}</h5>
                {selectedSpecies.taxonomy?.commonName && (
                  <span className="common-name">
                    ({selectedSpecies.taxonomy.commonName})
                  </span>
                )}
              </div>

              {selectedSpecies.taxonomy && (
                <div className="taxonomy-summary">
                  {selectedSpecies.taxonomy.family && (
                    <span className="taxonomy-item">
                      Family: {selectedSpecies.taxonomy.family}
                    </span>
                  )}
                  {selectedSpecies.taxonomy.order && (
                    <span className="taxonomy-item">
                      Order: {selectedSpecies.taxonomy.order}
                    </span>
                  )}
                </div>
              )}

              {selectedSpecies.images?.length > 0 && (
                <div className="species-images">
                  <div className="image-grid">
                    {selectedSpecies.images.map((image, index) => (
                      <div key={image.id || index} className="species-image">
                        <img 
                          src={image.thumbnail || image.url}
                          alt={`${selectedSpecies.species} reference`}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        {image.depth && (
                          <div className="image-overlay">
                            <span className="depth-info">{image.depth}m</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="fathomnet-attribution">
                <span>🌊 Data from FathomNet</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Detections */}
        <div className="recent-detections">
          <div className="section-header">
            <h4>Recent Detections</h4>
          </div>
          
          {recentDetections.length === 0 ? (
            <div className="no-detections">
              <span className="data-label">No recent detections</span>
            </div>
          ) : (
            <div className="detection-list">
              {recentDetections.map(detection => (
                <div key={detection.id} className="detection-item">
                  <div className="detection-info">
                    <div className="species-name">{detection.species}</div>
                    <div className="detection-meta">
                      <span className="auv-id">{detection.auv}</span>
                      <span className="distance">{detection.distance}m</span>
                      <span className="confidence">
                        {Math.round(detection.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="detection-time">
                    {formatTimeAgo(detection.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .species-detection-panel {
          max-height: 600px;
        }

        .search-section, .selected-species, .recent-detections {
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-header h4 {
          margin: 0;
          font-size: 14px;
          color: #94a3b8;
          font-weight: 600;
        }

        .species-card {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 16px;
        }

        .species-header {
          margin-bottom: 12px;
        }

        .species-header h5 {
          margin: 0;
          font-size: 16px;
          color: #f8fafc;
          font-style: italic;
          font-weight: 600;
        }

        .common-name {
          font-size: 12px;
          color: #94a3b8;
          font-style: normal;
          margin-left: 8px;
        }

        .taxonomy-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .taxonomy-item {
          font-size: 11px;
          color: #64748b;
          background: rgba(51, 65, 85, 0.5);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .species-images {
          margin-bottom: 12px;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .species-image {
          position: relative;
          border-radius: 6px;
          overflow: hidden;
          aspect-ratio: 4/3;
        }

        .species-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          padding: 8px;
        }

        .depth-info {
          color: #f8fafc;
          font-size: 10px;
          font-weight: 600;
        }

        .fathomnet-attribution {
          font-size: 10px;
          color: #64748b;
          text-align: center;
        }

        .detection-list {
          space-y: 8px;
        }

        .detection-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(30, 41, 59, 0.3);
          border: 1px solid #334155;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .detection-info {
          flex: 1;
        }

        .species-name {
          font-size: 13px;
          color: #f8fafc;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .detection-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: #64748b;
        }

        .auv-id {
          font-family: monospace;
          color: #3b82f6;
        }

        .distance {
          color: #f59e42;
        }

        .confidence {
          color: #10b981;
        }

        .detection-time {
          font-size: 11px;
          color: #64748b;
          font-family: monospace;
        }

        .no-detections {
          text-align: center;
          padding: 20px;
          color: #64748b;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

export default SpeciesDetectionPanel;
