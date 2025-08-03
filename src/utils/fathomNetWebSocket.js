// Enhanced WebSocket Service with FathomNet Integration
// Extends the existing webSocketService with species alert handling

import webSocketService from "./webSocketService";

class FathomNetWebSocketExtension {
  constructor() {
    this.speciesAlertHandlers = new Set();
    this.setupSpeciesAlertHandling();
  }

  setupSpeciesAlertHandling() {
    // Listen for species detection alerts
    webSocketService.on("species_alert", (data) => {
      console.log("🐙 Species alert received:", data);
      this.handleSpeciesAlert(data);
    });

    // Listen for manual species triggers
    webSocketService.on("trigger_species_alert", (data) => {
      console.log("🎯 Manual species alert triggered:", data);
      this.handleSpeciesAlert(data);
    });
  }

  handleSpeciesAlert(alertData) {
    // Notify all registered handlers
    this.speciesAlertHandlers.forEach((handler) => {
      try {
        handler(alertData);
      } catch (error) {
        console.error("Error in species alert handler:", error);
      }
    });
  }

  // Register a handler for species alerts
  onSpeciesAlert(handler) {
    this.speciesAlertHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.speciesAlertHandlers.delete(handler);
    };
  }

  // Trigger a species detection alert
  triggerSpeciesAlert(
    species,
    auvId = "AUV-001",
    distance = null,
    confidence = null
  ) {
    const alertData = {
      species: species,
      auv_id: auvId,
      distance: distance || Math.floor(Math.random() * 200) + 50,
      confidence: confidence || Math.random() * 0.3 + 0.7,
      timestamp: new Date().toISOString(),
    };

    if (webSocketService.isConnectedToBackend()) {
      webSocketService.socket.emit("trigger_species_alert", alertData);
    } else {
      // Fallback for when WebSocket is not connected
      console.warn("WebSocket not connected, simulating species alert locally");
      setTimeout(() => {
        this.handleSpeciesAlert({
          id: Date.now(),
          message: `${species} detected`,
          severity: "info",
          ...alertData,
        });
      }, 100);
    }
  }

  // Get connection status
  isConnected() {
    return webSocketService.isConnectedToBackend();
  }
}

// Create singleton instance
const fathomNetWS = new FathomNetWebSocketExtension();

// Expose globally for demo purposes
if (typeof window !== "undefined") {
  window.fathomNetWS = fathomNetWS;
}

export default fathomNetWS;
