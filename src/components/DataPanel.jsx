import React, { useState, useEffect } from 'react';
import EnvironmentalMetrics from './panels/EnvironmentalMetrics';
import OperationalData from './panels/OperationalData';
import ComplianceStatus from './panels/ComplianceStatus';
import '../styles/DataPanel.css';

function DataPanel({ selectedAUV, timeFrame, alerts = [] }) {
  const [activeTab, setActiveTab] = useState('environmental');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch real data from backend API
  useEffect(() => {
    setLoading(true);
    async function fetchData() {
      try {
        const [environmental, operational, compliance] = await Promise.all([
          // Replace with your actual API endpoints
          window.apiClient.fetchData(`/telemetry/environmental?auv=${selectedAUV}&timeFrame=${timeFrame}`),
          window.apiClient.fetchData(`/telemetry/operational?auv=${selectedAUV}&timeFrame=${timeFrame}`),
          window.apiClient.fetchData(`/compliance/status?auv=${selectedAUV}&timeFrame=${timeFrame}`)
        ]);
        setData({ environmental, operational, compliance });
      } catch (err) {
        setData({});
      }
      setLoading(false);
    }
    fetchData();
  }, [selectedAUV, timeFrame]);

  const tabs = [
    { id: 'environmental', label: 'Environmental', icon: '🌊' },
    { id: 'operational', label: 'Operational', icon: '⚙️' },
    { id: 'compliance', label: 'Compliance', icon: '📋' }
  ];

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading {activeTab} data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'environmental':
        return (
          <EnvironmentalMetrics 
            data={data.environmental} 
            selectedAUV={selectedAUV}
            timeFrame={timeFrame}
          />
        );
      case 'operational':
        return (
          <OperationalData 
            data={data.operational} 
            selectedAUV={selectedAUV}
            timeFrame={timeFrame}
          />
        );
      case 'compliance':
        return (
          <ComplianceStatus 
            data={data.compliance} 
            selectedAUV={selectedAUV} 
            timeFrame={timeFrame}
            environmentalData={data.environmental}
            operationalData={data.operational}
            alerts={alerts}
          />
        );
      default:
        return <div>Select a tab to view data</div>;
    }
  };

  return (
    <div className="data-panel">
      <div className="data-panel-header">
        <h2>Mission Data</h2>
        {selectedAUV && (
          <div className="selected-auv">
            <span className="auv-indicator">📍</span>
            <span>{selectedAUV}</span>
          </div>
        )}
      </div>

      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tab-content">
        {renderTabContent()}
      </div>

      <div className="data-panel-footer">
        <div className="data-info">
          <div className="info-item">
            <span className="info-label">Time Frame:</span>
            <span className="info-value">{timeFrame === 'live' ? 'Live Data' : timeFrame}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Last Update:</span>
            <span className="info-value">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataPanel;

