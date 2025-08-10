// =========================
// DeepSeaGuard Main App Component
// =========================
// This file serves as the main entry point for the DeepSeaGuard frontend application.
// It initializes the dashboard, manages global state, and renders all major components.

// Import React and necessary hooks for state management and lifecycle methods
import { useEffect, useState } from "react";

// Import custom components for the dashboard
import AlertFilterPanel from "./components/AlertFilterPanel";
import AuvCommandConsole from "./components/AuvCommandConsole";
import AuvMissionTimeline from "./components/AuvMissionTimeline";
import ComplianceRuleDrawer from "./components/ComplianceRuleDrawer";
import EnhancedAlertSystem from "./components/EnhancedAlertSystem";
import ExportCenter from "./components/ExportCenter";
import IsaRegulationReferencePanel from "./components/IsaRegulationReferencePanel";
import MissionPlayback from "./components/MissionPlayback";
import MissionSelector from "./components/MissionSelector";
import SpeciesDetectionPanel from "./components/SpeciesDetectionPanel";
import SystemHealthPanel from "./components/SystemHealthPanel";
import UserManagementPanel from "./components/UserManagementPanel";

// Import utility functions and services
import fathomNetWS from "./utils/fathomNetWebSocket";
import webSocketService from "./utils/webSocketService";

// Import styles and libraries
import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from "chart.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Line } from "react-chartjs-2";
import {
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
} from "react-leaflet";
import "./index.css";
import AlertFeed from "./components/AlertFeed";

// Register chart.js components for data visualization
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

/**
 * Main App Component
 *
 * This component serves as the root of the DeepSeaGuard dashboard application.
 * It manages global state, WebSocket connections, and renders all major panels.
 */
