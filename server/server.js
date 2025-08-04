// =========================
// DeepSeaGuard Backend Server
// =========================
// Express.js server with FathomNet API integration for species detection alerts

const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const fathomnetRoutes = require("./routes/fathomnet");

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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

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

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 DeepSeaGuard server running on port ${PORT}`);
  console.log(`🌊 FathomNet integration ready`);
});

module.exports = { app, server, io };
