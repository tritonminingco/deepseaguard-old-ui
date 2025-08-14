// AlertsService - handles alert data management and API interactions
import { generateMockAlert, generateMockAlerts } from "../mocks/alertData.js";

/**
 * AlertsService - Manages alert data operations
 * Provides methods for fetching, creating, updating alerts
 */
class AlertsService {
  constructor() {
    this.baseUrl = "/api/alerts"; // API endpoint base
    this.mockMode = true; // Set to false when real API is available
  }

  /**
   * Fetch all alerts
   * @param {Object} options - Query options
   * @param {string} options.severity - Filter by severity (high, medium, low)
   * @param {string} options.type - Filter by type (environmental, operational, compliance, system)
   * @param {boolean} options.unreadOnly - Only fetch unread alerts
   * @param {number} options.limit - Limit number of results
   * @returns {Promise<Array>} Array of alerts
   */
  async fetchAlerts(options = {}) {
    if (this.mockMode) {
      return this.fetchMockAlerts(options);
    }

    try {
      const queryParams = new URLSearchParams();

      if (options.severity) queryParams.append("severity", options.severity);
      if (options.type) queryParams.append("type", options.type);
      if (options.unreadOnly) queryParams.append("unread", "true");
      if (options.limit) queryParams.append("limit", options.limit.toString());

      const response = await fetch(`${this.baseUrl}?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }

      const data = await response.json();
      return data.alerts || [];
    } catch (error) {
      console.error("Error fetching alerts:", error);
      return this.fetchMockAlerts(options); // Fallback to mock data
    }
  }

  /**
   * Fetch mock alerts (for development)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of mock alerts
   */
  async fetchMockAlerts(options = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let alerts = generateMockAlerts(options.limit || 20);

        // Apply filters
        if (options.severity) {
          alerts = alerts.filter(
            (alert) => alert.severity === options.severity
          );
        }

        if (options.type) {
          alerts = alerts.filter((alert) => alert.type === options.type);
        }

        if (options.unreadOnly) {
          alerts = alerts.filter((alert) => !alert.read);
        }

        resolve(alerts);
      }, 100); // Simulate network delay
    });
  }

  /**
   * Create a new alert
   * @param {Object} alertData - Alert data
   * @returns {Promise<Object>} Created alert
   */
  async createAlert(alertData) {
    if (this.mockMode) {
      return this.createMockAlert(alertData);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create alert: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating alert:", error);
      return this.createMockAlert(alertData); // Fallback to mock
    }
  }

  /**
   * Create mock alert (for development)
   * @param {Object} alertData - Alert data
   * @returns {Promise<Object>} Created mock alert
   */
  async createMockAlert(alertData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const alert = generateMockAlert(
          null,
          alertData.type,
          alertData.severity,
          alertData.timestamp ? new Date(alertData.timestamp) : null
        );

        // Override with provided data
        Object.assign(alert, alertData);

        resolve(alert);
      }, 100);
    });
  }

  /**
   * Update an alert
   * @param {string} alertId - Alert ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated alert
   */
  async updateAlert(alertId, updates) {
    if (this.mockMode) {
      return this.updateMockAlert(alertId, updates);
    }

    try {
      const response = await fetch(`${this.baseUrl}/${alertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update alert: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating alert:", error);
      return this.updateMockAlert(alertId, updates); // Fallback to mock
    }
  }

  /**
   * Update mock alert (for development)
   * @param {string} alertId - Alert ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated mock alert
   */
  async updateMockAlert(alertId, updates) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In real implementation, this would update the alert in the store
        const updatedAlert = {
          id: alertId,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedAlert);
      }, 100);
    });
  }

  /**
   * Acknowledge an alert
   * @param {string} alertId - Alert ID
   * @returns {Promise<Object>} Acknowledged alert
   */
  async acknowledgeAlert(alertId) {
    return this.updateAlert(alertId, {
      acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
    });
  }

  /**
   * Resolve an alert
   * @param {string} alertId - Alert ID
   * @param {string} resolution - Resolution notes
   * @returns {Promise<Object>} Resolved alert
   */
  async resolveAlert(alertId, resolution = "") {
    return this.updateAlert(alertId, {
      resolved: true,
      resolvedAt: new Date().toISOString(),
      resolution,
    });
  }

  /**
   * Mark alert as read
   * @param {string} alertId - Alert ID
   * @returns {Promise<Object>} Updated alert
   */
  async markAsRead(alertId) {
    return this.updateAlert(alertId, {
      read: true,
      readAt: new Date().toISOString(),
    });
  }

  /**
   * Mark multiple alerts as read
   * @param {Array<string>} alertIds - Array of alert IDs
   * @returns {Promise<Array>} Array of updated alerts
   */
  async markMultipleAsRead(alertIds) {
    const promises = alertIds.map((id) => this.markAsRead(id));
    return Promise.all(promises);
  }

  /**
   * Delete an alert
   * @param {string} alertId - Alert ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteAlert(alertId) {
    if (this.mockMode) {
      return this.deleteMockAlert(alertId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/${alertId}`, {
        method: "DELETE",
      });

      return response.ok;
    } catch (error) {
      console.error("Error deleting alert:", error);
      return this.deleteMockAlert(alertId); // Fallback to mock
    }
  }

  /**
   * Delete mock alert (for development)
   * @param {string} alertId - Alert ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteMockAlert(alertId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In real implementation, this would remove the alert from the store
        resolve(true);
      }, 100);
    });
  }

  /**
   * Get alert statistics
   * @returns {Promise<Object>} Alert statistics
   */
  async getAlertStats() {
    if (this.mockMode) {
      return this.getMockAlertStats();
    }

    try {
      const response = await fetch(`${this.baseUrl}/stats`);

      if (!response.ok) {
        throw new Error(`Failed to fetch alert stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching alert stats:", error);
      return this.getMockAlertStats(); // Fallback to mock
    }
  }

  /**
   * Get mock alert statistics (for development)
   * @returns {Promise<Object>} Mock alert statistics
   */
  async getMockAlertStats() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const stats = {
          total: 42,
          unread: 8,
          acknowledged: 15,
          resolved: 19,
          bySeverity: {
            high: 5,
            medium: 18,
            low: 19,
          },
          byType: {
            environmental: 12,
            operational: 15,
            compliance: 8,
            system: 7,
          },
        };
        resolve(stats);
      }, 100);
    });
  }

  /**
   * Subscribe to real-time alerts (WebSocket)
   * @param {Function} callback - Callback function for new alerts
   * @returns {Function} Unsubscribe function
   */
  subscribeToAlerts(callback) {
    if (this.mockMode) {
      return this.subscribeMockAlerts(callback);
    }

    // Real WebSocket implementation would go here
    const ws = new WebSocket("/ws/alerts");

    ws.onmessage = (event) => {
      const alert = JSON.parse(event.data);
      callback(alert);
    };

    return () => {
      ws.close();
    };
  }

  /**
   * Subscribe to mock alerts (for development)
   * @param {Function} callback - Callback function for new alerts
   * @returns {Function} Unsubscribe function
   */
  subscribeMockAlerts(callback) {
    // Simulate random new alerts every 10-30 seconds
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        // 30% chance of new alert
        const alert = generateMockAlert();
        callback(alert);
      }
    }, Math.random() * 20000 + 10000); // 10-30 seconds

    return () => {
      clearInterval(interval);
    };
  }
}

// Export singleton instance
export default new AlertsService();