function App() {
    // --- Core application state ---
    // WebSocket connection status (e.g., connected, disconnected)
    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    // Currently selected AUV (Autonomous Underwater Vehicle) for all panels
    const [selectedAUV, setSelectedAUV] = useState("AUV-001");
    // Time frame for data panels (e.g., live, 1h, 24h)
    const [timeFrame, setTimeFrame] = useState("live");
    // All AUV data keyed by AUV ID
    const [auvData, setAuvData] = useState({});
    // List of recent alerts for the alert system
    const [alerts, setAlerts] = useState([]);
    // Timestamp of last telemetry update
    const [lastUpdate, setLastUpdate] = useState(null);
    // Event log for system and user actions
    const [eventLog, setEventLog] = useState([]);
    // Dark mode state (synced to localStorage)
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("dsg-dark-mode") === "true";
    });
    // Telemetry chart state: rolling window of telemetry for the selected AUV
    const [telemetryHistory, setTelemetryHistory] = useState({});
    const telemetryWindow = 60; // seconds

    // Modal state for export/settings/profile
    const [modal, setModal] = useState(null); // { type: 'telemetry'|'environmental'|'compliance'|'settings'|'profile', data: any }

    // Enhanced Alert System state
    const [showEnhancedAlerts, setShowEnhancedAlerts] = useState(false);

    const [displayAlertFeed, setDisplayAlertFeed] = useState(false)

    // --- Demo state for new dashboard features ---
    // Filtered alerts for AlertFilterPanel
    const [filteredAlerts, setFilteredAlerts] = useState([]);
    // Selected compliance rule for drawer
    const [selectedRule, setSelectedRule] = useState(null);
    // Drawer open/close state
    const [drawerOpen, setDrawerOpen] = useState(false);
    // Demo missions for AUV Mission Timeline
    const [demoMissions] = useState([
        {
            id: 1,
            auvId: "AUV-001",
            start: Date.now() - 3600 * 1000,
            end: null,
            status: "active",
            description: "Seafloor Mapping",
        },
        {
            id: 2,
            auvId: "AUV-002",
            start: Date.now() - 7200 * 1000,
            end: Date.now() - 3600 * 1000,
            status: "completed",
            description: "Sample Collection",
        },
    ]);
    // Demo system health for SystemHealthPanel
    const [demoHealth] = useState({
        backend: "online",
        api: "online",
        db: "active",
        ws: "connected",
        latency: 42,
    });
    // Demo users for UserManagementPanel
    const [demoUsers, setDemoUsers] = useState([
        { id: 1, name: "Scientist", role: "Scientist", active: true },
        {
            id: 2,
            name: "Compliance Officer",
            role: "Compliance",
            active: false,
        },
        { id: 3, name: "Operator", role: "Operator", active: false },
    ]);

    // Mission Playback state
    const [selectedMissionId, setSelectedMissionId] = useState(null);
    const [showMissionPlayback, setShowMissionPlayback] = useState(false);

    // --- Effects ---
    // Sync dark mode with localStorage and body class
    useEffect(() => {
        document.body.classList.toggle("dark-mode", darkMode);
        localStorage.setItem("dsg-dark-mode", darkMode);
    }, [darkMode]);

    // --- Helper: Add a new event to the event log ---
    const addEvent = (message, type, payload) => {
        setEventLog((prev) => [
            { timestamp: new Date(), message, type, payload },
            ...prev.slice(0, 199),
        ]);
    };

    // --- WebSocket connection and event listeners ---
    useEffect(() => {
        // On connect, update status and log event
        const handleConnect = () => {
            setConnectionStatus("connected");
            addEvent("System connected to backend", "system");
        };
        // On disconnect, update status and log event
        const handleDisconnect = () => {
            setConnectionStatus("disconnected");
            addEvent("System disconnected from backend", "system");
        };
        // On telemetry update, update AUV data and telemetry history
        const handleTelemetry = (data) => {
            setAuvData((prev) => ({ ...prev, [data.auv_id]: data }));
            setLastUpdate(new Date());
            addEvent(`Telemetry update for ${data.auv_id}`, "telemetry", data);
            // Update telemetry history for charting
            setTelemetryHistory((prev) => {
                const auvId = data.auv_id;
                const prevArr = prev[auvId] || [];
                const now = Date.now();
                const newEntry = {
                    timestamp: now,
                    depth: data.position?.depth ?? null,
                    battery: data.operational?.battery_level ?? null,
                    speed: data.operational?.speed ?? null,
                    temperature: data.environmental?.temperature ?? null,
                    latitude: data.position?.latitude ?? null,
                    longitude: data.position?.longitude ?? null,
                };
                // Keep only the last N seconds of data
                const filtered = [...prevArr, newEntry].filter(
                    (e) => now - e.timestamp <= telemetryWindow * 1000
                );
                return { ...prev, [auvId]: filtered };
            });
        };
        // On alert, update alerts and log event
        const handleAlert = (alert) => {
            setAlerts((prev) => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
            addEvent(`Alert: ${alert.message}`, "alert", alert);

            // Auto-show enhanced alert system for species alerts
            if (alert.species) {
                setShowEnhancedAlerts(true);
            }
        };

        // Connect and subscribe to events
        webSocketService.connect("http://localhost:3000");
        webSocketService.on("connect", handleConnect);
        webSocketService.on("disconnect", handleDisconnect);
        webSocketService.on("telemetry_update", handleTelemetry);
        webSocketService.on("alert", handleAlert);

        // Set up FathomNet species alert handling
        const unsubscribeSpeciesAlert = fathomNetWS.onSpeciesAlert(handleAlert);

        // Cleanup on unmount
        return () => {
            webSocketService.off("connect", handleConnect);
            webSocketService.off("disconnect", handleDisconnect);
            webSocketService.off("telemetry_update", handleTelemetry);
            webSocketService.off("alert", handleAlert);
            unsubscribeSpeciesAlert();
            webSocketService.disconnect();
        };
        // eslint-disable-next-line
    }, []);

    // --- Derived state for current AUV and telemetry ---
    const currentAUV = auvData[selectedAUV];
    const currentTelemetry = telemetryHistory[selectedAUV] || [];

    // --- Handlers for new dashboard features ---
    // Filter alerts by search, severity, or AUV
    const handleAlertFilter = ({ search, severity, auv }) => {
        let result = alerts;
        if (search)
            result = result.filter((a) =>
                a.message.toLowerCase().includes(search.toLowerCase())
            );
        if (severity) result = result.filter((a) => a.severity === severity);
        if (auv) result = result.filter((a) => a.auv_id === auv);
        setFilteredAlerts(result);
    };
    // Switch active user in demo mode
    const handleUserSwitch = (user) => {
        setDemoUsers((users) =>
            users.map((u) => ({ ...u, active: u.id === user.id }))
        );
    };
    // Simulate AUV command
    const handleAuvCommand = (cmd) => {
        addEvent(`AUV Command: ${cmd}`, "system");
    };
    // Simulate export action
    const handleExport = (type) => {
        // Map export type to backend endpoint and file type
        let endpoint = "";
        let filename = "";
        let filetype = "csv";
        switch (type) {
            case "telemetry":
                endpoint = "/export/telemetry";
                filename = "telemetry.csv";
                break;
            case "environmental":
                endpoint = "/export/environmental";
                filename = "environmental.csv";
                break;
            case "compliance":
                endpoint = "/export/compliance";
                filename = "compliance.csv";
                break;
            case "eventlog":
                endpoint = "/export/eventlog";
                filename = "eventlog.csv";
                break;
            case "all":
                endpoint = "/export/all";
                filename = "deepseaguard_export.json";
                filetype = "json";
                break;
            default:
                return;
        }

        // Download file from backend
        fetch(window.apiClient?.API_CONFIG?.baseUrl + endpoint, {
            method: "GET",
            headers: {
                Authorization: window.apiClient?.getAuthToken
                    ? `Bearer ${window.apiClient.getAuthToken()}`
                    : undefined,
            },
        })
            .then(async (res) => {
                if (!res.ok) throw new Error("Export failed");
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                addEvent(`Exported ${type} data`, "system");
            })
            .catch((err) => {
                addEvent(`Export failed: ${type}`, "error", err);
                alert("Export failed. Please try again.");
            });
    };
    // Open compliance rule drawer
    const handleRuleClick = (rule) => {
        setSelectedRule(rule);
        setDrawerOpen(true);
    };
    // Close compliance rule drawer
    const handleDrawerClose = () => setDrawerOpen(false);

    // --- Main render ---
    return (
        <div className={`scientific-workstation${darkMode ? " dark" : ""}`}>
            {/* Mission Playback System */}
            {showMissionPlayback ? (
                <div className="mission-playback-container">
                    <div className="playback-header">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                if (selectedMissionId) {
                                    // If we're viewing a mission, go back to mission list
                                    setSelectedMissionId(null);
                                } else {
                                    // If we're in mission list, go back to dashboard
                                    setShowMissionPlayback(false);
                                }
                            }}>
                            {selectedMissionId
                                ? "← Back to Mission List"
                                : "← Back to Dashboard"}
                        </button>
                        <h2>Mission Playback</h2>
                    </div>
                    {selectedMissionId ? (
                        <MissionPlayback
                            selectedMissionId={selectedMissionId}
                            onMissionDeleted={(missionId) => {
                                setSelectedMissionId(null);
                            }}
                        />
                    ) : (
                        <MissionSelector
                            onMissionSelect={(missionId) => {
                                setSelectedMissionId(missionId);
                            }}
                            selectedMissionId={selectedMissionId}
                        />
                    )}
                </div>
            ) : (
                <>
                    {/* Top Status Bar + Profile/Settings */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}>
                        <StatusBar
                            connectionStatus={connectionStatus}
                            lastUpdate={lastUpdate}
                            alertCount={alerts.length}
                        />
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                marginRight: 16,
                            }}>
                            <button
                                className="btn"
                                aria-label="User Profile"
                                onClick={() => setModal({ type: "profile" })}>
                                <span role="img" aria-label="profile">
                                    👤
                                </span>
                            </button>
                            <button
                                className="btn"
                                aria-label="Settings"
                                onClick={() => setModal({ type: "settings" })}>
                                <span role="img" aria-label="settings">
                                    ⚙️
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Header with Mission Playback Button */}
                    <div className="dashboard-header">
                        <h1>DeepSeaGuard Dashboard</h1> <span style={{ cursor: "pointer" }} onClick={() => setDisplayAlertFeed(true)}>Test alert feed</span>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowMissionPlayback(true)}>
                            🎯 Mission Playback
                        </button>
                    </div>

                    {/* Main Workstation Layout */}
                    <div className="workstation-layout">
                        {/* Left Sidebar - AUV Selection & System Status */}
                        <div className="sidebar-left">
                            <AUVSelector
                                auvData={auvData}
                                selectedAUV={selectedAUV}
                                onSelect={setSelectedAUV}
                            />
                            <SystemStatus connectionStatus={connectionStatus} />
                            <AlertPanel
                                alerts={alerts}
                                onShowDetails={() =>
                                    setShowEnhancedAlerts(true)
                                }
                            />
                        </div>

                        {/* Center - Map & Visualization */}
                        <div className="main-display">
                            {displayAlertFeed ? <AlertFeed /> : <MapDisplay
                                auvData={auvData}
                                selectedAUV={selectedAUV}
                                onAUVSelect={setSelectedAUV}
                                telemetryHistory={telemetryHistory}
                            />}
                            <TimeControls
                                timeFrame={timeFrame}
                                onTimeFrameChange={setTimeFrame}
                            />
                            {/* Event Log Panel */}
                            <EventLogPanel eventLog={eventLog} />
                        </div>

                        {/* Right Sidebar - All Data and Demo Panels */}
                        <div
                            className="sidebar-right"
                            style={{ maxWidth: 400 }}>
                            {/* FathomNet Species Detection Panel */}
                            <SpeciesDetectionPanel />

                            {/* New Functional Panels (Demo) */}
                            <AlertFilterPanel
                                alerts={alerts}
                                onFilter={handleAlertFilter}
                            />
                            <AuvMissionTimeline
                                missions={demoMissions}
                                selectedAUV={selectedAUV}
                            />
                            <ExportCenter onExport={handleExport} />
                            <UserManagementPanel
                                users={demoUsers}
                                onSwitch={handleUserSwitch}
                            />
                            <SystemHealthPanel health={demoHealth} />
                            <button
                                className="btn w-full"
                                style={{ margin: "12px 0" }}
                                onClick={() => setConfigModalOpen(true)}>
                                Configure AUVs & ISA Rules
                            </button>
                            <AuvCommandConsole onCommand={handleAuvCommand} />
                            <IsaRegulationReferencePanel
                                onRuleClick={handleRuleClick}
                            />
                            {/* Existing panels for Telemetry, Environmental, Compliance, etc. */}
                            <TelemetryPanel
                                auv={currentAUV}
                                onExport={() =>
                                    setModal({
                                        type: "telemetry",
                                        data: currentAUV,
                                    })
                                }
                            />
                            <TelemetryChartPanel
                                telemetry={currentTelemetry}
                                darkMode={darkMode}
                            />
                            <EnvironmentalPanel
                                auv={currentAUV}
                                onExport={() =>
                                    setModal({
                                        type: "environmental",
                                        data: currentAUV,
                                    })
                                }
                            />
                            <CompliancePanel
                                auv={currentAUV}
                                onExport={() =>
                                    setModal({
                                        type: "compliance",
                                        data: currentAUV,
                                    })
                                }
                            />
                        </div>
                    </div>
                    {/* Compliance Rule Drawer (demo) */}
                    <ComplianceRuleDrawer
                        rule={selectedRule}
                        open={drawerOpen}
                        onClose={handleDrawerClose}
                    />

                    {/* Enhanced Alert System with FathomNet Integration */}
                    {showEnhancedAlerts && (
                        <EnhancedAlertSystem
                            alerts={alerts}
                            onClose={() => setShowEnhancedAlerts(false)}
                            onDismiss={(alertId) => {
                                setAlerts((prev) =>
                                    prev.filter((alert) => alert.id !== alertId)
                                );
                            }}
                        />
                    )}

                    {/* Dark Mode Toggle */}
                    <DarkModeToggle
                        darkMode={darkMode}
                        setDarkMode={setDarkMode}
                    />

                    {/* Modal Overlay */}
                    {modal && (
                        <Modal
                            modal={modal}
                            onClose={() => setModal(null)}
                            darkMode={darkMode}
                        />
                    )}
                </>
            )}
        </div>
    );
}

