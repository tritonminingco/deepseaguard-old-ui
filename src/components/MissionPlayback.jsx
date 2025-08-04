import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
} from "react-leaflet";
import L from "leaflet";
import { apiClient } from "../config/api";
import "../styles/MissionPlayback.css";

// Custom AUV marker icon
const auvIcon = new L.Icon({
    iconUrl:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDkuNzRMMTIgMTZMMTAuOTEgOS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0iIzNiODJmNiIvPgo8L3N2Zz4K",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
});

// Event type icons
const eventIcons = {
    species_detection: new L.Icon({
        iconUrl:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmNTkzMjAiLz4KPC9zdmc+Cg==",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    }),
    isa_violation: new L.Icon({
        iconUrl:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDkuNzRMMTIgMTZMMTAuOTEgOS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0iI2VmNDQ0NCIvPgo8L3N2Zz4K",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    }),
    environmental: new L.Icon({
        iconUrl:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMzNGQzODAiLz4KPC9zdmc+Cg==",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    }),
};

function MissionPlayback({
    selectedMissionId = "demo-mission-001",
    onMissionDeleted,
}) {
    // State management
    const [mission, setMission] = useState(null);
    const [events, setEvents] = useState([]);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [eventFilters, setEventFilters] = useState({
        species_detection: true,
        isa_violation: true,
        environmental: true,
    });
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Refs
    const playbackIntervalRef = useRef(null);
    const mapRef = useRef(null);

    // Load mission data
    const loadMission = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get(
                `/api/missions/${selectedMissionId}`
            );
            const { mission: missionData, events: missionEvents } =
                response.data;

            setMission(missionData);
            setEvents(missionEvents);
            setFilteredEvents(missionEvents);

            // Calculate total duration
            if (missionEvents.length > 0) {
                const startTime = new Date(missionData.start_time);
                const endTime = new Date(missionData.end_time);
                const duration = endTime - startTime;
                setTotalDuration(duration);
            }

            setLoading(false);
        } catch (err) {
            console.error("Error loading mission:", err);
            setError("Failed to load mission data");
            setLoading(false);
        }
    }, [selectedMissionId]);

    // Export mission as ISA report
    const exportMission = async () => {
        try {
            const response = await apiClient.get(
                `/api/missions/${selectedMissionId}/export`
            );

            // Create and download the file
            const blob = new Blob([JSON.stringify(response.data, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `mission-${selectedMissionId}-isa-report.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error exporting mission:", err);
            setError("Failed to export mission");
        }
    };

    // Share mission as public link
    const shareMission = async () => {
        try {
            // Generate a shareable link (in a real app, this would create a public URL)
            const shareUrl = `${window.location.origin}/mission/${selectedMissionId}`;

            // Copy to clipboard
            await navigator.clipboard.writeText(shareUrl);

            // Show success message
            alert(
                `Mission link copied to clipboard!\n\n${shareUrl}\n\nShare this link to let others view the mission playback.`
            );
        } catch (err) {
            console.error("Error sharing mission:", err);
            setError("Failed to share mission");
        }
    };

    // Delete mission function
    const deleteMission = async () => {
        if (!mission) return;

        if (
            !window.confirm(
                `Are you sure you want to delete mission "${mission.auv_id}"? This action cannot be undone.`
            )
        ) {
            return;
        }

        try {
            await apiClient.delete(`/api/missions/${selectedMissionId}`);

            // Notify parent component that mission was deleted
            if (onMissionDeleted) {
                onMissionDeleted(selectedMissionId);
            }
        } catch (err) {
            console.error("Error deleting mission:", err);
            setError("Failed to delete mission");
        }
    };

    // Load mission on mount and when mission ID changes
    useEffect(() => {
        loadMission();
    }, [loadMission]);

    // Filter events based on selected filters
    useEffect(() => {
        const filtered = events.filter((event) => {
            const hasSpecies =
                event.detected_species && event.detected_species.length > 0;
            const hasViolations =
                event.violations && event.violations.length > 0;
            const hasEnvironmental =
                event.metrics && Object.keys(event.metrics).length > 0;

            return (
                (eventFilters.species_detection && hasSpecies) ||
                (eventFilters.isa_violation && hasViolations) ||
                (eventFilters.environmental && hasEnvironmental) ||
                (!hasSpecies && !hasViolations && !hasEnvironmental) // Always show regular telemetry
            );
        });

        setFilteredEvents(filtered);
    }, [events, eventFilters]);

    // Playback controls
    const startPlayback = useCallback(() => {
        if (events.length === 0) return;

        setIsPlaying(true);
        setCurrentEventIndex(0);
        setCurrentTime(0);

        playbackIntervalRef.current = setInterval(() => {
            setCurrentEventIndex((prev) => {
                const next = prev + 1;
                if (next >= events.length) {
                    setIsPlaying(false);
                    clearInterval(playbackIntervalRef.current);
                    return prev;
                }
                return next;
            });
        }, 1000 / playbackSpeed); // 1 second per event, adjusted by speed
    }, [events, playbackSpeed]);

    const pausePlayback = useCallback(() => {
        setIsPlaying(false);
        if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
        }
    }, []);

    const stopPlayback = useCallback(() => {
        setIsPlaying(false);
        setCurrentEventIndex(0);
        setCurrentTime(0);
        if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
        }
    }, []);

    const seekToEvent = useCallback(
        (index) => {
            setCurrentEventIndex(index);
            if (index < events.length) {
                const event = events[index];
                const eventTime = new Date(event.timestamp);
                const startTime = new Date(mission.start_time);
                const timeDiff = eventTime - startTime;
                setCurrentTime(timeDiff);
            }
        },
        [events, mission]
    );

    // Update current time when event index changes
    useEffect(() => {
        if (events.length > 0 && currentEventIndex < events.length) {
            const event = events[currentEventIndex];
            const eventTime = new Date(event.timestamp);
            const startTime = new Date(mission.start_time);
            const timeDiff = eventTime - startTime;
            setCurrentTime(timeDiff);
        }
    }, [currentEventIndex, events, mission]);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current);
            }
        };
    }, []);

    // Get current event data
    const currentEvent = events[currentEventIndex] || null;
    const currentPosition = currentEvent
        ? [currentEvent.lat, currentEvent.lng]
        : null;

    // Generate path for AUV movement
    const auvPath = events
        .filter((event) => event.lat && event.lng)
        .map((event) => [event.lat, event.lng]);

    // Get events for timeline markers
    const timelineEvents = filteredEvents.map((event, index) => {
        const eventTime = new Date(event.timestamp);
        const startTime = new Date(mission?.start_time || 0);
        const timeDiff = eventTime - startTime;
        const progress =
            totalDuration > 0 ? (timeDiff / totalDuration) * 100 : 0;

        let eventType = "telemetry";
        if (event.detected_species && event.detected_species.length > 0) {
            eventType = "species_detection";
        } else if (event.violations && event.violations.length > 0) {
            eventType = "isa_violation";
        } else if (event.metrics && Object.keys(event.metrics).length > 0) {
            eventType = "environmental";
        }

        return {
            ...event,
            index,
            progress,
            eventType,
        };
    });

    if (loading) {
        return (
            <div className="mission-playback">
                <div className="loading">Loading mission data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mission-playback">
                <div className="error">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="mission-playback">
            {/* Mission Info Header */}
            <div className="mission-header">
                <div className="mission-title">
                    <h2>Mission Playback: {mission?.auv_id}</h2>
                    <div className="mission-actions">
                        <button
                            onClick={exportMission}
                            className="btn btn-secondary btn-small"
                            title="Export ISA Report">
                            📄 Export
                        </button>
                        <button
                            onClick={shareMission}
                            className="btn btn-primary btn-small"
                            title="Share Mission">
                            🔗 Share
                        </button>
                        <button
                            onClick={deleteMission}
                            className="btn btn-danger btn-small"
                            title="Delete Mission">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                <div className="mission-meta">
                    <span>
                        Duration: {Math.round(totalDuration / 1000 / 60)}{" "}
                        minutes
                    </span>
                    <span>Events: {events.length}</span>
                    <span>Status: {mission?.status || "Completed"}</span>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="playback-controls">
                <div className="control-buttons">
                    <button
                        onClick={isPlaying ? pausePlayback : startPlayback}
                        className={`control-btn ${
                            isPlaying ? "pause" : "play"
                        }`}>
                        {isPlaying ? "⏸️" : "▶️"}
                    </button>
                    <button onClick={stopPlayback} className="control-btn stop">
                        ⏹️
                    </button>
                </div>

                <div className="speed-control">
                    <label>Speed:</label>
                    <select
                        value={playbackSpeed}
                        onChange={(e) =>
                            setPlaybackSpeed(parseFloat(e.target.value))
                        }>
                        <option value={0.25}>0.25x</option>
                        <option value={0.5}>0.5x</option>
                        <option value={1}>1x</option>
                        <option value={2}>2x</option>
                        <option value={4}>4x</option>
                    </select>
                </div>

                <div className="time-display">
                    {formatTime(currentTime)} / {formatTime(totalDuration)}
                </div>
            </div>

            {/* Timeline */}
            <div className="timeline-container">
                <div className="timeline">
                    <div
                        className="timeline-progress"
                        style={{
                            width: `${(currentTime / totalDuration) * 100}%`,
                        }}
                    />
                    {timelineEvents.map((event) => (
                        <div
                            key={event.id}
                            className={`timeline-marker ${event.eventType} ${
                                currentEventIndex === event.index
                                    ? "active"
                                    : ""
                            }`}
                            style={{ left: `${event.progress}%` }}
                            onClick={() => seekToEvent(event.index)}
                            title={`${event.eventType}: ${new Date(
                                event.timestamp
                            ).toLocaleTimeString()}`}
                        />
                    ))}
                </div>
            </div>

            {/* Event Filters */}
            <div className="event-filters">
                <label>
                    <input
                        type="checkbox"
                        checked={eventFilters.species_detection}
                        onChange={(e) =>
                            setEventFilters((prev) => ({
                                ...prev,
                                species_detection: e.target.checked,
                            }))
                        }
                    />
                    Species Detections
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={eventFilters.isa_violation}
                        onChange={(e) =>
                            setEventFilters((prev) => ({
                                ...prev,
                                isa_violation: e.target.checked,
                            }))
                        }
                    />
                    ISA Violations
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={eventFilters.environmental}
                        onChange={(e) =>
                            setEventFilters((prev) => ({
                                ...prev,
                                environmental: e.target.checked,
                            }))
                        }
                    />
                    Environmental Events
                </label>
            </div>

            {/* AI Inference Overlay */}
            {selectedEvent && (
                <div className="ai-inference-overlay">
                    <div className="overlay-header">
                        <h4>AI Inference Details</h4>
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="close-overlay">
                            ×
                        </button>
                    </div>

                    <div className="inference-content">
                        <div className="event-info">
                            <p>
                                <strong>Time:</strong>{" "}
                                {new Date(
                                    selectedEvent.timestamp
                                ).toLocaleString()}
                            </p>
                            <p>
                                <strong>Location:</strong>{" "}
                                {selectedEvent.lat?.toFixed(6)},{" "}
                                {selectedEvent.lng?.toFixed(6)}
                            </p>
                            <p>
                                <strong>Depth:</strong>{" "}
                                {selectedEvent.depth || "N/A"}m
                            </p>
                        </div>

                        {/* Species Detections */}
                        {selectedEvent.detected_species &&
                            selectedEvent.detected_species.length > 0 && (
                                <div className="species-detections">
                                    <h5>Species Detections</h5>
                                    {selectedEvent.detected_species.map(
                                        (species, index) => (
                                            <div
                                                key={index}
                                                className="species-item">
                                                <div className="species-info">
                                                    <span className="species-name">
                                                        {species.species}
                                                    </span>
                                                    <span className="confidence">
                                                        Confidence:{" "}
                                                        {(
                                                            species.confidence *
                                                            100
                                                        ).toFixed(1)}
                                                        %
                                                    </span>
                                                </div>
                                                {species.bounding_box && (
                                                    <div className="bounding-box-preview">
                                                        <div
                                                            className="bounding-box"
                                                            style={{
                                                                left: `${species.bounding_box.x}px`,
                                                                top: `${species.bounding_box.y}px`,
                                                                width: `${species.bounding_box.width}px`,
                                                                height: `${species.bounding_box.height}px`,
                                                            }}
                                                        />
                                                        <div className="box-label">
                                                            AI Detection Box
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                        {/* ISA Violations */}
                        {selectedEvent.violations &&
                            selectedEvent.violations.length > 0 && (
                                <div className="isa-violations">
                                    <h5>ISA Violations</h5>
                                    {selectedEvent.violations.map(
                                        (violation, index) => (
                                            <div
                                                key={index}
                                                className="violation-item">
                                                <span className="violation-type">
                                                    {violation.type}
                                                </span>
                                                <span className="violation-zone">
                                                    {violation.zone}
                                                </span>
                                                <span
                                                    className={`severity ${violation.severity}`}>
                                                    {violation.severity}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                        {/* Environmental Metrics */}
                        {selectedEvent.metrics &&
                            Object.keys(selectedEvent.metrics).length > 0 && (
                                <div className="environmental-metrics">
                                    <h5>Environmental Metrics</h5>
                                    <div className="metrics-grid">
                                        {Object.entries(
                                            selectedEvent.metrics
                                        ).map(([key, value]) => (
                                            <div key={key} className="metric">
                                                <span className="metric-label">
                                                    {key}
                                                </span>
                                                <span className="metric-value">
                                                    {typeof value === "number"
                                                        ? value.toFixed(2)
                                                        : value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            )}

            {/* Map and Dashboard Layout */}
            <div className="playback-layout">
                {/* Map View */}
                <div className="map-container">
                    <MapContainer
                        center={currentPosition || [30.0, -120.0]}
                        zoom={12}
                        style={{ height: "400px", width: "100%" }}
                        ref={mapRef}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {/* Ocean-focused tile layer for better underwater mission visualization */}
                        <TileLayer
                            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
                            opacity={0.4}
                        />

                        {/* AUV Path */}
                        {auvPath.length > 1 && (
                            <Polyline
                                positions={auvPath}
                                color="#3b82f6"
                                weight={3}
                                opacity={0.7}
                            />
                        )}

                        {/* Current AUV Position */}
                        {currentPosition && (
                            <Marker position={currentPosition} icon={auvIcon}>
                                <Popup>
                                    <div>
                                        <h4>AUV Position</h4>
                                        <p>
                                            Time:{" "}
                                            {currentEvent
                                                ? new Date(
                                                      currentEvent.timestamp
                                                  ).toLocaleTimeString()
                                                : "N/A"}
                                        </p>
                                        <p>
                                            Depth:{" "}
                                            {currentEvent?.depth || "N/A"}m
                                        </p>
                                        <p>
                                            Lat: {currentPosition[0].toFixed(6)}
                                        </p>
                                        <p>
                                            Lng: {currentPosition[1].toFixed(6)}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Event Markers */}
                        {timelineEvents.map((event) => {
                            if (!event.lat || !event.lng) return null;

                            const icon =
                                eventIcons[event.eventType] ||
                                eventIcons.environmental;

                            return (
                                <Marker
                                    key={event.id}
                                    position={[event.lat, event.lng]}
                                    icon={icon}
                                    eventHandlers={{
                                        click: () => setSelectedEvent(event),
                                    }}>
                                    <Popup>
                                        <div>
                                            <h4>
                                                {event.eventType
                                                    .replace("_", " ")
                                                    .toUpperCase()}
                                            </h4>
                                            <p>
                                                Time:{" "}
                                                {new Date(
                                                    event.timestamp
                                                ).toLocaleTimeString()}
                                            </p>
                                            {event.detected_species?.length >
                                                0 && (
                                                <div>
                                                    <p>
                                                        Species:{" "}
                                                        {event.detected_species
                                                            .map(
                                                                (s) => s.species
                                                            )
                                                            .join(", ")}
                                                    </p>
                                                </div>
                                            )}
                                            {event.violations?.length > 0 && (
                                                <div>
                                                    <p>
                                                        Violations:{" "}
                                                        {event.violations
                                                            .map((v) => v.type)
                                                            .join(", ")}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>

                {/* Dashboard Panel */}
                <div className="dashboard-panel">
                    <h3>Current Event</h3>
                    {currentEvent ? (
                        <div className="current-event">
                            <div className="event-time">
                                {new Date(
                                    currentEvent.timestamp
                                ).toLocaleString()}
                            </div>

                            {/* Environmental Metrics */}
                            {currentEvent.metrics &&
                                Object.keys(currentEvent.metrics).length >
                                    0 && (
                                    <div className="metrics-section">
                                        <h4>Environmental Metrics</h4>
                                        <div className="metrics-grid">
                                            {Object.entries(
                                                currentEvent.metrics
                                            ).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="metric">
                                                    <span className="metric-label">
                                                        {key}:
                                                    </span>
                                                    <span className="metric-value">
                                                        {typeof value ===
                                                        "number"
                                                            ? value.toFixed(2)
                                                            : value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {/* Species Detections */}
                            {currentEvent.detected_species &&
                                currentEvent.detected_species.length > 0 && (
                                    <div className="species-section">
                                        <h4>Species Detections</h4>
                                        {currentEvent.detected_species.map(
                                            (species, index) => (
                                                <div
                                                    key={index}
                                                    className="species-item">
                                                    <span className="species-name">
                                                        {species.species}
                                                    </span>
                                                    <span className="confidence">
                                                        {(
                                                            species.confidence *
                                                            100
                                                        ).toFixed(1)}
                                                        %
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                            {/* ISA Violations */}
                            {currentEvent.violations &&
                                currentEvent.violations.length > 0 && (
                                    <div className="violations-section">
                                        <h4>ISA Violations</h4>
                                        {currentEvent.violations.map(
                                            (violation, index) => (
                                                <div
                                                    key={index}
                                                    className="violation-item">
                                                    <span className="violation-type">
                                                        {violation.type}
                                                    </span>
                                                    <span className="severity">
                                                        {violation.severity}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                        </div>
                    ) : (
                        <div className="no-event">No event data available</div>
                    )}
                </div>
            </div>

            {/* Event Timeline */}
            <div className="event-timeline">
                <h3>Event Timeline</h3>
                <div className="timeline-events">
                    {timelineEvents.map((event, index) => (
                        <div
                            key={event.id}
                            className={`timeline-event ${event.eventType} ${
                                currentEventIndex === index ? "active" : ""
                            }`}
                            onClick={() => seekToEvent(index)}>
                            <div className="event-time">
                                {new Date(event.timestamp).toLocaleTimeString()}
                            </div>
                            <div className="event-type">
                                {event.eventType.replace("_", " ")}
                            </div>
                            <div className="event-details">
                                {event.detected_species?.length > 0 && (
                                    <span className="species-count">
                                        {event.detected_species.length} species
                                    </span>
                                )}
                                {event.violations?.length > 0 && (
                                    <span className="violation-count">
                                        {event.violations.length} violations
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Utility function to format time
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
}

export default MissionPlayback;
