// Mock data for DeepSeaGuard dashboard development

/**
 * Generate mock AUV data
 * @param {number} count - Number of AUVs to generate
 * @returns {Array} - Array of AUV objects
 */
export function generateMockAUVs(count = 5) {
  const auvs = [];
  const statusOptions = ['active', 'warning', 'critical', 'inactive'];
  
  for (let i = 0; i < count; i++) {
    const id = `AUV-${(i + 1).toString().padStart(3, '0')}`;
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const batteryLevel = Math.floor(Math.random() * 100);
    
    // Generate position around a central point with some variation
    const centerLat = -14.65;
    const centerLng = -125.45;
    const latVariation = (Math.random() - 0.5) * 0.2;
    const lngVariation = (Math.random() - 0.5) * 0.2;
    
    auvs.push({
      id,
      name: `DeepGuard ${i + 1}`,
      position: [centerLat + latVariation, -3000 - Math.random() * 500, centerLng + lngVariation],
      rotation: [0, Math.random() * Math.PI * 2, 0],
      status,
      batteryLevel,
      depth: 3000 + Math.floor(Math.random() * 500),
      mission: `Mission-${Math.floor(Math.random() * 10) + 1}`,
      lastUpdated: new Date().toISOString()
    });
  }
  
  return auvs;
}

/**
 * Generate mock environmental data
 * @returns {Object} - Environmental metrics data
 */
export function generateMockEnvironmentalData() {
  // Generate sediment disturbance data
  const sedimentCurrent = Math.random() * 30;
  const sedimentStatus = sedimentCurrent > 25 ? 'critical' : 
                         sedimentCurrent > 15 ? 'warning' : 'normal';
  
  // Generate water quality data
  const turbidity = Math.random() * 15;
  const turbidityStatus = turbidity > 10 ? 'critical' : 
                          turbidity > 5 ? 'warning' : 'normal';
  
  const pH = 7.5 + (Math.random() - 0.5) * 1.5;
  const pHStatus = pH < 7.0 || pH > 8.5 ? 'warning' : 'normal';
  
  const temperature = 4 + Math.random() * 3;
  const tempStatus = temperature > 6 ? 'warning' : 'normal';
  
  const oxygen = 5 + Math.random() * 3;
  const oxygenStatus = oxygen < 6 ? 'warning' : 'normal';
  
  // Generate species proximity data
  const speciesCount = Math.floor(Math.random() * 5);
  const speciesStatus = speciesCount > 3 ? 'warning' : 'normal';
  
  // Generate historical data
  const now = new Date();
  const history = [];
  
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString();
    
    history.push({
      timestamp,
      sediment: Math.random() * 30,
      turbidity: Math.random() * 15,
      pH: 7.5 + (Math.random() - 0.5) * 1.5,
      temperature: 4 + Math.random() * 3,
      oxygen: 5 + Math.random() * 3,
      speciesCount: Math.floor(Math.random() * 5)
    });
  }
  
  return {
    sedimentDisturbance: {
      current: sedimentCurrent,
      threshold: 25,
      unit: 'mg/L',
      status: sedimentStatus,
      history: history.map(h => ({ timestamp: h.timestamp, value: h.sediment }))
    },
    waterQuality: {
      turbidity: {
        current: turbidity,
        threshold: 10,
        unit: 'NTU',
        status: turbidityStatus,
        history: history.map(h => ({ timestamp: h.timestamp, value: h.turbidity }))
      },
      pH: {
        current: pH,
        threshold: { min: 7.0, max: 8.5 },
        unit: 'pH',
        status: pHStatus,
        history: history.map(h => ({ timestamp: h.timestamp, value: h.pH }))
      },
      temperature: {
        current: temperature,
        threshold: 6,
        unit: '°C',
        status: tempStatus,
        history: history.map(h => ({ timestamp: h.timestamp, value: h.temperature }))
      },
      dissolvedOxygen: {
        current: oxygen,
        threshold: 6,
        unit: 'mg/L',
        status: oxygenStatus,
        history: history.map(h => ({ timestamp: h.timestamp, value: h.oxygen }))
      }
    },
    speciesProximity: {
      count: speciesCount,
      threshold: 3,
      status: speciesStatus,
      species: Array(speciesCount).fill(0).map((_, i) => ({
        id: `SP-${i+1}`,
        name: ['Dumbo Octopus', 'Anglerfish', 'Vampire Squid', 'Sea Cucumber', 'Deep-sea Coral'][i % 5],
        distance: Math.floor(Math.random() * 500) + 100,
        direction: ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'][Math.floor(Math.random() * 8)]
      })),
      history: history.map(h => ({ timestamp: h.timestamp, value: h.speciesCount }))
    }
  };
}