// --- Place this at the end of the file, after all other components ---
function TelemetryChartPanel({ telemetry, darkMode }) {
    // Prepare chart data
    const labels = telemetry.map((e) =>
        new Date(e.timestamp).toLocaleTimeString()
    );
    const depthData = telemetry.map((e) => e.depth);
    const batteryData = telemetry.map((e) => e.battery);
    const speedData = telemetry.map((e) => e.speed);
    const tempData = telemetry.map((e) => e.temperature);

    const chartData = {
        labels,
        datasets: [
            {
                label: "Depth (m)",
                data: depthData,
                borderColor: "#3b82f6",
                backgroundColor: "rgba(59,130,246,0.2)",
                yAxisID: "y",
                spanGaps: true,
            },
            {
                label: "Battery (%)",
                data: batteryData,
                borderColor: "#f59e42",
                backgroundColor: "rgba(245,158,66,0.2)",
                yAxisID: "y1",
                spanGaps: true,
            },
            {
                label: "Speed (m/s)",
                data: speedData,
                borderColor: "#10b981",
                backgroundColor: "rgba(16,185,129,0.2)",
                yAxisID: "y2",
                spanGaps: true,
            },
            {
                label: "Temp (°C)",
                data: tempData,
                borderColor: "#f43f5e",
                backgroundColor: "rgba(244,63,94,0.2)",
                yAxisID: "y3",
                spanGaps: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: darkMode ? "#f8fafc" : "#0f172a",
                },
            },
            title: {
                display: true,
                text: "AUV Telemetry Trends (last 60s)",
                color: darkMode ? "#f8fafc" : "#0f172a",
                font: { size: 16 },
            },
            tooltip: {
                mode: "index",
                intersect: false,
            },
        },
        interaction: {
            mode: "nearest",
            intersect: false,
        },
        scales: {
            x: {
                ticks: { color: darkMode ? "#f8fafc" : "#0f172a" },
                grid: { color: darkMode ? "#334155" : "#e5e7eb" },
            },
            y: {
                type: "linear",
                display: true,
                position: "left",
                title: {
                    display: true,
                    text: "Depth (m)",
                    color: darkMode ? "#f8fafc" : "#0f172a",
                },
                ticks: { color: darkMode ? "#f8fafc" : "#0f172a" },
                grid: { color: darkMode ? "#334155" : "#e5e7eb" },
            },
            y1: {
                type: "linear",
                display: true,
                position: "right",
                title: {
                    display: true,
                    text: "Battery (%)",
                    color: darkMode ? "#f8fafc" : "#0f172a",
                },
                grid: { drawOnChartArea: false },
                ticks: { color: darkMode ? "#f8fafc" : "#0f172a" },
            },
            y2: {
                type: "linear",
                display: false,
                position: "right",
                title: {
                    display: true,
                    text: "Speed (m/s)",
                    color: darkMode ? "#f8fafc" : "#0f172a",
                },
                grid: { drawOnChartArea: false },
                ticks: { color: darkMode ? "#f8fafc" : "#0f172a" },
            },
            y3: {
                type: "linear",
                display: false,
                position: "right",
                title: {
                    display: true,
                    text: "Temp (°C)",
                    color: darkMode ? "#f8fafc" : "#0f172a",
                },
                grid: { drawOnChartArea: false },
                ticks: { color: darkMode ? "#f8fafc" : "#0f172a" },
            },
        },
    };

    return (
        <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-header">
                <h3 className="panel-title">Telemetry Chart</h3>
            </div>
            <div className="panel-body" style={{ height: 220 }}>
                {telemetry.length < 2 ? (
                    <div className="no-data">
                        <span className="data-label">NO CHART DATA</span>
                    </div>
                ) : (
                    <Line
                        data={chartData}
                        options={chartOptions}
                        height={180}
                    />
                )}
            </div>
        </div>
    );
}
// Dark Mode Toggle Component
function DarkModeToggle({ darkMode, setDarkMode }) {
    return (
        <button
            className={`btn btn-primary`}
            style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}
            onClick={() => setDarkMode((d) => !d)}
            aria-label="Toggle dark mode">
            {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
    );
}

