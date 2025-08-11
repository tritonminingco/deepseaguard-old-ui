import { useEffect, useState } from 'react';
import { FATHOMNET_ENDPOINTS, apiRequest } from '../config/api';
import { useAlerts } from '../hooks/useAlerts.js';
import '../styles/AlertSystem.css';
import '../styles/FathomNetIntegration.css';

/**
 * Enhanced AlertSystem Component with FathomNet Integration
 * 
 * This component displays system alerts and automatically fetches
 * species reference images and taxonomy data from FathomNet when
 * species detection alerts are triggered.
 */
function EnhancedAlertSystem({ onClose }) {
  const { alerts, acknowledgeAlert, resolveAlert, deleteAlert } = useAlerts();
  
  const [speciesData, setSpeciesData] = useState({});
  const [loadingSpecies, setLoadingSpecies] = useState({});
  const [expandedAlerts, setExpandedAlerts] = useState(new Set());

  // Fetch species data from FathomNet when a species alert is detected
  useEffect(() => {
    const fetchSpeciesData = async (alert) => {
      if (!alert.species || speciesData[alert.species] || loadingSpecies[alert.species]) {
        return;
      }

      setLoadingSpecies(prev => ({ ...prev, [alert.species]: true }));

      try {
        const url = FATHOMNET_ENDPOINTS.getSpecies(alert.species, 3);
        const data = await apiRequest(url);
        
        setSpeciesData(prev => ({
          ...prev,
          [alert.species]: data
        }));
      } catch (error) {
        console.error(`Failed to fetch FathomNet data for ${alert.species}:`, error);
        setSpeciesData(prev => ({
          ...prev,
          [alert.species]: { error: 'Failed to load species data' }
        }));
      } finally {
        setLoadingSpecies(prev => ({ ...prev, [alert.species]: false }));
      }
    };

    // Check for new species alerts
    alerts.forEach(alert => {
      if (alert.species && !speciesData[alert.species] && !loadingSpecies[alert.species]) {
        fetchSpeciesData(alert);
      }
    });
  }, [alerts, speciesData, loadingSpecies]);

  const toggleAlertExpansion = (alertId) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const getSeverityIcon = (severity) => {
    const textLabels = { 
      critical: 'CRITICAL', 
      warning: 'WARNING', 
      info: 'INFO', 
      high: 'HIGH', 
      medium: 'MEDIUM', 
      low: 'LOW' 
    };
    return textLabels[severity] || 'INFO';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  const renderSpeciesInfo = (alert) => {
    if (!alert.species) return null;

    const species = alert.species;
    const data = speciesData[species];
    const loading = loadingSpecies[species];
    const isExpanded = expandedAlerts.has(alert.id);

    return (
      <div className="species-info">
        <div className="species-header" onClick={() => toggleAlertExpansion(alert.id)}>
          <div className="species-title">
            <span className="species-icon">Species:</span>
            <span className="species-name">{species}</span>
            {alert.distance && <span className="distance">~{alert.distance}m</span>}
          </div>
          <button className="expand-btn">
            {isExpanded ? 'COLLAPSE' : 'EXPAND'}
          </button>
        </div>

        {isExpanded && (
          <div className="species-details">
            {loading && (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <span>Loading FathomNet data...</span>
              </div>
            )}

            {data && !loading && (
              <div className="fathomnet-data">
                {data.error ? (
                  <div className="error-message">
                    <span>ERROR: {data.error}</span>
                  </div>
                ) : (
                  <>
                    {data.taxonomy && (
                      <div className="taxonomy-info">
                        <h4>Taxonomy</h4>
                        <div className="taxonomy-grid">
                          {data.taxonomy.scientificName && (
                            <div className="taxonomy-item">
                              <span className="label">Scientific:</span>
                              <span className="value">{data.taxonomy.scientificName}</span>
                            </div>
                          )}
                          {data.taxonomy.commonName && (
                            <div className="taxonomy-item">
                              <span className="label">Common:</span>
                              <span className="value">{data.taxonomy.commonName}</span>
                            </div>
                          )}
                          {data.taxonomy.family && (
                            <div className="taxonomy-item">
                              <span className="label">Family:</span>
                              <span className="value">{data.taxonomy.family}</span>
                            </div>
                          )}
                          {data.taxonomy.order && (
                            <div className="taxonomy-item">
                              <span className="label">Order:</span>
                              <span className="value">{data.taxonomy.order}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {data.images && data.images.length > 0 && (
                      <div className="reference-images">
                        <h4>Reference Images</h4>
                        <div className="image-grid">
                          {data.images.slice(0, 3).map((image, index) => (
                            <div key={image.id || index} className="image-item">
                              <img 
                                src={image.thumbnail || image.url} 
                                alt={image.caption || `${species} reference`}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <div className="image-info">
                                {image.depth && <span className="depth">Depth: {image.depth}m</span>}
                                {image.dataset && <span className="dataset">{image.dataset}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="fathomnet-footer">
                      <span className="source">Data from FathomNet</span>
                      <span className="timestamp">
                        Fetched: {new Date(data.fetchedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="enhanced-alert-system-overlay">
      <div className="enhanced-alert-system">
        <div className="enhanced-alert-header">
          <h2>System Alerts</h2>
          <div className="alert-summary">
            <span className="total-count">{alerts.length} alerts</span>
          </div>
          <button className="close-button" onClick={onClose}>
            CLOSE
          </button>
        </div>

        <div className="alert-list enhanced">
          {alerts.length === 0 ? (
            <div className="no-alerts">
              <div className="no-alerts-icon">OK</div>
              <h3>No active alerts</h3>
              <p>System monitoring is active.</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className={`alert-item ${alert.severity || 'info'}`}>
                <div className="alert-main">
                  <div className="alert-icon">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-meta">
                      <span className="alert-time">{formatTimeAgo(alert.timestamp)}</span>
                      {alert.auv_id && <span className="auv-id">{alert.auv_id}</span>}
                      <span className="alert-severity">{(alert.severity || 'info').toUpperCase()}</span>
                    </div>
                    
                    {/* Enhanced species information section */}
                    {alert.species && renderSpeciesInfo(alert)}
                  </div>
                  <div className="alert-actions">
                    <button
                      className="acknowledge-button"
                      onClick={() => acknowledgeAlert(alert.id)}
                      title="Acknowledge alert"
                      disabled={alert.acknowledged}
                    >
                      {alert.acknowledged ? 'DONE' : 'ACK'}
                    </button>
                    <button
                      className="resolve-button"
                      onClick={() => resolveAlert(alert.id, 'Resolved by user')}
                      title="Resolve alert"
                      disabled={alert.resolved}
                    >
                      {alert.resolved ? 'RESOLVED' : 'RESOLVE'}
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => deleteAlert(alert.id)}
                      title="Delete alert"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default EnhancedAlertSystem;
