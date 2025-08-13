from contextlib import asynccontextmanager
import asyncio
import json
from typing import List
from datetime import datetime, timezone
import aiohttp
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from starlette.websockets import WebSocketState

from app.config.settings import TELEMETRY_WS_URL
from app.config.thresholds import ENVIRONMENTAL_THRESHOLDS
from app.services.environmental_monitor import EnvironmentalMonitor
from app.services.db import get_engine, get_sessionmaker
from app.services.telemetry_ingest import ingest_telemetry
from app.services.alerts_ingest import create_environmental_alert
from app.services.zone_detector import detect_zone_violation
from app.services.dead_auv_monitor import dead_auv_scanner
from app.services.insights import fetch_insights, InsightParams, ALERT_TYPES, SUMMARY_MODES_ALLOWED


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize services
    """Start the telemetry monitoring when the application starts"""
    # Prepare DB engine/session factory
    app.state.db_engine = get_engine()
    app.state.db_sessionmaker = get_sessionmaker()
    # Initialize background tasks (DB schema is managed by Alembic; no auto-create)
    asyncio.create_task(monitor_telemetry(app))
    # Dead AUV scanner
    asyncio.create_task(broadcast_dead_auv(app))
    yield
    # Shutdown: Cleanup resources
    print("Shutting down Service...")

app = FastAPI(
    title="DeepSeaGuard Insight Engine",
    description="Real-time monitoring and alert system for AUV operations",
    version="0.1.0",
    lifespan=lifespan
)

# Initialize environmental monitor
env_monitor = EnvironmentalMonitor(ENVIRONMENTAL_THRESHOLDS)


class ConnectionManager:
    """Manages WebSocket connections for broadcasting messages to clients"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
            print(
                f"Client connected. Total connections: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
                print(
                    f"Client disconnected. Remaining connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        async with self._lock:
            disconnected = []
            for connection in self.active_connections:
                try:
                    if connection.client_state == WebSocketState.CONNECTED:
                        await connection.send_json(message)
                except Exception as e:
                    print(f"Error broadcasting to client: {e}")
                    disconnected.append(connection)

            # Clean up disconnected clients
            for conn in disconnected:
                await self.disconnect(conn)


manager = ConnectionManager()


@app.get("/")
async def root():
    return JSONResponse(
        content={"message": "Welcome to DeepSeaGuard Insight Engine"},
        status_code=200
    )


@app.get("/insights", summary="Alerts feed & on-demand summaries", description="""
Retrieve recent alerts with optional filtering and modular summaries.

Examples:
    - Recent alerts (default limit 20): /insights
    - Alerts for one AUV: /insights?auv_id=AUV_1
    - Only environmental alerts: /insights?type=environmental
    - Timeseries (temperature/depth/etc.) for an AUV: /insights?auv_id=AUV_1&summary=true
    - Explicit modes: /insights?auv_id=AUV_1&summary_modes=timeseries,stats
    - Stats only (all AUVs): /insights?summary_modes=stats
    - Longer window: /insights?auv_id=AUV_1&summary_modes=timeseries&window_minutes=120
    - Limit timeseries points: /insights?auv_id=AUV_1&summary_modes=timeseries&timeseries_limit=100
    - Select timeseries fields: /insights?auv_id=AUV_1&summary_modes=timeseries&timeseries_fields=temperature_c,depth_m,locationZ
