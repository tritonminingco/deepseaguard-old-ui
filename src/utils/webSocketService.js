// WebSocket Client Service for Real-time Data
// Connects to DeepSeaGuard backend and manages live telemetry streams

import { io } from "socket.io-client";

class WebSocketService {
    // Add event listener
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    // Remove event listener
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.subscribers = new Map();
        this.auvData = new Map();
        this.systemStatus = null;

        // Event callbacks
        this.onConnectionChange = null;
        this.onAUVUpdate = null;
        this.onSystemUpdate = null;
        this.onAlert = null;
    }

    connect(backendUrl) {
        // Prefer explicit backend URL from env, fallback to localhost:3000
        const envUrl = import.meta?.env?.VITE_WS_URL;
        const wsUrl = backendUrl || envUrl || "http://localhost:3000";

        console.log("🔌 Environment VITE_WS_URL:", envUrl);
        console.log("🔌 Connecting to DeepSeaGuard backend:", wsUrl);

        this.socket = io(wsUrl, {
            transports: ["websocket", "polling"],
            timeout: 10000,
            forceNew: true,
        });
        this.setupEventHandlers();
        return this.socket;
    }

    setupEventHandlers() {
        // Connection events
        this.socket.on("connect", () => {
            console.log("✅ Connected to DeepSeaGuard backend");
            this.isConnected = true;
            this.reconnectAttempts = 0;

            if (this.onConnectionChange) {
                this.onConnectionChange(true);
            }

            // Request initial data
            this.socket.emit("get_auv_list");
        });

        this.socket.on("disconnect", (reason) => {
            console.log("❌ Disconnected from backend:", reason);
            this.isConnected = false;

            if (this.onConnectionChange) {
                this.onConnectionChange(false);
            }

            // Attempt reconnection
            this.attemptReconnect();
        });

        this.socket.on("connect_error", (error) => {
            console.error("🚫 Connection error:", error);
            this.isConnected = false;

            if (this.onConnectionChange) {
                this.onConnectionChange(false);
            }
        });

        // Data events
        this.socket.on("auv_list", (data) => {
            console.log("📋 Received AUV list:", data.auvs);

            // Subscribe to all AUVs by default
            data.auvs.forEach((auv) => {
                this.subscribeToAUV(auv.auv_id);
            });
        });

        this.socket.on("auv_telemetry", (data) => {
            console.log(`📡 Telemetry update for ${data.auv_id}`);

            // Store the data
            this.auvData.set(data.auv_id, data.data);

            // Notify subscribers
            if (this.onAUVUpdate) {
                this.onAUVUpdate(data.auv_id, data.data);
            }

            // Notify specific AUV subscribers
            const subscribers = this.subscribers.get(data.auv_id) || [];
            subscribers.forEach((callback) => {
                try {
                    callback(data.data);
                } catch (error) {
                    console.error("Error in AUV subscriber callback:", error);
                }
            });
        });

        this.socket.on("telemetry_update", (data) => {
            // Quick update for map markers
            console.log(
                `🗺️ Position update for ${data.auv_id}:`,
                data.position
            );
        });

        this.socket.on("system_status", (data) => {
            this.systemStatus = data;

            if (this.onSystemUpdate) {
                this.onSystemUpdate(data);
            }
        });

        this.socket.on("scenario_triggered", (data) => {
            console.log(
                `🎬 Scenario triggered: ${data.scenario} for ${data.auv_id}`
            );
        });

        this.socket.on("demo_started", (data) => {
            console.log("🚀 Investor demo started:", data.message);
        });
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(
                `🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`
            );

            setTimeout(() => {
                if (this.socket) {
                    this.socket.connect();
                }
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error("❌ Max reconnection attempts reached");
        }
    }

    subscribeToAUV(auvId) {
        if (this.socket && this.isConnected) {
            console.log(`📡 Subscribing to AUV: ${auvId}`);
            this.socket.emit("subscribe_auv", { auv_id: auvId });
        }
    }

    unsubscribeFromAUV(auvId) {
        if (this.socket && this.isConnected) {
            console.log(`📡 Unsubscribing from AUV: ${auvId}`);
            this.socket.emit("unsubscribe_auv", { auv_id: auvId });
        }
    }

    triggerScenario(auvId, scenario) {
        if (this.socket && this.isConnected) {
            console.log(`🎬 Triggering scenario: ${scenario} for ${auvId}`);
            this.socket.emit("trigger_scenario", {
                auv_id: auvId,
                scenario: scenario,
            });
        }
    }

    startInvestorDemo() {
        if (this.socket && this.isConnected) {
            console.log("🚀 Starting investor demo sequence");
            this.socket.emit("start_investor_demo");
        }
    }

    // Subscribe to specific AUV updates
    onAUVData(auvId, callback) {
        if (!this.subscribers.has(auvId)) {
            this.subscribers.set(auvId, []);
        }
        this.subscribers.get(auvId).push(callback);

        // If we already have data for this AUV, send it immediately
        if (this.auvData.has(auvId)) {
            callback(this.auvData.get(auvId));
        }

        // Subscribe to this AUV if not already
        this.subscribeToAUV(auvId);
    }

    // Get current data for an AUV
    getAUVData(auvId) {
        return this.auvData.get(auvId) || null;
    }

    // Get all AUV data
    getAllAUVData() {
        return Object.fromEntries(this.auvData);
    }

    // Get system status
    getSystemStatus() {
        return this.systemStatus;
    }

    // Disconnect
    disconnect() {
        if (this.socket) {
            console.log("🔌 Disconnecting from backend");
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Check connection status
    isConnectedToBackend() {
        return this.isConnected && this.socket && this.socket.connected;
    }
}

// Create singleton instance
const webSocketService = new WebSocketService();

// Auto-connect when module loads (use env or fallback)
webSocketService.connect("http://localhost:3000");

export default webSocketService;
