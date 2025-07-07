import React from 'react';
import '../../styles/panels/EnvironmentalMetrics.css';

function EnvironmentalMetrics({ data, selectedAUV, timeFrame }) {
  if (!data) {
    return (
      <div className="panel-container">
        <div className="no-data">
          <p>No environmental data available</p>
          <p className="help-text">Select an AUV to view environmental metrics</p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      id: 'temperature',
      label: 'Water Temperature',
      value: data.temperature,
      unit: '°C',
      status: data.temperature > 5 ? 'warning' : data.temperature < 3 ? 'critical' : 'normal',
      threshold: '3-5°C optimal',
      icon: '🌡️'
    },
    {
      id: 'salinity',
      label: 'Salinity',
      value: data.salinity,
      unit: 'PSU',
      status: data.salinity < 34 || data.salinity > 35 ? 'warning' : 'normal',
      threshold: '34-35 PSU normal',
      icon: '🧂'
    },
    {
      id: 'dissolvedOxygen',
      label: 'Dissolved Oxygen',
      value: data.dissolvedOxygen,
      unit: 'mg/L',
      status: data.dissolvedOxygen < 6 ? 'critical' : data.dissolvedOxygen < 7 ? 'warning' : 'normal',
      threshold: '>6 mg/L required',
      icon: '💨'
    },
    {
      id: 'pH',
      label: 'pH Level',
      value: data.pH,
      unit: '',
      status: data.pH < 7.8 || data.pH > 8.3 ? 'warning' : 'normal',
      threshold: '7.8-8.3 optimal',
      icon: '⚗️'
    },
    {
      id: 'turbidity',
      label: 'Turbidity',
      value: data.turbidity,
      unit: 'NTU',
      status: data.turbidity > 3 ? 'warning' : data.turbidity > 5 ? 'critical' : 'normal',
      threshold: '<3 NTU preferred',
      icon: '🌫️'
    },
    {
      id: 'pressure',
      label: 'Water Pressure',
      value: data.pressure,
      unit: 'bar',
      status: 'normal',
      threshold: 'Depth-dependent',
      icon: '⬇️'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'var(--accent-red)';
      case 'warning': return 'var(--accent-yellow)';
      case 'normal': return 'var(--accent-green)';
      default: return 'var(--text-medium)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'critical': return 'Critical';
      case 'warning': return 'Warning';
      case 'normal': return 'Normal';
      default: return 'Unknown';
    }
  };

  return (
    <div className="panel-container environmental-metrics">
      <div className="panel-header">
        <h3>Environmental Monitoring</h3>
        {data.speciesProximity && data.speciesProximity !== 'None detected' && (
          <div className="species-alert">
            <span className="alert-icon">⚠️</span>
            <span>Species Alert: {data.speciesProximity}</span>
          </div>
        )}
      </div>

      <div className="metrics-grid">
        {metrics.map(metric => (
          <div key={metric.id} className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">{metric.icon}</span>
              <span className="metric-label">{metric.label}</span>
            </div>
            
            <div className="metric-value">
              <span className="value">{metric.value?.toFixed(1) || 'N/A'}</span>
              <span className="unit">{metric.unit}</span>
            </div>
            
            <div className="metric-status">
              <div 
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(metric.status) }}
              ></div>
              <span className="status-text">{getStatusText(metric.status)}</span>
            </div>
            
            <div className="metric-threshold">
              {metric.threshold}
            </div>
          </div>
        ))}
      </div>

      <div className="water-quality-summary">
        <h4>Water Quality Assessment</h4>
        <div className="quality-indicator">
          <div className={`quality-badge ${data.waterQuality?.toLowerCase()}`}>
            {data.waterQuality || 'Unknown'}
          </div>
          <p className="quality-description">
            {data.waterQuality === 'Excellent' && 'All parameters within optimal ranges'}
            {data.waterQuality === 'Good' && 'Most parameters within acceptable ranges'}
            {data.waterQuality === 'Fair' && 'Some parameters require monitoring'}
            {data.waterQuality === 'Poor' && 'Multiple parameters outside safe ranges'}
          </p>
        </div>
      </div>

      {timeFrame === 'live' && (
        <div className="live-monitoring">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>Live Environmental Monitoring</span>
          </div>
          <p className="monitoring-note">
            Data updates every 30 seconds. ISA compliance thresholds are continuously monitored.
          </p>
        </div>
      )}
    </div>
  );
}

export default EnvironmentalMetrics;

