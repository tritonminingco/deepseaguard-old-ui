"""
Telemetry ingestion helper.

Responsibilities:
- Convert incoming telemetry dict into ORM row(s).
- Derive location_wkt from lat/lon if provided.
- After insert, derive PostGIS geom from WKT (server-side) for spatial queries.
- Upsert last_seen into auv_status.

- Geom column is created by migrations; we update it via SQL after flush.
- Keep transaction boundaries at caller; we do not commit here.
"""

from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Telemetry


def wkt_from_latlon(lat: Optional[float], lon: Optional[float]) -> Optional[str]:
    """Return WKT string for a lon/lat point or None if inputs are invalid.

    Inputs are expected as decimal degrees in EPSG:4326 order (lat, lon).
    WKT for PostGIS expects "POINT(lon lat)" ordering.
    """
    if lat is None or lon is None:
        return None
    try:
        return f"POINT({float(lon)} {float(lat)})"
    except (TypeError, ValueError):
        return None


async def ingest_telemetry(session: AsyncSession, telemetry: Dict[str, Any]) -> int:
    """Insert a telemetry record and derive geom from WKT.
        - Input: telemetry dict with keys: auv_id, timestamp (ISO8601), optional location{lat,lon}, depth_m, velocity_knots, temperature_c, turbidity, zone_id
        - Output: inserted telemetry row id (int)
        - On error: raise the exception (caller decides rollback/handling)
    """
    auv_id: str = telemetry.get("auv_id")
    # Parse ISO timestamp into aware datetime
    ts_raw = telemetry.get("timestamp")
    timestamp: datetime = ts_raw if isinstance(ts_raw, datetime) else datetime.fromisoformat(ts_raw)

    # Derive WKT if location provided
    loc = telemetry.get("location") or {}
    location_wkt = telemetry.get("location_wkt") or wkt_from_latlon(loc.get("lat"), loc.get("lon"))

    row = Telemetry(
        auv_id=auv_id,
        timestamp=timestamp,
        zone_id=telemetry.get("zone_id"),
        depth_m=telemetry.get("depth_m"),
        velocity_knots=telemetry.get("velocity_knots"),
        temperature_c=telemetry.get("temperature_c"),
        turbidity=telemetry.get("turbidity"),
        location_wkt=location_wkt,
        raw=telemetry,
        zone_violation=None,
    )
    session.add(row)
    await session.flush()  # obtain row.id

    # Set geom from WKT (if present)
    if location_wkt:
        await session.execute(
            text(
                """
                UPDATE telemetry
                SET geom = ST_GeomFromText(:wkt, 4326)
                WHERE id = :id
                """
            ),
            {"wkt": location_wkt, "id": row.id},
        )

    # Upsert last_seen into auv_status
    await session.execute(
        text(
            """
            INSERT INTO auv_status (auv_id, last_seen)
            VALUES (:auv_id, :last_seen)
            ON CONFLICT (auv_id)
            DO UPDATE SET last_seen = EXCLUDED.last_seen
            """
        ),
        {"auv_id": auv_id, "last_seen": timestamp},
    )

    return row.id