""")
async def insights(
        auv_id: str | None = Query(
            None, description="Filter alerts by AUV ID or AUV ID specific summaries"),
        type: str | None = Query(None, description="Filter by alert type"),
        limit: int = Query(
            20, ge=1, le=100, description="Max alerts to return (clamped to 100)"),
        summary: bool = Query(
            False, description="Backward compatible: include default timeseries"),
        summary_modes: str | None = Query(
            'timeseries', description="Comma-separated summary modes e.g. timeseries,stats"),
        window_minutes: int = Query(
            20, ge=1, le=1440, description="Summary window size in minutes"),
        timeseries_limit: int = Query(
            30, ge=10, le=200, description="Max telemetry points in timeseries"),
        timeseries_fields: str | None = Query(
            None, description="Comma-separated subset of timeseries fields")
):
    # Validate type
    if type and type not in ALERT_TYPES:
        raise HTTPException(
            status_code=400, detail=f"Invalid type. Allowed: {sorted(ALERT_TYPES)}")
    # Build params
    summary_modes_list = None
    if summary_modes:
        summary_modes_list = [m.strip()
                              for m in summary_modes.split(',') if m.strip()]
        invalid = [
            m for m in summary_modes_list if m not in SUMMARY_MODES_ALLOWED]
        if invalid:
            raise HTTPException(
                status_code=400, detail=f"Invalid summary_modes {invalid}. Allowed: {sorted(SUMMARY_MODES_ALLOWED)}")

    ts_fields_list = None
    if timeseries_fields:
        ts_fields_list = [f.strip()
                          for f in timeseries_fields.split(',') if f.strip()]
    params = InsightParams(
        auv_id=auv_id,
        type=type,
        limit=limit,
        summary=summary,
        summary_modes=summary_modes_list,
        window_minutes=window_minutes,
        timeseries_limit=timeseries_limit,
        timeseries_fields=ts_fields_list,
    )
    data = await fetch_insights(app.state.db_sessionmaker, params)
    return JSONResponse(content=data, status_code=200)


@app.websocket("/ws/alert")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for clients to receive Alerts
    """
    await manager.connect(websocket)
    try:
        while True:
            try:
                data = await websocket.receive_json()
                # Echo back received data with timestamp
                await websocket.send_json({
                    "type": "echo",
                    "data": data,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.close(code=1011)  # Internal error
        await manager.disconnect(websocket)


async def monitor_telemetry(app: FastAPI):
    """
    Background task to monitor External telemetry Data and generate alerts
    """
    reconnect_delay = 5  # Reconnect delay

    async def process_telemetry(telemetry: dict):
        """Ingest telemetry data and Process to check for alerts"""
        # 1) Persist to DB using ORM session
        tid = None  # telemetry ID
        try:
            Session = app.state.db_sessionmaker
            async with Session() as session:
                async with session.begin():
                    tid = await ingest_telemetry(session, telemetry)
        except Exception as e:
            print(f"DB insert error: {e}")

        # 2) Environmental Thresholds alerts
        if alert := env_monitor.check_thresholds(telemetry):
            # persist alert into DB
            try:
                Session = app.state.db_sessionmaker
                async with Session() as session:
                    async with session.begin():
                        await create_environmental_alert(
                            session,
                            auv_id=telemetry.get("auv_id"),
                            payload=alert,
                            telemetry_id=tid,
                        )
            except Exception as e:
                print(f"Env alert DB error: {e}")

            # broadcast alert to clients
            await manager.broadcast({
                "type": "environmental_alert",
                "data": alert,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            print(f"Env alert: {alert}")

        # 3) Zone detection (requires DB id)
        try:
            if tid is not None:
                z = await detect_zone_violation(app.state.db_sessionmaker, tid)
                if z:
                    await manager.broadcast({
                        "type": "zone_alert",
                        "data": z,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                    print(f"Zone alert: {z}")
        except Exception as e:
            print(f"Zone detection error: {e}")

    # Keep Listening to TELEMETRY WS URL
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.ws_connect(
                    TELEMETRY_WS_URL,
                    heartbeat=30,  # Enable heartbeat every 30 seconds
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as ws:
                    print("Connected to mock telemetry websocket")

                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            print(f"Received message: {msg.data}")
                            try:
                                telemetry = json.loads(msg.data)
                                # Process Telemetry Data for Alerts
                                await process_telemetry(telemetry)
                            except json.JSONDecodeError as e:
                                print(f"Invalid JSON received: {e}")
                        elif msg.type == aiohttp.WSMsgType.ERROR:
                            print(f"WebSocket error: {ws.exception()}")
                            break
                        elif msg.type == aiohttp.WSMsgType.CLOSED:
                            print("WebSocket connection closed")
                            break

        except aiohttp.ClientError as e:
            print(f"Connection error: {e}")
        except Exception as e:
            print(f"Unexpected error: {e}")

        print("Reconnecting to telemetry WebSocket...")
        await asyncio.sleep(reconnect_delay)


async def broadcast_dead_auv(app: FastAPI):
    """Background task to scan and broadcast dead AUV alerts."""
    Session = app.state.db_sessionmaker
    async for alert in dead_auv_scanner(Session):
        await manager.broadcast({
            "type": "dead_auv_alert",
            "data": alert,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        print(f"Dead AUV alert: {alert}")