/**
 * Generate mock operational data
 * @returns {Object} - Operational metrics data
 */
export function generateMockOperationalData() {
  // Generate battery data
  const batteryCurrent = Math.floor(Math.random() * 100);
  const batteryStatus = batteryCurrent < 20 ? 'critical' : 
                        batteryCurrent < 40 ? 'warning' : 'normal';
  
  // Generate efficiency data
  const efficiencyCurrent = Math.floor(Math.random() * 100);
  const efficiencyStatus = efficiencyCurrent < 50 ? 'warning' : 'normal';
  
  // Generate mission data
  const missionCurrent = Math.floor(Math.random() * 100);
  const missionStatus = 'normal';
  
  // Generate consumption data
  const consumptionCurrent = 10 + Math.random() * 20;
  const consumptionStatus = consumptionCurrent > 25 ? 'warning' : 'normal';
  
  // Generate historical data
  const now = new Date();
  const history = [];
  
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString();
    
    history.push({
      timestamp,
      battery: Math.floor(Math.random() * 100),
      efficiency: Math.floor(Math.random() * 100),
      mission: Math.min(100, i * 4 + Math.floor(Math.random() * 10)),
      consumption: 10 + Math.random() * 20
    });
  }
  
  return {
    battery: {
      current: batteryCurrent,
      threshold: 20,
      unit: '%',
      status: batteryStatus,
      history: history.map(h => ({ timestamp: h.timestamp, value: h.battery }))
    },
    efficiency: {
      current: efficiencyCurrent,
      threshold: 50,
      unit: 'nodules/hour',
      status: efficiencyStatus,
      history: history.map(h => ({ timestamp: h.timestamp, value: h.efficiency }))
    },
    mission: {
      current: missionCurrent,
      threshold: null,
      unit: '%',
      status: missionStatus,
      history: history.map(h => ({ timestamp: h.timestamp, value: h.mission }))
    },
    consumption: {
      current: consumptionCurrent,
      threshold: 25,
      unit: 'kW',
      status: consumptionStatus,
      history: history.map(h => ({ timestamp: h.timestamp, value: h.consumption }))
    },
    logs: [
      { timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), level: 'info', message: 'Collection rate stable at 65 nodules/hour' },
      { timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), level: 'warning', message: 'Battery discharge rate increased' },
      { timestamp: new Date(now.getTime() - 35 * 60 * 1000).toISOString(), level: 'info', message: 'Navigation adjusted to avoid sensitive zone' },
      { timestamp: new Date(now.getTime() - 55 * 60 * 1000).toISOString(), level: 'error', message: 'Communication delay detected' },
      { timestamp: new Date(now.getTime() - 85 * 60 * 1000).toISOString(), level: 'info', message: 'Mission waypoint reached' }
    ]
  };
}

/**
 * Generate mock compliance data
 * @returns {Object} - Compliance status data
 */
