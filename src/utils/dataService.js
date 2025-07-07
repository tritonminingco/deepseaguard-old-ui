// Data Service for DeepSeaGuard
// Handles data fetching, caching, and real-time updates

import apiClient, { DataTransformer, useWebSocket, useHistoricalData } from './apiClient';

/**
 * AUV Data Service
 * Manages AUV telemetry, positions, and status
 */
export const AUVService = {
  /**
   * Get all AUVs with current status
   * @returns {Promise} - Promise with AUV data
   */
  async getAllAUVs() {
    try {
      const data = await apiClient.fetchData('/auvs');
      return DataTransformer.normalizeAUVData(data);
    } catch (error) {
      console.error('Error fetching AUV data:', error);
      throw error;
    }
  },
  
  /**
   * Get detailed information for a specific AUV
   * @param {string} auvId - AUV identifier
   * @returns {Promise} - Promise with AUV details
   */
  async getAUVDetails(auvId) {
    try {
      const data = await apiClient.fetchData(`/auvs/${auvId}`);
      return DataTransformer.normalizeAUVData([data])[0];
    } catch (error) {
      console.error(`Error fetching AUV details for ${auvId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get historical position data for an AUV
   * @param {string} auvId - AUV identifier
   * @param {string} timeFrame - Time frame for data
   * @returns {Promise} - Promise with position history
   */
  async getAUVPositionHistory(auvId, timeFrame) {
    try {
      const data = await apiClient.fetchData(`/auvs/${auvId}/positions`, {
        params: apiClient.convertTimeFrame(timeFrame)
      });
      return data.positions || [];
    } catch (error) {
      console.error(`Error fetching position history for ${auvId}:`, error);
      throw error;
    }
  },
  
  /**
   * Send command to AUV
   * @param {string} auvId - AUV identifier
   * @param {string} command - Command to send
   * @param {Object} parameters - Command parameters
   * @returns {Promise} - Promise with command result
   */
  async sendCommand(auvId, command, parameters = {}) {
    try {
      return await apiClient.fetchData(`/auvs/${auvId}/command`, {
        method: 'POST',
        body: JSON.stringify({
          command,
          parameters
        })
      });
    } catch (error) {
      console.error(`Error sending command to ${auvId}:`, error);
      throw error;
    }
  },
  
  /**
   * Hook for real-time AUV updates
   * @returns {Object} - AUV data and status
   */
  useRealtimeAUVs() {
    const [auvs, setAUVs] = React.useState([]);
    
    // Set up WebSocket for real-time updates
    const { status, lastMessage } = useWebSocket('auvs', (data) => {
      if (data && Array.isArray(data)) {
        setAUVs(DataTransformer.normalizeAUVData(data));
      }
    });
    
    // Initial data fetch
    React.useEffect(() => {
      const fetchInitialData = async () => {
        try {
          const initialData = await AUVService.getAllAUVs();
          setAUVs(initialData);
        } catch (error) {
          console.error('Error fetching initial AUV data:', error);
        }
      };
      
      fetchInitialData();
    }, []);
    
    return { auvs, connectionStatus: status };
  }
};

/**
 * Environmental Data Service
 * Manages environmental metrics, water quality, and species proximity
 */
export const EnvironmentalService = {
  /**
   * Get current environmental data
   * @returns {Promise} - Promise with environmental data
   */
  async getCurrentData() {
    try {
      const data = await apiClient.fetchData('/environmental');
      return DataTransformer.normalizeEnvironmentalData(data);
    } catch (error) {
      console.error('Error fetching environmental data:', error);
      throw error;
    }
  },
  
  /**
   * Get historical environmental data
   * @param {string} metric - Specific metric to fetch
   * @param {string} timeFrame - Time frame for data
   * @returns {Promise} - Promise with historical data
   */
  async getHistoricalData(metric, timeFrame) {
    try {
      const data = await apiClient.fetchData(`/environmental/${metric}/history`, {
        params: apiClient.convertTimeFrame(timeFrame)
      });
      return data.history || [];
    } catch (error) {
      console.error(`Error fetching ${metric} history:`, error);
      throw error;
    }
  },
  
  /**
   * Get species proximity alerts
   * @returns {Promise} - Promise with species alerts
   */
  async getSpeciesAlerts() {
    try {
      const data = await apiClient.fetchData('/environmental/species');
      return data.alerts || [];
    } catch (error) {
      console.error('Error fetching species alerts:', error);
      throw error;
    }
  },
  
  /**
   * Hook for real-time environmental data
   * @returns {Object} - Environmental data and status
   */
  useRealtimeEnvironmental() {
    const [environmentalData, setEnvironmentalData] = React.useState(null);
    
    // Set up WebSocket for real-time updates
    const { status } = useWebSocket('environmental', (data) => {
      if (data) {
        setEnvironmentalData(DataTransformer.normalizeEnvironmentalData(data));
      }
    });
    
    // Initial data fetch
    React.useEffect(() => {
      const fetchInitialData = async () => {
        try {
          const initialData = await EnvironmentalService.getCurrentData();
          setEnvironmentalData(initialData);
        } catch (error) {
          console.error('Error fetching initial environmental data:', error);
        }
      };
      
      fetchInitialData();
    }, []);
    
    return { environmentalData, connectionStatus: status };
  },
  
  /**
   * Hook for historical environmental data
   * @param {string} metric - Specific metric to fetch
   * @param {string} timeFrame - Time frame for data
   * @returns {Object} - Historical data, loading state, and refresh function
   */
  useHistoricalEnvironmental(metric, timeFrame) {
    return useHistoricalData(`/environmental/${metric}/history`, timeFrame, {
      autoRefresh: true,
      refreshInterval: 60000 // Refresh every minute
    });
  }
};

/**
 * Operational Data Service
 * Manages mission status, efficiency metrics, and battery information
 */
export const OperationalService = {
  /**
   * Get current operational data for an AUV
   * @param {string} auvId - AUV identifier
   * @returns {Promise} - Promise with operational data
   */
  async getCurrentData(auvId) {
    try {
      const data = await apiClient.fetchData(`/operational/${auvId}`);
      return DataTransformer.normalizeOperationalData(data);
    } catch (error) {
      console.error(`Error fetching operational data for ${auvId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get mission details
   * @param {string} missionId - Mission identifier
   * @returns {Promise} - Promise with mission details
   */
  async getMissionDetails(missionId) {
    try {
      return await apiClient.fetchData(`/operational/missions/${missionId}`);
    } catch (error) {
      console.error(`Error fetching mission details for ${missionId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get efficiency metrics history
   * @param {string} auvId - AUV identifier
   * @param {string} timeFrame - Time frame for data
   * @returns {Promise} - Promise with efficiency history
   */
  async getEfficiencyHistory(auvId, timeFrame) {
    try {
      const data = await apiClient.fetchData(`/operational/${auvId}/efficiency`, {
        params: apiClient.convertTimeFrame(timeFrame)
      });
      return data.history || [];
    } catch (error) {
      console.error(`Error fetching efficiency history for ${auvId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get battery history
   * @param {string} auvId - AUV identifier
   * @param {string} timeFrame - Time frame for data
   * @returns {Promise} - Promise with battery history
   */
  async getBatteryHistory(auvId, timeFrame) {
    try {
      const data = await apiClient.fetchData(`/operational/${auvId}/battery`, {
        params: apiClient.convertTimeFrame(timeFrame)
      });
      return data.history || [];
    } catch (error) {
      console.error(`Error fetching battery history for ${auvId}:`, error);
      throw error;
    }
  },
  
  /**
   * Hook for real-time operational data
   * @param {string} auvId - AUV identifier
   * @returns {Object} - Operational data and status
   */
  useRealtimeOperational(auvId) {
    const [operationalData, setOperationalData] = React.useState(null);
    
    // Set up WebSocket for real-time updates
    const { status } = useWebSocket(`operational/${auvId}`, (data) => {
      if (data) {
        setOperationalData(DataTransformer.normalizeOperationalData(data));
      }
    });
    
    // Initial data fetch
    React.useEffect(() => {
      const fetchInitialData = async () => {
        try {
          const initialData = await OperationalService.getCurrentData(auvId);
          setOperationalData(initialData);
        } catch (error) {
          console.error(`Error fetching initial operational data for ${auvId}:`, error);
        }
      };
      
      if (auvId) {
        fetchInitialData();
      }
    }, [auvId]);
    
    return { operationalData, connectionStatus: status };
  }
};

/**
 * Compliance Data Service
 * Manages ISA standards compliance, sensitive zones, and reporting
 */
export const ComplianceService = {
  /**
   * Get current compliance status
   * @returns {Promise} - Promise with compliance data
   */
  async getCurrentStatus() {
    try {
      const data = await apiClient.fetchData('/compliance');
      return DataTransformer.normalizeComplianceData(data);
    } catch (error) {
      console.error('Error fetching compliance status:', error);
      throw error;
    }
  },
  
  /**
   * Get compliance history
   * @param {string} standardId - Standard identifier
   * @param {string} timeFrame - Time frame for data
   * @returns {Promise} - Promise with compliance history
   */
  async getComplianceHistory(standardId, timeFrame) {
    try {
      const data = await apiClient.fetchData(`/compliance/${standardId}/history`, {
        params: apiClient.convertTimeFrame(timeFrame)
      });
      return data.history || [];
    } catch (error) {
      console.error(`Error fetching compliance history for ${standardId}:`, error);
      throw error;
    }
  },
  
  /**
   * Generate ISA compliance report
   * @param {string} reportType - Report type (monthly, quarterly, annual)
   * @param {string} format - Report format (json, pdf, xml)
   * @param {Object} parameters - Report parameters
   * @returns {Promise} - Promise with report URL or data
   */
  async generateReport(reportType, format, parameters = {}) {
    try {
      return await apiClient.fetchData('/compliance/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          reportType,
          format,
          parameters
        })
      });
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  },
  
  /**
   * Get list of available reports
   * @returns {Promise} - Promise with report list
   */
  async getReportList() {
    try {
      const data = await apiClient.fetchData('/compliance/reports');
      return data.reports || [];
    } catch (error) {
      console.error('Error fetching report list:', error);
      throw error;
    }
  },
  
  /**
   * Hook for real-time compliance data
   * @returns {Object} - Compliance data and status
   */
  useRealtimeCompliance() {
    const [complianceData, setComplianceData] = React.useState(null);
    
    // Set up WebSocket for real-time updates
    const { status } = useWebSocket('compliance', (data) => {
      if (data) {
        setComplianceData(DataTransformer.normalizeComplianceData(data));
      }
    });
    
    // Initial data fetch
    React.useEffect(() => {
      const fetchInitialData = async () => {
        try {
          const initialData = await ComplianceService.getCurrentStatus();
          setComplianceData(initialData);
        } catch (error) {
          console.error('Error fetching initial compliance data:', error);
        }
      };
      
      fetchInitialData();
    }, []);
    
    return { complianceData, connectionStatus: status };
  }
};

/**
 * Alert Service
 * Manages system alerts, notifications, and alert history
 */
export const AlertService = {
  /**
   * Get current active alerts
   * @returns {Promise} - Promise with active alerts
   */
  async getActiveAlerts() {
    try {
      const data = await apiClient.fetchData('/alerts/active');
      return DataTransformer.normalizeAlerts(data);
    } catch (error) {
      console.error('Error fetching active alerts:', error);
      throw error;
    }
  },
  
  /**
   * Get alert history
   * @param {string} timeFrame - Time frame for data
   * @returns {Promise} - Promise with alert history
   */
  async getAlertHistory(timeFrame) {
    try {
      const data = await apiClient.fetchData('/alerts/history', {
        params: apiClient.convertTimeFrame(timeFrame)
      });
      return DataTransformer.normalizeAlerts(data);
    } catch (error) {
      console.error('Error fetching alert history:', error);
      throw error;
    }
  },
  
  /**
   * Acknowledge alert
   * @param {string} alertId - Alert identifier
   * @returns {Promise} - Promise with acknowledgment result
   */
  async acknowledgeAlert(alertId) {
    try {
      return await apiClient.fetchData(`/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
    } catch (error) {
      console.error(`Error acknowledging alert ${alertId}:`, error);
      throw error;
    }
  },
  
  /**
   * Resolve alert
   * @param {string} alertId - Alert identifier
   * @param {string} resolution - Resolution notes
   * @returns {Promise} - Promise with resolution result
   */
  async resolveAlert(alertId, resolution) {
    try {
      return await apiClient.fetchData(`/alerts/${alertId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution })
      });
    } catch (error) {
      console.error(`Error resolving alert ${alertId}:`, error);
      throw error;
    }
  },
  
  /**
   * Hook for real-time alerts
   * @returns {Object} - Alerts, status, and alert management functions
   */
  useRealtimeAlerts() {
    const [alerts, setAlerts] = React.useState([]);
    
    // Set up WebSocket for real-time updates
    const { status } = useWebSocket('alerts', (data) => {
      if (data && Array.isArray(data)) {
        setAlerts(DataTransformer.normalizeAlerts(data));
      }
    });
    
    // Initial data fetch
    React.useEffect(() => {
      const fetchInitialData = async () => {
        try {
          const initialData = await AlertService.getActiveAlerts();
          setAlerts(initialData);
        } catch (error) {
          console.error('Error fetching initial alerts:', error);
        }
      };
      
      fetchInitialData();
    }, []);
    
    // Alert management functions
    const acknowledgeAlert = async (alertId) => {
      try {
        await AlertService.acknowledgeAlert(alertId);
        setAlerts(alerts.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        ));
        return true;
      } catch (error) {
        console.error(`Error acknowledging alert ${alertId}:`, error);
        return false;
      }
    };
    
    const resolveAlert = async (alertId, resolution) => {
      try {
        await AlertService.resolveAlert(alertId, resolution);
        setAlerts(alerts.map(alert => 
          alert.id === alertId ? { ...alert, resolved: true } : alert
        ));
        return true;
      } catch (error) {
        console.error(`Error resolving alert ${alertId}:`, error);
        return false;
      }
    };
    
    return { 
      alerts, 
      connectionStatus: status,
      acknowledgeAlert,
      resolveAlert
    };
  }
};

/**
 * Map Data Service
 * Manages bathymetric data, zone boundaries, and map overlays
 */
export const MapService = {
  /**
   * Get bathymetric data for a region
   * @param {Object} bounds - Map bounds
   * @returns {Promise} - Promise with bathymetric data
   */
  async getBathymetricData(bounds) {
    try {
      return await apiClient.fetchData('/map/bathymetry', {
        params: bounds
      });
    } catch (error) {
      console.error('Error fetching bathymetric data:', error);
      throw error;
    }
  },
  
  /**
   * Get ISA zone boundaries
   * @returns {Promise} - Promise with zone boundaries
   */
  async getZoneBoundaries() {
    try {
      return await apiClient.fetchData('/map/zones');
    } catch (error) {
      console.error('Error fetching zone boundaries:', error);
      throw error;
    }
  },
  
  /**
   * Get sensitive ecological areas
   * @returns {Promise} - Promise with ecological areas
   */
  async getSensitiveAreas() {
    try {
      return await apiClient.fetchData('/map/sensitive-areas');
    } catch (error) {
      console.error('Error fetching sensitive areas:', error);
      throw error;
    }
  },
  
  /**
   * Get current sediment plume data
   * @returns {Promise} - Promise with plume data
   */
  async getPlumeData() {
    try {
      return await apiClient.fetchData('/map/plumes');
    } catch (error) {
      console.error('Error fetching plume data:', error);
      throw error;
    }
  }
};

// Export all services
export default {
  AUVService,
  EnvironmentalService,
  OperationalService,
  ComplianceService,
  AlertService,
  MapService
};
