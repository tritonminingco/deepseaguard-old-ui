import React, { useState } from 'react';
import '../../styles/panels/ComplianceStatus.css';
import ISAReportGenerator from '../../utils/isaReportGenerator';

function ComplianceStatus({ data, selectedAUV, timeFrame, environmentalData, operationalData, alerts }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!data) {
    return (
      <div className="panel-container">
        <div className="no-data">
          <p>No compliance data available</p>
          <p className="help-text">Select an AUV to view compliance status</p>
        </div>
      </div>
    );
  }

  const complianceRules = [
    {
      id: 'ISA-ENV-1',
      name: 'Sediment Discharge',
      currentValue: data.sedimentThreshold || 18.5,
      threshold: 25,
      unit: 'mg/L',
      status: (data.sedimentThreshold || 18.5) > 25 ? 'violation' : 'compliant',
      description: 'Maximum sediment discharge per ISA regulations'
    },
    {
      id: 'ISA-ENV-2',
      name: 'Sensitive Zone Time',
      currentValue: data.sensitiveZoneTime === '0m' ? 0 : 135,
      threshold: 120,
      unit: 'minutes',
      status: data.sensitiveZoneTime !== '0m' && data.sensitiveZoneTime !== '0' ? 'violation' : 'compliant',
      description: 'Maximum time in sensitive ecological zones'
    },
    {
      id: 'ISA-OPS-1',
      name: 'Operational Depth',
      currentValue: 2450,
      threshold: 3000,
      unit: 'm',
      status: 'compliant',
      description: 'Maximum operational depth for mining activities'
    },
    {
      id: 'ISA-REP-1',
      name: 'Reporting Frequency',
      currentValue: 24,
      threshold: 24,
      unit: 'hours',
      status: 'compliant',
      description: 'Mandatory reporting interval'
    }
  ];

  const getComplianceColor = (status) => {
    switch (status) {
      case 'compliant': return 'var(--accent-green)';
      case 'violation': return 'var(--accent-red)';
      case 'warning': return 'var(--accent-yellow)';
      default: return 'var(--text-medium)';
    }
  };

  const getComplianceIcon = (status) => {
    switch (status) {
      case 'compliant': return '✅';
      case 'violation': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const handleExportReport = async (format) => {
    setIsGenerating(true);
    
    try {
      const reportGenerator = new ISAReportGenerator();
      
      const reportData = {
        selectedAUV: selectedAUV || 'AUV-001',
        timeFrame: timeFrame || 'live',
        environmentalData: environmentalData || {
          temperature: 4.2,
          salinity: 34.5,
          dissolvedOxygen: 7.2,
          pH: 8.1,
          turbidity: 2.1,
          sedimentThreshold: 18.5,
          speciesProximity: 'None detected'
        },
        operationalData: operationalData || {
          batteryLevel: 75,
          depth: 2450,
          speed: 1.2,
          missionProgress: 68,
          collectionRate: 4.2,
          efficiency: 87
        },
        complianceData: {
          complianceRules: complianceRules
        },
        alerts: alerts || [],
        timestamp: new Date().toISOString()
      };

      const filename = `ISA-Compliance-Report-${selectedAUV || 'AUV-001'}-${reportType}-${new Date().toISOString().split('T')[0]}`;

      if (format === 'pdf') {
        reportGenerator.downloadPDF(reportData, `${filename}.pdf`);
      } else if (format === 'csv') {
        reportGenerator.downloadCSV(reportData, `${filename}.csv`);
      }

      // Show success message
      setTimeout(() => {
        setIsGenerating(false);
        setShowReportModal(false);
        
        // Show success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: var(--accent-green);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          z-index: 10000;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = `✅ ISA ${format.toUpperCase()} report downloaded successfully!`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }, 1000);

    } catch (error) {
      console.error('Error generating report:', error);
      setIsGenerating(false);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-red);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        z-index: 10000;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      notification.textContent = `❌ Error generating report. Please try again.`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  };

  const overallCompliance = complianceRules.every(rule => rule.status === 'compliant');
  const violationCount = complianceRules.filter(rule => rule.status === 'violation').length;

  return (
    <div className="panel-container compliance-status">
      <div className="panel-header">
        <h3>ISA Compliance Status</h3>
        <div className={`overall-status ${overallCompliance ? 'compliant' : 'violation'}`}>
          <span className="status-icon">
            {overallCompliance ? '✅' : '❌'}
          </span>
          <span>{overallCompliance ? 'Compliant' : `${violationCount} Violation${violationCount > 1 ? 's' : ''}`}</span>
        </div>
      </div>

      <div className="compliance-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-value">{complianceRules.filter(r => r.status === 'compliant').length}</span>
            <span className="stat-label">Compliant</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{violationCount}</span>
            <span className="stat-label">Violations</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{complianceRules.length}</span>
            <span className="stat-label">Total Rules</span>
          </div>
        </div>
      </div>

      <div className="compliance-rules">
        <h4>Compliance Rules</h4>
        {complianceRules.map(rule => (
          <div key={rule.id} className={`rule-card ${rule.status}`}>
            <div className="rule-header">
              <div className="rule-info">
                <span className="rule-id">{rule.id}</span>
                <span className="rule-name">{rule.name}</span>
              </div>
              <div className="rule-status">
                <span className="status-icon">{getComplianceIcon(rule.status)}</span>
                <span className="status-text">{rule.status.toUpperCase()}</span>
              </div>
            </div>
            
            <div className="rule-values">
              <div className="value-item">
                <span className="value-label">Current:</span>
                <span className="value-number">{rule.currentValue} {rule.unit}</span>
              </div>
              <div className="value-item">
                <span className="value-label">Threshold:</span>
                <span className="value-number">{rule.threshold} {rule.unit}</span>
              </div>
            </div>
            
            <div className="rule-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${Math.min((rule.currentValue / rule.threshold) * 100, 100)}%`,
                    backgroundColor: getComplianceColor(rule.status)
                  }}
                ></div>
              </div>
              <span className="progress-percentage">
                {((rule.currentValue / rule.threshold) * 100).toFixed(1)}%
              </span>
            </div>
            
            <p className="rule-description">{rule.description}</p>
          </div>
        ))}
      </div>

      <div className="reporting-section">
        <h4>ISA Reporting</h4>
        <div className="reporting-info">
          <div className="info-item">
            <span className="info-label">Last Report:</span>
            <span className="info-value">{data.lastReport}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Reporting Status:</span>
            <span className="info-value">{data.reportingStatus}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Next Report Due:</span>
            <span className="info-value">
              {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <button 
          className="btn btn-primary generate-report-btn"
          onClick={handleGenerateReport}
        >
          📋 Generate ISA Report
        </button>
      </div>

      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Generate ISA Compliance Report</h3>
              <button 
                className="modal-close"
                onClick={() => setShowReportModal(false)}
                disabled={isGenerating}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="report-options">
                <div className="option-group">
                  <label>Report Type:</label>
                  <select 
                    value={reportType} 
                    onChange={(e) => setReportType(e.target.value)}
                    disabled={isGenerating}
                  >
                    <option value="daily">Daily Report</option>
                    <option value="weekly">Weekly Summary</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="incident">Incident Report</option>
                  </select>
                </div>
                
                <div className="report-preview">
                  <h4>Report Preview</h4>
                  <p><strong>AUV:</strong> {selectedAUV || 'AUV-001'}</p>
                  <p><strong>Time Period:</strong> {timeFrame || 'Live Data'}</p>
                  <p><strong>Compliance Status:</strong> {overallCompliance ? 'Compliant' : `${violationCount} Violations`}</p>
                  <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
                  <p><strong>Format:</strong> ISA ISBA/21/LTC/15 Compliant</p>
                </div>

                {isGenerating && (
                  <div className="generating-status">
                    <div className="loading-spinner"></div>
                    <p>Generating ISA-compliant report...</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowReportModal(false)}
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleExportReport('csv')}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : '📊 Export CSV'}
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleExportReport('pdf')}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : '📄 Export PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {timeFrame === 'live' && (
        <div className="live-monitoring">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>Live Compliance Monitoring</span>
          </div>
          <p className="monitoring-note">
            Compliance status is monitored continuously. Violations trigger immediate alerts.
          </p>
        </div>
      )}
    </div>
  );
}

export default ComplianceStatus;