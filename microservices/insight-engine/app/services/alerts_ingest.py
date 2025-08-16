"""
Alert creation helpers (unified).

Features:
- Generic create_alert with optional de-duplication.
- Specialized wrappers for environmental, zone_violation, dead_auv.
"""
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Alert


def _derive_severity(alerts: List[Dict[str, Any]]) -> str:
    """Derive overall severity from a list of parameter alerts."""
    if any(a.get("severity") == "critical" for a in alerts):
        return "critical"
    if any(a.get("severity") == "warning" for a in alerts):
        return "warning"
    return "info"


def _build_message(alerts: List[Dict[str, Any]]) -> str:
    """Build a short human readable message from parameter alerts."""
    if not alerts:
        return "environmental ok"
    parts = []
    for a in alerts:
        param = a.get("parameter")
        sev = a.get("severity")
        val = a.get("value")
        parts.append(f"{param}={val}({sev})")
    return ", ".join(parts)


async def create_alert(
    session: AsyncSession,
    *,
    auv_id: str,
    type: str,
    severity: str,
    message: str,
    payload: Dict[str, Any],
    status: str = "active",
    telemetry_id: Optional[int] = None,
    dedupe: bool = True,
) -> int:
    """Create an alert row (with optional de-duplication).
    If dedupe is True and an active alert with same (auv_id, type) exists,
    returns its id instead of inserting a new one.

    Returns: alert id (existing or new).
    """
    if dedupe:
        existing_id = await session.scalar(
            select(Alert.id).where(
                Alert.auv_id == auv_id,
                Alert.type == type,
                Alert.status == "active",
            )
        )
        if existing_id is not None:
            return existing_id

    row = Alert(
        auv_id=auv_id,
        type=type,
        severity=severity,
        message=message,
        payload=payload,
        status=status,
    )
    # Optionally store telemetry reference inside payload only for now
    if telemetry_id is not None and "telemetry_id" not in row.payload:
        row.payload["telemetry_id"] = telemetry_id

    session.add(row)
    await session.flush()
    return row.id


async def create_environmental_alert(
    session: AsyncSession,
    *,
    auv_id: str,
    payload: Dict[str, Any],
    telemetry_id: Optional[int] = None,
) -> int:
    """Create (or reuse) an environmental alert for an AUV."""
    alerts: List[Dict[str, Any]] = payload.get("alerts", [])
    severity = _derive_severity(alerts)
    message = _build_message(alerts)
    full_payload = dict(payload)
    if telemetry_id is not None:
        full_payload["telemetry_id"] = telemetry_id
    return await create_alert(
        session,
        auv_id=auv_id,
        type="environmental",
        severity=severity,
        message=message,
        payload=full_payload,
        telemetry_id=telemetry_id,
        dedupe=True,  # prevent spamming same active alert
    )


async def create_zone_violation_alert(
    session: AsyncSession,
    *,
    auv_id: str,
    telemetry_id: int,
    zone_id: str,
) -> int:
    """Create (or reuse) a zone violation alert when AUV outside its parcel."""
    payload = {
        "zone_id": zone_id,
        "violation": "outside",
        "telemetry_id": telemetry_id,
    }
    message = f"AUV {auv_id} outside allowed zone {zone_id}"
    return await create_alert(
        session,
        auv_id=auv_id,
        type="zone_violation",
        severity="critical",
        message=message,
        payload=payload,
        telemetry_id=telemetry_id,
        dedupe=True,
    )


async def create_dead_auv_alert_generic(
    session: AsyncSession,
    *,
    auv_id: str,
    last_seen_iso: str,
    threshold_seconds: int,
) -> int:
    """Create (or reuse) a dead AUV alert."""
    payload = {
        "last_seen": last_seen_iso,
        "threshold_seconds": threshold_seconds,
    }
    message = f"AUV {auv_id} silent beyond {threshold_seconds}s"
    return await create_alert(
        session,
        auv_id=auv_id,
        type="dead_auv",
        severity="critical",
        message=message,
        payload=payload,
        dedupe=True,
    )