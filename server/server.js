// =========================
// DeepSeaGuard Backend Server
// =========================
// Express.js server with FathomNet API integration for species detection alerts

const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const fathomnetRoutes = require("./routes/fathomnet");
const missionRoutes = require("./routes/missions");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/fathomnet", fathomnetRoutes);
app.use("/api/missions", missionRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Demo data generator for mission playback testing
const generateDemoMissionData = () => {
    const missionId = "demo-mission-001";
    const auvId = "AUV-001";
    const startTime = new Date(Date.now() - 3600000); // 1 hour ago
    const events = [];

    // Generate 60 events over 1 hour (1 event per minute)
    for (let i = 0; i < 60; i++) {
        const timestamp = new Date(startTime.getTime() + i * 60000);
        const progress = i / 60;

        // Simulate AUV movement in a circular pattern in the open Pacific Ocean
        const angle = progress * 2 * Math.PI;
        const radius = 0.05; // ~5km radius for ocean mission (more visible at zoom 12)
        const centerLat = 30.0; // Open Pacific Ocean (far from land)
        const centerLng = -120.0;

        const lat = centerLat + radius * Math.cos(angle);
        const lng = centerLng + radius * Math.sin(angle);
        const depth = 50 + Math.sin(angle * 3) * 20; // Varying depth

        const event = {
            auv_id: auvId,
            timestamp: timestamp.toISOString(),
            lat: lat,
            lng: lng,
            depth: depth,
            mission_id: missionId,
            metrics: {
                temperature: 15 + Math.sin(angle) * 2,
                salinity: 35 + Math.cos(angle) * 0.5,
                pressure: 1000 + depth * 10,
                oxygen: 8 + Math.sin(angle * 2) * 1,
            },
            detected_species: [],
            violations: [],
        };

        // Add species detections at specific points
        if (i === 15 || i === 35 || i === 55) {
            event.detected_species = [
                {
                    species: "Blue Whale",
                    confidence: 0.85 + Math.random() * 0.1,
                    bounding_box: { x: 100, y: 150, width: 200, height: 100 },
                },
            ];
        }

        // Add ISA violations at specific points
        if (i === 25 || i === 45) {
            event.violations = [
                {
                    type: "ISA_ZONE_ENTRY",
                    zone: "Protected Marine Area",
                    severity: "warning",
                },
            ];
        }

        events.push(event);
    }

    return events;
};

// Initialize demo data
let demoEvents = generateDemoMissionData();

// WebSocket connection handling
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Simulate species detection alert for demo
    socket.on("trigger_species_alert", (data) => {
        console.log("Species alert triggered:", data);

        // Emit alert to all connected clients
        io.emit("alert", {
            id: Date.now(),
            auv_id: data.auv_id || "AUV-001",
            message: `${data.species || "Unknown species"} detected`,
            severity: "info",
            timestamp: new Date().toISOString(),
            species: data.species,
            distance: data.distance || 120,
            metadata: data.metadata || {},
        });
    });

    // Mission playback events
    socket.on("start_playback", (data) => {
        console.log("Starting mission playback:", data);
        io.emit("playback_started", { mission_id: data.mission_id });
    });

    socket.on("playback_progress", (data) => {
        io.emit("playback_update", data);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 DeepSeaGuard server running on port ${PORT}`);
    console.log(`🌊 FathomNet integration ready`);
    console.log(`🎯 Mission playback engine ready`);
});

module.exports = { app, server, io };