// Event Log Panel Component
function EventLogPanel({ eventLog }) {
    return (
        <div
            className="panel"
            style={{ marginTop: 16, maxHeight: 220, overflowY: "auto" }}>
            <div className="panel-header">
                <h3 className="panel-title">Event Log</h3>
            </div>
            <div
                className="panel-body"
                style={{
                    fontSize: "0.8em",
                    maxHeight: 160,
                    overflowY: "auto",
                }}>
                {eventLog.length === 0 ? (
                    <div className="no-data">
                        <span className="data-label">NO EVENTS</span>
                    </div>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {eventLog.slice(0, 30).map((evt, idx) => (
                            <li key={idx} style={{ marginBottom: 4 }}>
                                <span
                                    style={{
                                        color: "#94a3b8",
                                        fontFamily: "monospace",
                                        marginRight: 8,
                                    }}>
                                    {evt.timestamp.toLocaleTimeString
                                        ? evt.timestamp.toLocaleTimeString()
                                        : new Date(
                                              evt.timestamp
                                          ).toLocaleTimeString()}
                                </span>
                                <span
                                    style={{
                                        color:
                                            evt.type === "alert"
                                                ? "#dc2626"
                                                : evt.type === "system"
                                                ? "#06b6d4"
                                                : "#f8fafc",
                                    }}>
                                    {evt.message}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

// Status Bar Component
function StatusBar({ connectionStatus, lastUpdate, alertCount }) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="status-bar">
            <div className="status-section">
                <div className={`status-indicator status-${connectionStatus}`}>
                    <div className="status-dot"></div>
                    <span>SYSTEM {connectionStatus.toUpperCase()}</span>
                </div>
            </div>

            <div className="status-section">
                <span className="data-label">UTC TIME</span>
                <span className="data-value">
                    {currentTime.toISOString().slice(0, 19)}Z
                </span>
            </div>

            <div className="status-section">
                <span className="data-label">LAST UPDATE</span>
                <span className="data-value">
                    {lastUpdate
                        ? `${Math.floor((Date.now() - lastUpdate) / 1000)}s ago`
                        : "N/A"}
                </span>
            </div>

            <div className="status-section">
                <span className="data-label">ALERTS</span>
                <span
                    className={`data-value ${
                        alertCount > 0 ? "text-warning" : ""
                    }`}>
                    {alertCount}
                </span>
            </div>

            <div className="status-section">
                <span className="data-label">DEEPSEAGUARD v2.1.0</span>
            </div>
        </div>
    );
}

// AUV Selector Component
function AUVSelector({ auvData, selectedAUV, onSelect }) {
    const auvList = Object.keys(auvData).sort();

    return (
        <div className="panel">
            <div className="panel-header">
                <h3 className="panel-title">AUV Fleet Status</h3>
            </div>
            <div className="panel-body">
                <div className="auv-list">
                    {auvList.map((auvId) => {
                        const auv = auvData[auvId];
                        const isSelected = auvId === selectedAUV;
                        const batteryLevel =
                            auv?.operational?.battery_level || 0;
                        const status = auv
                            ? batteryLevel > 40
                                ? "normal"
                                : batteryLevel > 20
                                ? "warning"
                                : "critical"
                            : "offline";

                        return (
                            <div
                                key={auvId}
                                className={`auv-item ${
                                    isSelected ? "selected" : ""
                                }`}
                                onClick={() => onSelect(auvId)}>
                                <div className="auv-header">
                                    <div
                                        className={`status-indicator status-${status}`}>
                                        <div className="status-dot"></div>
                                        <span className="auv-id">{auvId}</span>
                                    </div>
                                    <span className="data-value">
                                        {batteryLevel.toFixed(1)}%
                                    </span>
                                </div>
                                {auv && (
                                    <div className="auv-details">
                                        <div className="data-row">
                                            <span className="data-label">
                                                DEPTH
                                            </span>
                                            <span className="data-value">
                                                {auv.position?.depth?.toFixed(
                                                    0
                                                ) || "N/A"}{" "}
                                                <span className="data-unit">
                                                    m
                                                </span>
                                            </span>
                                        </div>
                                        <div className="data-row">
                                            <span className="data-label">
                                                MISSION
                                            </span>
                                            <span className="data-value">
                                                {auv.operational?.mission_progress?.toFixed(
                                                    0
                                                ) || "N/A"}
                                                %
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// System Status Component
function SystemStatus({ connectionStatus }) {
    return (
        <div className="panel">
            <div className="panel-header">
                <h3 className="panel-title">System Status</h3>
            </div>
            <div className="panel-body">
                <div className="data-grid data-grid-2">
                    <div className="data-cell">
                        <span className="data-label">WEBSOCKET</span>
                        <div
                            className={`status-indicator status-${connectionStatus}`}>
                            <div className="status-dot"></div>
                            <span className="data-value">
                                {connectionStatus.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">API</span>
                        <div className="status-indicator status-normal">
                            <div className="status-dot"></div>
                            <span className="data-value">ONLINE</span>
                        </div>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">DATABASE</span>
                        <div className="status-indicator status-normal">
                            <div className="status-dot"></div>
                            <span className="data-value">ACTIVE</span>
                        </div>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">COMPLIANCE</span>
                        <div className="status-indicator status-normal">
                            <div className="status-dot"></div>
                            <span className="data-value">MONITORING</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Alert Panel Component
function AlertPanel({ alerts, onShowDetails }) {
    return (
        <div className="panel">
            <div
                className="panel-header"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                <h3 className="panel-title">Recent Alerts</h3>
                <button
                    className="btn btn-sm"
                    onClick={onShowDetails}
                    title="View detailed alerts">
                    🔍
                </button>
            </div>
            <div className="panel-body">
                <div className="alert-list">
                    {alerts.length === 0 ? (
                        <div className="no-alerts">
                            <span className="data-label">NO ACTIVE ALERTS</span>
                        </div>
                    ) : (
                        alerts.slice(0, 5).map((alert, index) => (
                            <div
                                key={index}
                                className={`alert-item alert-${
                                    alert.severity || "info"
                                }`}>
                                <div className="alert-header">
                                    <span className="alert-time">
                                        {new Date(
                                            alert.timestamp
                                        ).toLocaleTimeString()}
                                    </span>
                                    <span
                                        className={`alert-severity severity-${alert.severity}`}>
                                        {alert.severity?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="alert-message">
                                    {alert.message}
                                    {alert.species && (
                                        <div className="species-badge">
                                            🐙 {alert.species}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Map Display Component (react-leaflet powered)
function MapDisplay({ auvData, selectedAUV, onAUVSelect, telemetryHistory }) {
    // Default map center: Clarion-Clipperton Zone
    const defaultCenter = [-12.6457, -78.9713];
    // Try to center on selected AUV if available
    const selected = auvData[selectedAUV];
    const selectedPos =
        selected &&
        selected.position &&
        selected.position.latitude &&
        selected.position.longitude
            ? [selected.position.latitude, selected.position.longitude]
            : defaultCenter;

    // Build AUV markers
    const auvMarkers = Object.entries(auvData).map(([auvId, auv]) => {
        if (
            !auv.position ||
            typeof auv.position.latitude !== "number" ||
            typeof auv.position.longitude !== "number"
        )
            return null;
        const isSelected = auvId === selectedAUV;
        // Custom marker icon for selected
        const icon = L.divIcon({
            className: isSelected ? "auv-marker selected" : "auv-marker",
            html: `<div style="background:${
                isSelected ? "#3b82f6" : "#334155"
            };color:#fff;padding:2px 6px;border-radius:6px;font-size:0.9em;border:2px solid ${
                isSelected ? "#f59e42" : "#64748b"
            };">${auvId}</div>`,
        });
        return (
            <Marker
                key={auvId}
                position={[auv.position.latitude, auv.position.longitude]}
                icon={icon}
                eventHandlers={{ click: () => onAUVSelect(auvId) }}>
                <Popup>
                    <div style={{ minWidth: 120 }}>
                        <div>
                            <b>{auvId}</b>
                        </div>
                        <div>Lat: {auv.position.latitude.toFixed(5)}</div>
                        <div>Lon: {auv.position.longitude.toFixed(5)}</div>
                        <div>
                            Depth: {auv.position.depth?.toFixed(0) ?? "N/A"} m
                        </div>
                    </div>
                </Popup>
            </Marker>
        );
    });

    // Draw tracks for all AUVs using telemetryHistory
    // Each track is a Polyline of [lat, lon] pairs
    const tracks = Object.entries(telemetryHistory || {}).map(
        ([auvId, history]) => {
            const latlngs = history
                .map((e) =>
                    typeof e.latitude === "number" &&
                    typeof e.longitude === "number"
                        ? [e.latitude, e.longitude]
                        : null
                )
                .filter(Boolean);
            if (latlngs.length < 2) return null;
            return (
                <Polyline
                    key={auvId}
                    positions={latlngs}
                    color={auvId === selectedAUV ? "#3b82f6" : "#f59e42"}
                    weight={auvId === selectedAUV ? 4 : 2}
                    opacity={0.7}
                />
            );
        }
    );

    return (
        <div className="map-container">
            <div className="map-header">
                <h3 className="panel-title">
                    Clarion-Clipperton Zone - Live Operations
                </h3>
                <div className="map-controls">
                    <button
                        className="btn btn-primary"
                        title="Layer controls (future)">
                        LAYERS
                    </button>
                    <button className="btn" title="Zoom to fit (future)">
                        ZOOM FIT
                    </button>
                    <button className="btn" title="Export map (future)">
                        EXPORT
                    </button>
                </div>
            </div>
            <div
                className="map-display"
                style={{
                    height: 320,
                    width: "100%",
                    borderRadius: 12,
                    overflow: "hidden",
                    margin: "0 auto",
                }}>
                <MapContainer
                    center={selectedPos}
                    zoom={6}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {tracks}
                    {auvMarkers}
                </MapContainer>
            </div>
        </div>
    );
}

// Time Controls Component
function TimeControls({ timeFrame, onTimeFrameChange }) {
    const timeFrames = [
        { value: "live", label: "LIVE" },
        { value: "1h", label: "1H" },
        { value: "6h", label: "6H" },
        { value: "24h", label: "24H" },
        { value: "7d", label: "7D" },
    ];

    return (
        <div className="time-controls">
            <span className="data-label">TIME FRAME</span>
            <div className="time-frame-buttons">
                {timeFrames.map((tf) => (
                    <button
                        key={tf.value}
                        className={`btn ${
                            timeFrame === tf.value ? "btn-primary" : ""
                        }`}
                        onClick={() => onTimeFrameChange(tf.value)}>
                        {tf.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Telemetry Panel Component
function TelemetryPanel({ auv, onExport }) {
    if (!auv) {
        return (
            <div className="panel">
                <div className="panel-header">
                    <h3 className="panel-title">Telemetry Data</h3>
                </div>
                <div className="panel-body">
                    <div className="no-data">
                        <span className="data-label">NO AUV SELECTED</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="panel">
            <div
                className="panel-header"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                <h3 className="panel-title">Telemetry - {auv.auv_id}</h3>
                <button
                    className="btn btn-sm"
                    onClick={onExport}
                    title="Export Telemetry">
                    <span role="img" aria-label="export">
                        📤
                    </span>
                </button>
            </div>
            <div className="panel-body">
                <div className="data-grid data-grid-2">
                    <div className="data-cell">
                        <span className="data-label">LATITUDE</span>
                        <span className="data-value font-mono">
                            {auv.position?.latitude?.toFixed(6) || "N/A"}°
                        </span>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">LONGITUDE</span>
                        <span className="data-value font-mono">
                            {auv.position?.longitude?.toFixed(6) || "N/A"}°
                        </span>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">DEPTH</span>
                        <span className="data-value font-mono">
                            {auv.position?.depth?.toFixed(1) || "N/A"}{" "}
                            <span className="data-unit">m</span>
                        </span>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">HEADING</span>
                        <span className="data-value font-mono">
                            {auv.operational?.heading?.toFixed(1) || "N/A"}°{" "}
                            <span className="data-unit">T</span>
                        </span>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">SPEED</span>
                        <span className="data-value font-mono">
                            {auv.operational?.speed?.toFixed(2) || "N/A"}{" "}
                            <span className="data-unit">m/s</span>
                        </span>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">BATTERY</span>
                        <span className="data-value font-mono">
                            {auv.operational?.battery_level?.toFixed(1) ||
                                "N/A"}
                            %
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Environmental Panel Component
function EnvironmentalPanel({ auv, onExport }) {
    if (!auv) {
        return (
            <div className="panel">
                <div className="panel-header">
                    <h3 className="panel-title">Environmental Data</h3>
                </div>
                <div className="panel-body">
                    <div className="no-data">
                        <span className="data-label">NO DATA AVAILABLE</span>
                    </div>
                </div>
            </div>
        );
    }

    const env = auv.environmental || {};

    return (
        <div className="panel">
            <div
                className="panel-header"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                <h3 className="panel-title">Environmental Sensors</h3>
                <button
                    className="btn btn-sm"
                    onClick={onExport}
                    title="Export Environmental">
                    <span role="img" aria-label="export">
                        📤
                    </span>
                </button>
            </div>
            <div className="panel-body">
                <div className="data-grid data-grid-2">
                    <div className="data-cell">
                        <span className="data-label">TEMPERATURE</span>
                        <span className="data-value font-mono">
                            {env.temperature?.toFixed(2) || "N/A"}{" "}
                            <span className="data-unit">°C</span>
                        </span>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">SALINITY</span>
                        <span className="data-value font-mono">
                            {env.salinity?.toFixed(2) || "N/A"}{" "}
                            <span className="data-unit">PSU</span>
                        </span>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">DISSOLVED O₂</span>
                        <span className="data-value font-mono">
                            {env.dissolved_oxygen?.toFixed(2) || "N/A"}{" "}
                            <span className="data-unit">mg/L</span>
                        </span>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">pH LEVEL</span>
                        <span className="data-value font-mono">
                            {env.ph?.toFixed(2) || "N/A"}
                        </span>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">TURBIDITY</span>
                        <span className="data-value font-mono">
                            {env.turbidity?.toFixed(2) || "N/A"}{" "}
                            <span className="data-unit">NTU</span>
                        </span>
                    </div>
                    <div className="data-cell">
                        <span className="data-label">PRESSURE</span>
                        <span className="data-value font-mono">
                            {env.pressure?.toFixed(1) || "N/A"}{" "}
                            <span className="data-unit">bar</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Compliance Panel Component
function CompliancePanel({ auv, onExport }) {
    if (!auv) {
        return (
            <div className="panel">
                <div className="panel-header">
                    <h3 className="panel-title">ISA Compliance</h3>
                </div>
                <div className="panel-body">
                    <div className="no-data">
                        <span className="data-label">NO COMPLIANCE DATA</span>
                    </div>
                </div>
            </div>
        );
    }

    const compliance = auv.compliance || {};
    const sedimentLevel = auv.environmental?.sediment_level || 0;
    const sedimentStatus =
        sedimentLevel > 25
            ? "critical"
            : sedimentLevel > 20
            ? "warning"
            : "normal";

    return (
        <div className="panel">
            <div
                className="panel-header"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                <h3 className="panel-title">ISA Compliance Status</h3>
                <button
                    className="btn btn-sm"
                    onClick={onExport}
                    title="Export Compliance">
                    <span role="img" aria-label="export">
                        📤
                    </span>
                </button>
            </div>
            <div className="panel-body">
                <div className="compliance-rules">
                    <div className="compliance-rule">
                        <div className="rule-header">
                            <span className="rule-id">ISA-ENV-1</span>
                            <div
                                className={`status-indicator status-${sedimentStatus}`}>
                                <div className="status-dot"></div>
                                <span>{sedimentStatus.toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="rule-details">
                            <span className="data-label">
                                SEDIMENT DISCHARGE
                            </span>
                            <span className="data-value font-mono">
                                {sedimentLevel.toFixed(1)} / 25.0{" "}
                                <span className="data-unit">mg/L</span>
                            </span>
                        </div>
                    </div>

                    <div className="compliance-rule">
                        <div className="rule-header">
                            <span className="rule-id">ISA-ENV-2</span>
                            <div className="status-indicator status-normal">
                                <div className="status-dot"></div>
                                <span>NORMAL</span>
                            </div>
                        </div>
                        <div className="rule-details">
                            <span className="data-label">
                                SENSITIVE ZONE TIME
                            </span>
                            <span className="data-value font-mono">
                                0 / 120 <span className="data-unit">min</span>
                            </span>
                        </div>
                    </div>

                    <div className="compliance-rule">
                        <div className="rule-header">
                            <span className="rule-id">ISA-OPS-1</span>
                            <div className="status-indicator status-normal">
                                <div className="status-dot"></div>
                                <span>NORMAL</span>
                            </div>
                        </div>
                        <div className="rule-details">
                            <span className="data-label">
                                OPERATIONAL DEPTH
                            </span>
                            <span className="data-value font-mono">
                                {auv.position?.depth?.toFixed(0) || "N/A"} /
                                3000 <span className="data-unit">m</span>
                            </span>
                        </div>
                    </div>
                </div>
                <div className="compliance-actions">
                    <button className="btn btn-primary w-full">
                        GENERATE ISA REPORT
                    </button>
                    <button className="btn w-full">
                        EXPORT COMPLIANCE DATA
                    </button>
                </div>
            </div>
        </div>
    );
}

// Modal Component
function Modal({ modal, onClose, darkMode }) {
    let title = "";
    let content = null;
    switch (modal.type) {
        case "telemetry":
            title = "Export Telemetry Data";
            content = (
                <pre style={{ fontSize: 12, maxHeight: 300, overflow: "auto" }}>
                    {JSON.stringify(modal.data, null, 2)}
                </pre>
            );
            break;
        case "environmental":
            title = "Export Environmental Data";
            content = (
                <pre style={{ fontSize: 12, maxHeight: 300, overflow: "auto" }}>
                    {JSON.stringify(modal.data?.environmental, null, 2)}
                </pre>
            );
            break;
        case "compliance":
            title = "Export Compliance Data";
            content = (
                <pre style={{ fontSize: 12, maxHeight: 300, overflow: "auto" }}>
                    {JSON.stringify(modal.data?.compliance, null, 2)}
                </pre>
            );
            break;
        case "settings":
            title = "Settings";
            content = (
                <div>
                    <p>Settings panel (future):</p>
                    <ul>
                        <li>
                            Theme: <b>{darkMode ? "Dark" : "Light"}</b>
                        </li>
                    </ul>
                </div>
            );
            break;
        case "profile":
            title = "User Profile";
            content = (
                <div>
                    <p>User profile panel (future):</p>
                    <ul>
                        <li>
                            Name: <b>Scientist</b>
                        </li>
                    </ul>
                </div>
            );
            break;
        default:
            title = "Modal";
            content = <div>Unknown modal type.</div>;
    }
    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: darkMode
                    ? "rgba(15,23,42,0.85)"
                    : "rgba(0,0,0,0.25)",
                zIndex: 2000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
            <div
                style={{
                    background: darkMode ? "#1e293b" : "#fff",
                    color: darkMode ? "#f8fafc" : "#0f172a",
                    borderRadius: 8,
                    minWidth: 320,
                    maxWidth: 480,
                    boxShadow: "0 4px 32px #0003",
                    padding: 24,
                }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                    }}>
                    <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
                    <button
                        className="btn btn-sm"
                        onClick={onClose}
                        style={{ fontSize: 18, marginLeft: 8 }}>
                        ✖️
                    </button>
                </div>
                <div>{content}</div>
            </div>
        </div>
    );
}
export default App;
