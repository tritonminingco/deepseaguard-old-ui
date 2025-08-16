"""
Zone detector: validates that an AUV stays inside its own assigned parcel (zone_id).

Logic:
- For a telemetry row, read telemetry.zone_id and telemetry.geom.
- Lookup the zone geometry by that zone_id.
- If zone or geom missing -> no decision (leave zone_violation as is/null).
- If NOT ST_Contains(allowed.geom, telemetry.geom) -> violation (critical), else clear violation.
"""

from typing import Dict, Optional, Tuple

from sqlalchemy import text

from sqlalchemy.ext.asyncio import AsyncSession
from app.services.alerts_ingest import create_zone_violation_alert

async def _get_telemetry_info(session: AsyncSession, telemetry_id: int) -> Tuple[Optional[str], Optional[str]]:
    """Return (auv_id, zone_id) for a telemetry row."""
    res = await session.execute(text("SELECT auv_id, zone_id FROM telemetry WHERE id = :tid"), {"tid": telemetry_id})
    r = res.first()
    return (r[0], r[1]) if r else (None, None)

async def _update_zone_violation(session: AsyncSession, telemetry_id: int, violation: Optional[str]) -> None:
    """Update the zone violation status for a telemetry row."""
    await session.execute(
        text("UPDATE telemetry SET zone_violation = :v WHERE id = :tid"),
        {"v": violation, "tid": telemetry_id},
    )

async def _is_inside_allowed_zone(session: AsyncSession, telemetry_id: int, zone_id: str) -> Optional[bool]:
    """Return True if telemetry point is inside zone_id geom, False if outside, None if data missing."""
    q = text(
        """
        SELECT ST_Contains(z.geom, t.geom)
        FROM zones z
        JOIN telemetry t ON t.id = :tid
        WHERE z.zone_id = :zid AND z.geom IS NOT NULL AND t.geom IS NOT NULL
        """
    )
    res = await session.execute(q, {"tid": telemetry_id, "zid": zone_id})
    r = res.first()
    if r is None:
        return None
    return bool(r[0])


async def detect_zone_violation(session_factory, telemetry_id: int) -> Optional[Dict]:
    """Return a violation alert if point falls into a restricted/protected zone.

    Uses short-lived sessions with explicit transactions.
    """
    # Phase 1: read auv/zone info and containment decision
    async with session_factory() as rsession:
        auv_id, zone_id = await _get_telemetry_info(rsession, telemetry_id)
        inside = None
        if zone_id:
            inside = await _is_inside_allowed_zone(rsession, telemetry_id, zone_id)

    if zone_id and inside is False:
        # Violation: outside allowed zone
        async with session_factory() as wsession:
            async with wsession.begin():
                await _update_zone_violation(wsession, telemetry_id, "outside")
                if auv_id:
                    alert_id = await create_zone_violation_alert(
                        wsession,
                        auv_id=auv_id,
                        telemetry_id=telemetry_id,
                        zone_id=zone_id,
                    )
        return {
            "type": "zone_violation",
            "violation": "outside",
            "zone_id": zone_id,
            "telemetry_id": telemetry_id,
        }

    if zone_id and inside is True:
        # Explicitly clear any previous violation
        async with session_factory() as nsession:
            async with nsession.begin():
                await _update_zone_violation(nsession, telemetry_id, None)
    # If no zone_id or geometry missing, we skip changes
    return None
