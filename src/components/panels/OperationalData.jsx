import React from 'react';
import '../../styles/panels/OperationalData.css';

function OperationalData({ data, selectedAUV, timeFrame }) {
  if (!data) {
    return (
      <div className="panel-container">
        <div className="no-data">
          <p>No operational data available</p>
          <p className="help-text">Select an AUV to view operational metrics</p>
        </div>
      </div>
    );
  }

  const getBatteryStatus = (level) => {
    if (level > 60) return 'good';
    if (level > 30) return 'warning';
    return 'critical';
  };

  const getEfficiencyStatus = (efficiency) => {
    if (efficiency > 80) return 'excellent';
    if (efficiency > 60) return 'good';
    if (efficiency > 40) return 'fair';
    return 'poor';
  };

  const formatDuration = (duration) => {
    return duration || 'N/A';
  };

  const operationalMetrics = [
    {
      id: 'battery',
      label: 'Battery Level',
      value: data.batteryLevel,
      unit: '%',
      status: getBatteryStatus(data.batteryLevel),
      icon: '🔋',
      showProgress: true
    },
    {
      id: 'depth',
      label: 'Current Depth',
      value: data.depth,
      unit: 'm',
      status: 'normal',
      icon: '📏'
    },
    {
      id: 'speed',
      label: 'Speed',
      value: data.speed,
      unit: 'm/s',
      status: data.speed > 3 ? 'warning' : 'normal',
      icon: '⚡'
    },
    {
      id: 'heading',
      label: 'Heading',
      value: data.heading,
      unit: '°',
      status: 'normal',
      icon: '🧭'
    }
  ];

  const missionMetrics = [
    {
      id: 'progress',
      label: 'Mission Progress',
      value: data.missionProgress,
      unit: '%',
      status: 'normal',
      icon: '📊',
      showProgress: true
    },
    {
      id: 'nodules',
      label: 'Nodules Collected',
      value: data.nodulesCollected,
      unit: '',
      status: 'normal',
      icon: '⚫'
    },
    {
      id: 'rate',
      label: 'Collection Rate',
      value: data.collectionRate,
      unit: '/min',
      status: data.collectionRate > 5 ? 'excellent' : data.collectionRate > 3 ? 'good' : 'fair',
      icon: '📈'
    },
    {
      id: 'efficiency',
      label: 'Efficiency',
      value: data.efficiency,
      unit: '%',
      status: getEfficiencyStatus(data.efficiency),
      icon: '⚙️',
      showProgress: true
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'var(--accent-cyan)';
      case 'good': return 'var(--accent-green)';
      case 'fair': return 'var(--accent-yellow)';
      case 'warning': return 'var(--accent-yellow)';
      case 'critical': return 'var(--accent-red)';
      case 'poor': return 'var(--accent-red)';
      default: return 'var(--text-medium)';
    }
  };

  return (
    <div className="panel-container operational-data">
      <div className="panel-header">
        <h3>Operational Status</h3>
        <div className="auv-status">
          <span className="status-dot active"></span>
          <span>Active Mission</span>
        </div>
      </div>

      <div className="mission-info">
        <h4>Mission Details</h4>
        <div className="mission-details">
          <div className="detail-item">
            <span className="detail-label">Mission ID:</span>
            <span className="detail-value">{data.missionId}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Duration:</span>
            <span className="detail-value">{formatDuration(data.missionDuration)}</span>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h4>Vehicle Status</h4>
        <div className="metrics-grid">
          {operationalMetrics.map(metric => (
            <div key={metric.id} className="metric-card">
              <div className="metric-header">
                <span className="metric-icon">{metric.icon}</span>
                <span className="metric-label">{metric.label}</span>
              </div>
              
              <div className="metric-value">
                <span className="value">{metric.value || 'N/A'}</span>
                <span className="unit">{metric.unit}</span>
              </div>
              
              {metric.showProgress && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${metric.value}%`,
                      backgroundColor: getStatusColor(metric.status)
                    }}
                  ></div>
                </div>
              )}
              
              <div 
                className="status-indicator"
                style={{ color: getStatusColor(metric.status) }}
              >
                {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="metrics-section">
        <h4>Mission Performance</h4>
        <div className="metrics-grid">
          {missionMetrics.map(metric => (
            <div key={metric.id} className="metric-card">
              <div className="metric-header">
                <span className="metric-icon">{metric.icon}</span>
                <span className="metric-label">{metric.label}</span>
              </div>
              
              <div className="metric-value">
                <span className="value">{metric.value || 'N/A'}</span>
                <span className="unit">{metric.unit}</span>
              </div>
              
              {metric.showProgress && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${metric.value}%`,
                      backgroundColor: getStatusColor(metric.status)
                    }}
                  ></div>
                </div>
              )}
              
              <div 
                className="status-indicator"
                style={{ color: getStatusColor(metric.status) }}
              >
                {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.batteryLevel < 40 && (
        <div className="battery-warning">
          <div className="warning-header">
            <span className="warning-icon">⚠️</span>
            <span>Battery Warning</span>
          </div>
          <p>
            Battery level is {data.batteryLevel < 20 ? 'critically' : ''} low. 
            {data.batteryLevel < 20 ? ' Immediate return to surface recommended.' : ' Consider returning to charging station.'}
          </p>
        </div>
      )}

      {timeFrame === 'live' && (
        <div className="live-monitoring">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>Live Operational Monitoring</span>
          </div>
          <p className="monitoring-note">
            Telemetry updates every 5 seconds. Critical alerts are sent immediately.
          </p>
        </div>
      )}
    </div>
  );
}

export default OperationalData;

