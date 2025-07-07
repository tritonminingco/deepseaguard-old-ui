import React, { useState, useEffect } from 'react';
import EnvironmentalMetrics from './panels/EnvironmentalMetrics';
import OperationalData from './panels/OperationalData';
import ComplianceStatus from './panels/ComplianceStatus';
import '../styles/DataPanel.css';

function DataPanel({ selectedAUV, timeFrame, alerts = [] }) {
  const [activeTab, setActiveTab] = useState('environmental');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  // Mock data based on selected AUV and time frame
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      const mockData = {
        environmental: {
          temperature: selectedAUV === 'AUV-001' ? 4.2 : selectedAUV === 'AUV-002' ? 4.5 : 4.1,
          salinity: selectedAUV === 'AUV-001' ? 34.8 : selectedAUV === 'AUV-002' ? 34.6 : 34.9,
          dissolvedOxygen: selectedAUV === 'AUV-001' ? 6.5 : selectedAUV === 'AUV-002' ? 6.2 : 6.8,
          pH: selectedAUV === 'AUV-001' ? 8.1 : selectedAUV === 'AUV-002' ? 8.0 : 8.2,
          turbidity: selectedAUV === 'AUV-001' ? 2.3 : selectedAUV === 'AUV-002' ? 3.1 : 1.9,
          pressure: selectedAUV === 'AUV-001' ? 250.7 : selectedAUV === 'AUV-002' ? 245.2 : 258.3,
          waterQuality: selectedAUV === 'AUV-001' ? 'Good' : selectedAUV === 'AUV-002' ? 'Fair' : 'Excellent',
          speciesProximity: selectedAUV === 'AUV-003' ? 'Benthic Octopod - 120m' : 'None detected'
        },
        operational: {
          batteryLevel: selectedAUV === 'AUV-001' ? 85 : selectedAUV === 'AUV-002' ? 32 : 67,
          depth: selectedAUV === 'AUV-001' ? 2450 : selectedAUV === 'AUV-002' ? 2380 : 2520,
          speed: selectedAUV === 'AUV-001' ? 2.3 : selectedAUV === 'AUV-002' ? 1.8 : 2.1,
          heading: selectedAUV === 'AUV-001' ? 142 : selectedAUV === 'AUV-002' ? 89 : 215,
          missionId: selectedAUV === 'AUV-001' ? 'MISSION-001' : selectedAUV === 'AUV-002' ? 'MISSION-002' : 'MISSION-003',
          missionDuration: selectedAUV === 'AUV-001' ? '4h 23m' : selectedAUV === 'AUV-002' ? '6h 12m' : '3h 45m',
          missionProgress: selectedAUV === 'AUV-001' ? 67 : selectedAUV === 'AUV-002' ? 45 : 78,
          nodulesCollected: selectedAUV === 'AUV-001' ? 1247 : selectedAUV === 'AUV-002' ? 892 : 1456,
          collectionRate: selectedAUV === 'AUV-001' ? 4.8 : selectedAUV === 'AUV-002' ? 2.4 : 6.5,
          efficiency: selectedAUV === 'AUV-001' ? 87 : selectedAUV === 'AUV-002' ? 65 : 92
        },
        compliance: {
          isaCompliance: 'Compliant',
          lastReport: '2024-06-24 14:30:00',
          violations: selectedAUV === 'AUV-002' ? 1 : 0,
          status: selectedAUV === 'AUV-002' ? 'Warning' : 'Active',
          sedimentThreshold: selectedAUV === 'AUV-002' ? 23.7 : 18.5,
          sensitiveZoneTime: selectedAUV === 'AUV-003' ? '2h 15m' : '0m',
          reportingStatus: 'Up to date'
        }
      };
      
      setData(mockData);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
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