export function generateMockComplianceData() {
  const standards = [
    {
      id: 'ISA-ENV-001',
      description: 'Sediment plume dispersion limit',
      status: Math.random() > 0.8 ? 'violation' : 'compliant',
      value: Math.floor(Math.random() * 30),
      threshold: 25,
      unit: 'mg/L',
      category: 'environmental'
    },
    {
      id: 'ISA-ENV-002',
      description: 'Water quality alteration',
      status: Math.random() > 0.9 ? 'violation' : 'compliant',
      value: Math.floor(Math.random() * 15),
      threshold: 10,
      unit: 'NTU',
      category: 'environmental'
    },
    {
      id: 'ISA-ENV-003',
      description: 'Noise level limit',
      status: 'compliant',
      value: Math.floor(Math.random() * 120),
      threshold: 120,
      unit: 'dB',
      category: 'environmental'
    },
    {
      id: 'ISA-OPS-001',
      description: 'Sensitive zone proximity',
      status: Math.random() > 0.85 ? 'violation' : 'compliant',
      value: Math.floor(Math.random() * 1000),
      threshold: 500,
      unit: 'm',
      category: 'operational'
    },
    {
      id: 'ISA-OPS-002',
      description: 'Collection rate limit',
      status: 'compliant',
      value: Math.floor(Math.random() * 100),
      threshold: 100,
      unit: 'nodules/hour',
      category: 'operational'
    },
    {
      id: 'ISA-REP-001',
      description: 'Daily reporting requirement',
      status: 'compliant',
      value: 'Submitted',
      threshold: 'Required',
      unit: '',
      category: 'reporting'
    },
    {
      id: 'ISA-REP-002',
      description: 'Environmental impact assessment',
      status: 'compliant',
      value: 'Completed',
      threshold: 'Required',
      unit: '',
      category: 'reporting'
    }
  ];
  
  // Count violations
  const violations = standards.filter(s => s.status === 'violation').length;
  const status = violations > 0 ? 'violation' : 'compliant';
  
  // Generate reporting timeline
  const now = new Date();
  const timeline = [
    {
      id: 'REP-001',
      title: 'Daily Operations Report',
      due: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString(),
      status: 'pending',
      type: 'daily'
    },
    {
      id: 'REP-002',
      title: 'Environmental Monitoring Report',
      due: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString(),
      status: 'upcoming',
      type: 'weekly'
    },
    {
      id: 'REP-003',
      title: 'Quarterly Compliance Assessment',
      due: new Date(now.getFullYear(), Math.floor((now.getMonth() + 3) / 3) * 3, 15).toISOString(),
      status: 'upcoming',
      type: 'quarterly'
    },
    {
      id: 'REP-004',
      title: 'Species Encounter Report',
      due: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      type: 'event-triggered',
      completedDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  return {
    overallStatus: status,
    violationCount: violations,
    isaStandards: standards,
    reportingTimeline: timeline,
    lastAssessment: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    nextAssessment: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString()
  };
}

/**
 * Generate mock map data
 * @returns {Object} - Map data including bathymetry, zones, and plumes
 */
export function generateMockMapData() {
  // Generate bathymetric data grid
  const gridSize = 50;
  const bathymetryData = {
    minDepth: -4500,
    maxDepth: -2500,
    grid: []
  };
  
  for (let lat = -14.5; lat >= -14.8; lat -= 0.01) {
    for (let lng = -125.6; lng <= -125.3; lng += 0.01) {
      // Base depth with some variation
      let depth = -3000 - Math.random() * 1000;
      
      // Add some features
      const distFromCenter = Math.sqrt(
        Math.pow(lat - (-14.65), 2) + 
        Math.pow(lng - (-125.45), 2)
      );
      
      // Add a seamount
      if (distFromCenter < 0.1) {
        depth += (0.1 - distFromCenter) * 10000;
      }
      
      // Add a trench
      if (Math.abs(lng - (-125.5)) < 0.05) {
        depth -= 500;
      }
      
      bathymetryData.grid.push({
        lat,
        lng,
        depth
      });
    }
  }
  
  // Generate zone boundaries
  const zoneBoundaries = [
    {
      id: 'ZONE-001',
      name: 'Mining Zone A',
      type: 'mining',
      color: '#4cc9f0',
      coordinates: [
        [-14.55, -125.5],
        [-14.55, -125.4],
        [-14.65, -125.4],
        [-14.65, -125.5],
        [-14.55, -125.5]
      ]
    },
    {
      id: 'ZONE-002',
      name: 'Mining Zone B',
      type: 'mining',
      color: '#4cc9f0',
      coordinates: [
        [-14.7, -125.5],
        [-14.7, -125.4],
        [-14.8, -125.4],
        [-14.8, -125.5],
        [-14.7, -125.5]
      ]
    },
    {
      id: 'ZONE-003',
      name: 'Protected Area',
      type: 'protected',
      color: '#ef476f',
      coordinates: [
        [-14.65, -125.6],
        [-14.65, -125.55],
        [-14.75, -125.55],
        [-14.75, -125.6],
        [-14.65, -125.6]
      ]
    }
  ];
  
  // Generate sensitive areas
  const sensitiveAreas = [
    {
      id: 'SENS-001',
      name: 'Coral Field',
      type: 'ecological',
      color: '#ffd166',
      center: [-14.62, -125.52],
      radius: 0.03
    },
    {
      id: 'SENS-002',
      name: 'Vent Community',
      type: 'ecological',
      color: '#ffd166',
      center: [-14.73, -125.45],
      radius: 0.02
    }
  ];
  
  // Generate sediment plumes
  const plumes = [
    {
      id: 'PLUME-001',
      position: [-14.58, -3000, -125.45],
      radius: 0.5,
      intensity: 0.7
    },
    {
      id: 'PLUME-002',
      position: [-14.72, -3000, -125.42],
      radius: 0.3,
      intensity: 0.4
    }
  ];
  
  return {
    bathymetry: bathymetryData,
    zones: zoneBoundaries,
    sensitiveAreas,
    plumes
  };
}

/**
 * Generate mock alerts
 * @param {number} count - Number of alerts to generate
 * @returns {Array} - Array of alert objects
 */
export function generateMockAlerts(count = 5) {
  const alertTypes = ['environmental', 'operational', 'compliance', 'system'];
  const severityLevels = ['info', 'warning', 'critical'];
  const alerts = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const severity = severityLevels[Math.floor(Math.random() * severityLevels.length)];
    const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
    
    let message = '';
    let source = '';
    
    switch (type) {
      case 'environmental':
        message = [
          'Sediment plume exceeding threshold',
          'Turbidity level above limit',
          'Species detected in proximity',
          'Water quality parameter deviation'
        ][Math.floor(Math.random() * 4)];
        source = 'Environmental Monitoring System';
        break;
      case 'operational':
        message = [
          'AUV battery level low',
          'Collection efficiency decreased',
          'Communication latency increased',
          'Approaching sensitive zone boundary'
        ][Math.floor(Math.random() * 4)];
        source = 'AUV Operations';
        break;
      case 'compliance':
        message = [
          'ISA reporting deadline approaching',
          'Compliance parameter near threshold',
          'Required assessment due soon',
          'Zone restriction violation detected'
        ][Math.floor(Math.random() * 4)];
        source = 'Compliance Monitor';
        break;
      case 'system':
        message = [
          'System update required',
          'Data synchronization delayed',
          'Sensor calibration needed',
          'Backup process completed'
        ][Math.floor(Math.random() * 4)];
        source = 'System Monitor';
        break;
    }
    
    alerts.push({
      id: `ALERT-${(i + 1).toString().padStart(3, '0')}`,
      timestamp,
      type,
      severity,
      message,
      source,
      acknowledged: Math.random() > 0.5,
      resolved: Math.random() > 0.7
    });
  }
  
  // Sort by timestamp, newest first
  return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Get mock data for a specific endpoint
 * @param {string} endpoint - API endpoint
 * @param {string} timeFrame - Time frame for data
 * @returns {Object} - Mock data for the endpoint
 */
export function getMockData(endpoint, timeFrame = 'live') {
  // Extract the base endpoint without parameters
  const basePath = endpoint.split('?')[0];
  
  // Match endpoint to mock data generator
  if (basePath.includes('/auvs')) {
    return generateMockAUVs(5);
  } else if (basePath.includes('/environmental')) {
    return generateMockEnvironmentalData();
  } else if (basePath.includes('/operational')) {
    return generateMockOperationalData();
  } else if (basePath.includes('/compliance')) {
    return generateMockComplianceData();
  } else if (basePath.includes('/map')) {
    return generateMockMapData();
  } else if (basePath.includes('/alerts')) {
    return generateMockAlerts(8);
  } else if (basePath.includes('/system')) {
    return {
      status: {
        auvConnections: 'connected',
        dataServices: 'connected',
        complianceReporting: 'connected'
      },
      timestamp: new Date().toISOString()
    };
  }
  
  // Default empty response
  return {};
}

/**
 * Simulate WebSocket connection with periodic updates
 * @param {string} channel - WebSocket channel
 * @param {Function} onMessage - Message handler
 * @returns {Object} - Simulated WebSocket controller
 */
export function simulateWebSocket(channel, onMessage) {
  console.log(`Simulating WebSocket for channel: ${channel}`);
  
  // Initial data
  let data;
  switch (channel) {
    case 'auvs':
      data = generateMockAUVs(5);
      break;
    case 'environmental':
      data = generateMockEnvironmentalData();
      break;
    case 'operational':
      data = generateMockOperationalData();
      break;
    case 'compliance':
      data = generateMockComplianceData();
      break;
    case 'alerts':
      data = generateMockAlerts(8);
      break;
    case 'system':
      data = {
        status: {
          auvConnections: 'connected',
          dataServices: 'connected',
          complianceReporting: 'connected'
        },
        timestamp: new Date().toISOString()
      };
      break;
    default:
      data = {};
  }
  
  // Send initial data
  setTimeout(() => {
    onMessage(data);
  }, 100);
  
  // Set up interval for periodic updates
  const intervalId = setInterval(() => {
    switch (channel) {
      case 'auvs':
        // Update AUV positions slightly
        data = data.map(auv => {
          return {
            ...auv,
            position: [
              auv.position[0] + (Math.random() - 0.5) * 0.01,
              auv.position[1],
              auv.position[2] + (Math.random() - 0.5) * 0.01
            ],
            rotation: [
              auv.rotation[0],
              auv.rotation[1] + Math.random() * 0.1,
              auv.rotation[2]
            ],
            batteryLevel: Math.max(0, Math.min(100, auv.batteryLevel - Math.random() * 0.5)),
            lastUpdated: new Date().toISOString()
          };
        });
        break;
      case 'environmental':
        // Update some environmental values
        data.sedimentDisturbance.current = Math.random() * 30;
        data.sedimentDisturbance.status = data.sedimentDisturbance.current > 25 ? 'critical' : 
                                         data.sedimentDisturbance.current > 15 ? 'warning' : 'normal';
        
        data.waterQuality.turbidity.current = Math.random() * 15;
        data.waterQuality.turbidity.status = data.waterQuality.turbidity.current > 10 ? 'critical' : 
                                            data.waterQuality.turbidity.current > 5 ? 'warning' : 'normal';
        break;
      case 'operational':
        // Update battery and efficiency
        data.battery.current = Math.max(0, Math.min(100, data.battery.current - Math.random() * 0.5));
        data.battery.status = data.battery.current < 20 ? 'critical' : 
                             data.battery.current < 40 ? 'warning' : 'normal';
        
        data.efficiency.current = Math.max(0, Math.min(100, data.efficiency.current + (Math.random() - 0.3) * 5));
        data.efficiency.status = data.efficiency.current < 50 ? 'warning' : 'normal';
        break;
      case 'alerts':
        // Occasionally add a new alert
        if (Math.random() > 0.8) {
          const newAlerts = generateMockAlerts(1);
          data = [...newAlerts, ...data].slice(0, 8);
        }
        break;
      case 'system':
        // Occasionally change system status
        if (Math.random() > 0.95) {
          const statuses = ['connected', 'warning', 'error'];
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          data.status.dataServices = randomStatus;
        }
        data.timestamp = new Date().toISOString();
        break;
    }
    
    onMessage(data);
  }, 5000);
  
  // Return controller
  return {
    close: () => clearInterval(intervalId),
    send: (message) => {
      console.log('Mock WebSocket received message:', message);
      // Could implement mock responses to sent messages here
    }
  };
}
