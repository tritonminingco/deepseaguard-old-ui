// =========================
// Mission Engine Routes
// =========================
// Handles mission ingestion, storage, and querying for playback system

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const _ = require("lodash");

const router = express.Router();

// In-memory storage for demo (replace with PostgreSQL/MongoDB in production)
const missions = new Map();
const missionEvents = new Map();
const eventIndex = new Map(); // Index for fast event type queries

// Mission ingestion endpoint
router.post("/ingest", (req, res) => {
    try {
        const {
            auv_id,
            timestamp,
            lat,
            lng,
            depth,
            metrics,
            detected_species,
            violations,
            mission_id,
        } = req.body;

        if (!auv_id || !timestamp || !mission_id) {
            return res.status(400).json({
                error: "Missing required fields: auv_id, timestamp, mission_id",
            });
        }

        const eventId = uuidv4();
        const event = {
            id: eventId,
            mission_id,
            auv_id,
            timestamp: new Date(timestamp),
            lat: parseFloat(lat) || null,
            lng: parseFloat(lng) || null,
            depth: parseFloat(depth) || null,
            metrics: metrics || {},
            detected_species: detected_species || [],
            violations: violations || [],
            created_at: new Date(),
        };

        // Store event
        if (!missionEvents.has(mission_id)) {
            missionEvents.set(mission_id, []);
        }
        missionEvents.get(mission_id).push(event);

        // Index events by type for fast querying
        if (detected_species && detected_species.length > 0) {
            if (!eventIndex.has("species_detection")) {
                eventIndex.set("species_detection", []);
            }
            eventIndex.get("species_detection").push({
                event_id: eventId,
                mission_id,
                timestamp: event.timestamp,
                species: detected_species,
            });
        }

        if (violations && violations.length > 0) {
            if (!eventIndex.has("isa_violation")) {
                eventIndex.set("isa_violation", []);
            }
            eventIndex.get("isa_violation").push({
                event_id: eventId,
                mission_id,
                timestamp: event.timestamp,
                violations,
            });
        }

        // Update mission metadata
        if (!missions.has(mission_id)) {
            missions.set(mission_id, {
                id: mission_id,
                auv_id,
                start_time: event.timestamp,
                end_time: event.timestamp,
                event_count: 0,
                created_at: new Date(),
            });
        }

        const mission = missions.get(mission_id);
        mission.end_time = event.timestamp;
        mission.event_count = missionEvents.get(mission_id).length;

        res.json({
            success: true,
            event_id: eventId,
            mission_id,
            message: "Event ingested successfully",
        });
    } catch (error) {
        console.error("Mission ingestion error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
});

// Get mission by ID
router.get("/:missionId", (req, res) => {
    try {
        const { missionId } = req.params;
        const { start_time, end_time, event_types } = req.query;

        if (!missions.has(missionId)) {
            return res.status(404).json({
                error: "Mission not found",
            });
        }

        const mission = missions.get(missionId);
        let events = missionEvents.get(missionId) || [];

        // Filter by time range
        if (start_time || end_time) {
            events = events.filter((event) => {
                const eventTime = moment(event.timestamp);
                const startFilter = start_time ? moment(start_time) : moment(0);
                const endFilter = end_time ? moment(end_time) : moment();
                return eventTime.isBetween(startFilter, endFilter, null, "[]");
            });
        }

        // Filter by event types
        if (event_types) {
            const types = event_types.split(",");
            events = events.filter((event) => {
                return types.some((type) => {
                    switch (type) {
                        case "species_detection":
                            return (
                                event.detected_species &&
                                event.detected_species.length > 0
                            );
                        case "isa_violation":
                            return (
                                event.violations && event.violations.length > 0
                            );
                        case "environmental":
                            return (
                                event.metrics &&
                                Object.keys(event.metrics).length > 0
                            );
                        default:
                            return true;
                    }
                });
            });
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedEvents = events.slice(startIndex, endIndex);

        res.json({
            mission,
            events: paginatedEvents,
            pagination: {
                page,
                limit,
                total: events.length,
                total_pages: Math.ceil(events.length / limit),
            },
        });
    } catch (error) {
        console.error("Mission query error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
});

// Get all missions
router.get("/", (req, res) => {
    try {
        const { auv_id, status, limit = 50 } = req.query;

        let missionList = Array.from(missions.values());

        // Filter by AUV
        if (auv_id) {
            missionList = missionList.filter((m) => m.auv_id === auv_id);
        }

        // Filter by status
        if (status) {
            missionList = missionList.filter((m) => m.status === status);
        }

        // Sort by start time (newest first)
        missionList.sort(
            (a, b) => new Date(b.start_time) - new Date(a.start_time)
        );

        // Limit results
        missionList = missionList.slice(0, parseInt(limit));

        res.json({
            missions: missionList,
            total: missionList.length,
        });
    } catch (error) {
        console.error("Missions query error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
});

// Get events by type
router.get("/events/:eventType", (req, res) => {
    try {
        const { eventType } = req.params;
        const { mission_id, start_time, end_time } = req.query;

        if (!eventIndex.has(eventType)) {
            return res.json({
                events: [],
                total: 0,
            });
        }

        let events = eventIndex.get(eventType);

        // Filter by mission
        if (mission_id) {
            events = events.filter((e) => e.mission_id === mission_id);
        }

        // Filter by time range
        if (start_time || end_time) {
            events = events.filter((event) => {
                const eventTime = moment(event.timestamp);
                const startFilter = start_time ? moment(start_time) : moment(0);
                const endFilter = end_time ? moment(end_time) : moment();
                return eventTime.isBetween(startFilter, endFilter, null, "[]");
            });
        }

        res.json({
            events,
            total: events.length,
        });
    } catch (error) {
        console.error("Events query error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
});

// Export mission as ISA-ready JSON
router.get("/:missionId/export", (req, res) => {
    try {
        const { missionId } = req.params;

        if (!missions.has(missionId)) {
            return res.status(404).json({
                error: "Mission not found",
            });
        }

        const mission = missions.get(missionId);
        const events = missionEvents.get(missionId) || [];

        // Generate ISA-compliant report
        const isaReport = {
            report_id: `ISA-${missionId}-${Date.now()}`,
            mission_id: missionId,
            auv_id: mission.auv_id,
            start_time: mission.start_time,
            end_time: mission.end_time,
            total_events: mission.event_count,
            summary: {
                species_detections: events.filter(
                    (e) => e.detected_species?.length > 0
                ).length,
                isa_violations: events.filter((e) => e.violations?.length > 0)
                    .length,
                environmental_events: events.filter(
                    (e) => e.metrics && Object.keys(e.metrics).length > 0
                ).length,
            },
            events: events.map((event) => ({
                timestamp: event.timestamp,
                location:
                    event.lat && event.lng
                        ? { lat: event.lat, lng: event.lng }
                        : null,
                depth: event.depth,
                species_detections: event.detected_species || [],
                violations: event.violations || [],
                environmental_metrics: event.metrics || {},
            })),
            generated_at: new Date().toISOString(),
        };

        res.json(isaReport);
    } catch (error) {
        console.error("Mission export error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
});

// Delete mission and all its events
router.delete("/:missionId", (req, res) => {
    try {
        const { missionId } = req.params;

        if (!missions.has(missionId)) {
            return res.status(404).json({
                error: "Mission not found",
            });
        }

        // Remove mission metadata
        missions.delete(missionId);

        // Remove all events for this mission
        missionEvents.delete(missionId);

        // Remove from event index
        for (const [eventType, events] of eventIndex.entries()) {
            const filteredEvents = events.filter(
                (e) => e.mission_id !== missionId
            );
            if (filteredEvents.length === 0) {
                eventIndex.delete(eventType);
            } else {
                eventIndex.set(eventType, filteredEvents);
            }
        }

        console.log(`🗑️ Mission ${missionId} deleted successfully`);

        res.json({
            success: true,
            message: `Mission ${missionId} deleted successfully`,
        });
    } catch (error) {
        console.error("Mission deletion error:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
});

module.exports = router;
