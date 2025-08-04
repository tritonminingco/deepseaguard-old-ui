import React, { useState, useEffect } from "react";
import { apiClient } from "../config/api";
import "../styles/MissionSelector.css";

function MissionSelector({ onMissionSelect, selectedMissionId }) {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creatingMission, setCreatingMission] = useState(false);
    const [newMissionData, setNewMissionData] = useState({
        auv_id: "AUV-001",
        description: "",
        start_time: new Date().toISOString().slice(0, 16),
        duration_hours: 1,
        event_count: 60,
        include_species_detections: true,
        include_isa_violations: true,
        include_environmental_events: true,
    });

    // Load available missions
    const loadMissions = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get("/api/missions");
            setMissions(response.data.missions || []);
            setLoading(false);
        } catch (err) {
            console.error("Error loading missions:", err);
            setError("Failed to load missions");
            setLoading(false);
        }
    };

    // Load missions on mount
    useEffect(() => {
        loadMissions();
    }, []);

    // Create new mission
    const createMission = async (e) => {
        e.preventDefault();

        // Validate form data
        if (!newMissionData.description.trim()) {
            setError("Please enter a mission description");
            return;
        }

        if (
            newMissionData.duration_hours <= 0 ||
            newMissionData.duration_hours > 24
        ) {
            setError("Duration must be between 0.1 and 24 hours");
            return;
        }

        if (
            newMissionData.event_count < 10 ||
            newMissionData.event_count > 1000
        ) {
            setError("Event count must be between 10 and 1000");
            return;
        }

        try {
            setError(null);
            setCreatingMission(true);
            const missionId = `mission-${Date.now()}`;
            const startTime = new Date(newMissionData.start_time);
            const durationMs = newMissionData.duration_hours * 60 * 60 * 1000; // Convert hours to milliseconds
            const eventInterval = durationMs / newMissionData.event_count; // Time between events

            // Parse selected AUVs - handle both single and multiple AUVs
            let selectedAUVs;
            if (newMissionData.auv_id.includes(",")) {
                // Multiple AUVs selected
                selectedAUVs = newMissionData.auv_id
                    .split(",")
                    .filter((id) => id.trim());
            } else {
                // Single AUV selected
                selectedAUVs = [newMissionData.auv_id];
            }

            // Validate that at least one AUV is selected
            if (selectedAUVs.length === 0) {
                setError("Please select at least one AUV");
                return;
            }

            // Generate events for the full duration, distributed across AUVs
            const totalEvents = newMissionData.event_count;
            const eventsPerAUV = Math.ceil(totalEvents / selectedAUVs.length);

            for (let i = 0; i < totalEvents; i++) {
                const timestamp = new Date(
                    startTime.getTime() + i * eventInterval
                );
                const progress = i / totalEvents;

                // Distribute events among AUVs across the full duration
                const auvIndex = i % selectedAUVs.length;
                const auvId = selectedAUVs[auvIndex];

                // Simulate AUV movement in different patterns for each AUV
                const angle = progress * 2 * Math.PI + (auvIndex * Math.PI) / 3;
                const radius = 0.03 + auvIndex * 0.01; // Larger radius for better visibility
                const centerLat = 30.0 + auvIndex * 0.01; // Open Pacific Ocean (far from land)
                const centerLng = -120.0 + auvIndex * 0.01;

                const lat = centerLat + radius * Math.cos(angle);
                const lng = centerLng + radius * Math.sin(angle);
                const depth = 50 + Math.sin(angle * 3) * 20 + auvIndex * 10;

                // Generate environmental metrics
                const metrics = newMissionData.include_environmental_events
                    ? {
                          temperature:
                              15 + Math.sin(angle) * 2 + auvIndex * 0.5,
                          salinity: 35 + Math.cos(angle) * 0.5,
                          pressure: 1000 + depth * 10,
                          oxygen: 8 + Math.sin(angle * 2) * 1,
                      }
                    : {};

                // Generate species detections
                const detected_species = [];
                if (
                    newMissionData.include_species_detections &&
                    (i % 10 === 0 || i === 15 || i === 35)
                ) {
                    detected_species.push({
                        species: "Blue Whale",
                        confidence: 0.85 + Math.random() * 0.1,
                        bounding_box: {
                            x: 100,
                            y: 150,
                            width: 200,
                            height: 100,
                        },
                    });
                }

                // Generate ISA violations
                const violations = [];
                if (
                    newMissionData.include_isa_violations &&
                    (i % 15 === 0 || i === 25 || i === 45)
                ) {
                    violations.push({
                        type: "ISA_ZONE_ENTRY",
                        zone: "Protected Marine Area",
                        severity: "warning",
                    });
                }

                const eventData = {
                    auv_id: auvId,
                    timestamp: timestamp.toISOString(),
                    lat: lat,
                    lng: lng,
                    depth: depth,
                    mission_id: missionId,
                    metrics,
                    detected_species,
                    violations,
                };

                await apiClient.post("/api/missions/ingest", eventData);
            }

            // Reset form and reload missions
            setNewMissionData({
                auv_id: "AUV-001",
                description: "",
                start_time: new Date().toISOString().slice(0, 16),
                duration_hours: 1,
                event_count: 60,
                include_species_detections: true,
                include_isa_violations: true,
                include_environmental_events: true,
            });
            setError(null);
            setCreatingMission(false);
            setShowCreateForm(false);
            loadMissions();

            // Select the new mission
            onMissionSelect(missionId);
        } catch (err) {
            console.error("Error creating mission:", err);
            setError("Failed to create mission");
            setCreatingMission(false);
        }
    };

    // Generate demo mission data
    const generateDemoMission = async () => {
        try {
            const missionId = `demo-mission-${Date.now()}`;
            const auvId = "AUV-001";
            const startTime = new Date(Date.now() - 3600000); // 1 hour ago

            // Generate 60 events over 1 hour
            for (let i = 0; i < 60; i++) {
                const timestamp = new Date(startTime.getTime() + i * 60000);
                const progress = i / 60;

                // Simulate AUV movement in a circular pattern
                const angle = progress * 2 * Math.PI;
                const radius = 0.03; // Larger radius for better visibility
                const centerLat = 30.0; // Open Pacific Ocean (far from land)
                const centerLng = -120.0;

                const lat = centerLat + radius * Math.cos(angle);
                const lng = centerLng + radius * Math.sin(angle);
                const depth = 50 + Math.sin(angle * 3) * 20;

                const eventData = {
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
                    eventData.detected_species = [
                        {
                            species: "Blue Whale",
                            confidence: 0.85 + Math.random() * 0.1,
                            bounding_box: {
                                x: 100,
                                y: 150,
                                width: 200,
                                height: 100,
                            },
                        },
                    ];
                }

                // Add ISA violations at specific points
                if (i === 25 || i === 45) {
                    eventData.violations = [
                        {
                            type: "ISA_ZONE_ENTRY",
                            zone: "Protected Marine Area",
                            severity: "warning",
                        },
                    ];
                }

                await apiClient.post("/api/missions/ingest", eventData);
            }

            loadMissions();
            onMissionSelect(missionId);
        } catch (err) {
            console.error("Error generating demo mission:", err);
            setError("Failed to generate demo mission");
        }
    };

    // Export mission as ISA report
    const exportMission = async (missionId) => {
        try {
            const response = await apiClient.get(
                `/api/missions/${missionId}/export`
            );

            // Create and download the file
            const blob = new Blob([JSON.stringify(response.data, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `mission-${missionId}-isa-report.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error exporting mission:", err);
            setError("Failed to export mission");
        }
    };

    // Delete mission
    const deleteMission = async (missionId, missionName) => {
        if (
            !window.confirm(
                `Are you sure you want to delete mission "${missionName}"? This action cannot be undone.`
            )
        ) {
            return;
        }

        try {
            await apiClient.delete(`/api/missions/${missionId}`);

            // Reload missions list
            loadMissions();

            // If the deleted mission was selected, clear selection
            if (selectedMissionId === missionId) {
                onMissionSelect(null);
            }

            setError(null);
        } catch (err) {
            console.error("Error deleting mission:", err);
            setError("Failed to delete mission");
        }
    };

    if (loading) {
        return (
            <div className="mission-selector">
                <div className="loading">Loading missions...</div>
            </div>
        );
    }

    return (
        <div className="mission-selector">
            <div className="selector-header">
                <h3>Mission Playback</h3>
                <div className="header-actions">
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="btn btn-secondary">
                        {showCreateForm ? "Cancel" : "New Mission"}
                    </button>
                    <button
                        onClick={generateDemoMission}
                        className="btn btn-primary">
                        Generate Demo
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="close-error">
                        ×
                    </button>
                </div>
            )}

            {/* Create Mission Form */}
            {showCreateForm && (
                <div className="create-mission-form">
                    <h4>Create New Mission</h4>
                    <form onSubmit={createMission}>
                        <div className="form-group">
                            <label>AUV Selection:</label>
                            <div className="auv-selection">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={newMissionData.auv_id.includes(
                                            "AUV-001"
                                        )}
                                        onChange={(e) => {
                                            const auvs = newMissionData.auv_id
                                                .split(",")
                                                .filter((id) => id.trim());
                                            if (e.target.checked) {
                                                auvs.push("AUV-001");
                                            } else {
                                                const index =
                                                    auvs.indexOf("AUV-001");
                                                if (index > -1)
                                                    auvs.splice(index, 1);
                                            }
                                            setNewMissionData((prev) => ({
                                                ...prev,
                                                auv_id: auvs.join(","),
                                            }));
                                        }}
                                    />
                                    AUV-001
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={newMissionData.auv_id.includes(
                                            "AUV-002"
                                        )}
                                        onChange={(e) => {
                                            const auvs = newMissionData.auv_id
                                                .split(",")
                                                .filter((id) => id.trim());
                                            if (e.target.checked) {
                                                auvs.push("AUV-002");
                                            } else {
                                                const index =
                                                    auvs.indexOf("AUV-002");
                                                if (index > -1)
                                                    auvs.splice(index, 1);
                                            }
                                            setNewMissionData((prev) => ({
                                                ...prev,
                                                auv_id: auvs.join(","),
                                            }));
                                        }}
                                    />
                                    AUV-002
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={newMissionData.auv_id.includes(
                                            "AUV-003"
                                        )}
                                        onChange={(e) => {
                                            const auvs = newMissionData.auv_id
                                                .split(",")
                                                .filter((id) => id.trim());
                                            if (e.target.checked) {
                                                auvs.push("AUV-003");
                                            } else {
                                                const index =
                                                    auvs.indexOf("AUV-003");
                                                if (index > -1)
                                                    auvs.splice(index, 1);
                                            }
                                            setNewMissionData((prev) => ({
                                                ...prev,
                                                auv_id: auvs.join(","),
                                            }));
                                        }}
                                    />
                                    AUV-003
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description:</label>
                            <input
                                type="text"
                                value={newMissionData.description}
                                onChange={(e) =>
                                    setNewMissionData((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                placeholder="Mission description"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Start Time:</label>
                            <input
                                type="datetime-local"
                                value={newMissionData.start_time}
                                onChange={(e) =>
                                    setNewMissionData((prev) => ({
                                        ...prev,
                                        start_time: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Duration (hours):</label>
                                <input
                                    type="number"
                                    min="0.1"
                                    max="24"
                                    step="0.1"
                                    value={newMissionData.duration_hours}
                                    onChange={(e) =>
                                        setNewMissionData((prev) => ({
                                            ...prev,
                                            duration_hours: parseFloat(
                                                e.target.value
                                            ),
                                        }))
                                    }
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Number of Events:</label>
                                <input
                                    type="number"
                                    min="10"
                                    max="1000"
                                    step="10"
                                    value={newMissionData.event_count}
                                    onChange={(e) =>
                                        setNewMissionData((prev) => ({
                                            ...prev,
                                            event_count: parseInt(
                                                e.target.value
                                            ),
                                        }))
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={
                                        newMissionData.include_species_detections
                                    }
                                    onChange={(e) =>
                                        setNewMissionData((prev) => ({
                                            ...prev,
                                            include_species_detections:
                                                e.target.checked,
                                        }))
                                    }
                                />
                                Include Species Detections
                            </label>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={
                                        newMissionData.include_isa_violations
                                    }
                                    onChange={(e) =>
                                        setNewMissionData((prev) => ({
                                            ...prev,
                                            include_isa_violations:
                                                e.target.checked,
                                        }))
                                    }
                                />
                                Include ISA Violations
                            </label>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={
                                        newMissionData.include_environmental_events
                                    }
                                    onChange={(e) =>
                                        setNewMissionData((prev) => ({
                                            ...prev,
                                            include_environmental_events:
                                                e.target.checked,
                                        }))
                                    }
                                />
                                Include Environmental Events
                            </label>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={creatingMission}>
                                {creatingMission
                                    ? "Creating Mission..."
                                    : "Create Mission"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="btn btn-secondary"
                                disabled={creatingMission}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Mission List */}
            <div className="mission-list">
                <h4>Available Missions</h4>
                {missions.length === 0 ? (
                    <div className="no-missions">
                        <p>
                            No missions available. Create a new mission or
                            generate a demo.
                        </p>
                    </div>
                ) : (
                    <div className="missions-grid">
                        {missions.map((mission) => (
                            <div
                                key={mission.id}
                                className={`mission-card ${
                                    selectedMissionId === mission.id
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() => onMissionSelect(mission.id)}>
                                <div className="mission-info">
                                    <h5>{mission.auv_id}</h5>
                                    <p className="mission-id">
                                        ID: {mission.id}
                                    </p>
                                    <p className="mission-stats">
                                        Events: {mission.event_count || 0}
                                    </p>
                                    <p className="mission-time">
                                        {new Date(
                                            mission.start_time
                                        ).toLocaleDateString()}{" "}
                                        -{" "}
                                        {new Date(
                                            mission.end_time
                                        ).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="mission-actions">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            exportMission(mission.id);
                                        }}
                                        className="btn btn-small btn-secondary"
                                        title="Export ISA Report">
                                        📄
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteMission(
                                                mission.id,
                                                mission.auv_id
                                            );
                                        }}
                                        className="btn btn-small btn-danger"
                                        title="Delete Mission">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MissionSelector;
