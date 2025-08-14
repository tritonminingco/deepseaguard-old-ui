// Mock alert data for DeepSeaGuard alerts system

/**
 * Alert templates for different types and severities
 */
export const alertTemplates = {
  environmental: {
    high: [
      "Critical sediment plume detected - exceeding threshold by 150%",
      "Severe turbidity spike - visibility compromised",
      "Protected species detected in immediate vicinity",
      "Water quality parameters critically degraded",
    ],
    medium: [
      "Moderate sediment disturbance observed",
      "Turbidity levels approaching threshold",
      "Marine life activity increased in area",
      "Water quality parameters showing deviation",
    ],
    low: [
      "Minor environmental parameter fluctuation",
      "Baseline sediment movement detected",
      "Normal marine life activity observed",
      "Routine environmental monitoring alert",
    ],
  },
  operational: {
    high: [
      "AUV battery critically low - immediate return required",
      "Major system malfunction detected",
      "Communication loss with AUV for extended period",
      "Mission critical equipment failure",
    ],
    medium: [
      "AUV battery below 30% - consider return",
      "Minor system performance degradation",
      "Intermittent communication issues",
      "Non-critical equipment maintenance required",
    ],
    low: [
      "Routine battery status update",
      "System performance within normal range",
      "Communication latency slightly elevated",
      "Scheduled maintenance reminder",
    ],
  },
  compliance: {
    high: [
      "ISA violation detected - immediate action required",
      "Operating outside authorized zone boundaries",
      "Critical reporting deadline missed",
      "Compliance parameter breach - regulatory risk",
    ],
    medium: [
      "ISA reporting deadline approaching",
      "Approaching authorized zone boundary",
      "Compliance parameter near threshold",
      "Required assessment due within 24 hours",
    ],
    low: [
      "Routine compliance check completed",
      "ISA reporting reminder",
      "Compliance parameters within normal range",
      "Scheduled compliance assessment due",
    ],
  },
  system: {
    high: [
      "Critical system error - immediate attention required",
      "Database corruption detected",
      "Security breach attempt identified",
      "System backup failure - data at risk",
    ],
    medium: [
      "System update available - restart recommended",
      "Data synchronization delayed",
      "Sensor calibration required",
      "Performance degradation detected",
    ],
    low: [
      "System health check completed",
      "Routine backup completed successfully",
      "Minor configuration update applied",
      "System monitoring alert",
    ],
  },
};

/**
 * Alert sources mapping
 */
export const alertSources = {
  environmental: "Environmental Monitoring System",
  operational: "AUV Operations Center",
  compliance: "ISA Compliance Monitor",
  system: "DeepSeaGuard System",
};

/**
 * Alert titles for different types
 */
export const alertTitles = {
  environmental: [
    "Environmental Alert",
    "Sediment Monitoring",
    "Species Detection",
    "Water Quality Alert",
    "Marine Ecosystem Alert",
  ],
  operational: [
    "AUV Status Alert",
    "Operations Alert",
    "Mission Status",
    "Equipment Alert",
    "Performance Alert",
  ],
  compliance: [
    "ISA Compliance Alert",
    "Regulatory Notice",
    "Zone Compliance",
    "Reporting Alert",
    "Assessment Required",
  ],
  system: [
    "System Alert",
    "Technical Notice",
    "Maintenance Alert",
    "Security Alert",
    "Data Alert",
  ],
};

/**
 * Generate a single mock alert
 * @param {string} id - Alert ID
 * @param {string} type - Alert type (environmental, operational, compliance, system)
 * @param {string} severity - Alert severity (high, medium, low)
 * @param {Date} timestamp - Alert timestamp
 * @returns {Object} Alert object
 */
export function generateMockAlert(
  id,
  type = null,
  severity = null,
  timestamp = null
) {
  const alertTypes = ["environmental", "operational", "compliance", "system"];
  const severityLevels = ["high", "medium", "low"];

  const alertType =
    type || alertTypes[Math.floor(Math.random() * alertTypes.length)];
  const alertSeverity =
    severity ||
    severityLevels[Math.floor(Math.random() * severityLevels.length)];
  const alertTimestamp = timestamp || new Date();

  const messages = alertTemplates[alertType][alertSeverity];
  const titles = alertTitles[alertType];

  return {
    id: id || `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: alertType,
    severity: alertSeverity,
    title: titles[Math.floor(Math.random() * titles.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    source: alertSources[alertType],
    timestamp: alertTimestamp.toISOString(),
    acknowledged: false,
    resolved: false,
    read: false,
    metadata: {
      auvId: `AUV-${Math.floor(Math.random() * 5) + 1}`.padStart(7, "0"),
      location: {
        lat: -14.65 + (Math.random() - 0.5) * 0.2,
        lng: -125.45 + (Math.random() - 0.5) * 0.2,
        depth: Math.floor(Math.random() * 1000) + 3000,
      },
    },
  };
}

/**
 * Generate multiple mock alerts
 * @param {number} count - Number of alerts to generate
 * @returns {Array} Array of alert objects
 */
export function generateMockAlerts(count = 10) {
  const alerts = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Generate timestamps over the last 24 hours
    const hoursBack = Math.random() * 24;
    const timestamp = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

    const alert = generateMockAlert(
      `ALERT-${(i + 1).toString().padStart(3, "0")}`,
      null,
      null,
      timestamp
    );

    // Some alerts should be acknowledged/resolved
    if (Math.random() > 0.7) {
      alert.acknowledged = true;
      if (Math.random() > 0.5) {
        alert.resolved = true;
      }
    }

    // Some alerts should be read
    if (Math.random() > 0.4) {
      alert.read = true;
    }

    alerts.push(alert);
  }

  // Sort by timestamp, newest first
  return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Initial alert data for the application
 */
export const initialAlerts = generateMockAlerts(15);
