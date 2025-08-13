"""Insights service: alerts feed + modular summaries.

- Alerts: simple limited list with optional filters (auv_id, type).
- Summaries: selected via summary_modes (timeseries, stats).

Note: No pagination yet.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

ALERT_TYPES = {"environmental", "zone_violation", "dead_auv"}
SUMMARY_MODES_ALLOWED = {"timeseries", "stats"}
TIMESERIES_ALLOWED_FIELDS = {"temperature_c",
                             "depth_m", "velocity_knots", "location"}


@dataclass
class InsightParams:
    auv_id: Optional[str] = None
    type: Optional[str] = None
    limit: int = 20
    summary: bool = False  # backward compatibility; if true implies timeseries
    summary_modes: Optional[List[str]] = [
        "timeseries"]  # e.g. ["timeseries","stats"]
    window_minutes: int = 20  # window for applicable summaries
    timeseries_limit: int = 30  # max telemetry points returned
    timeseries_fields: Optional[List[str]] = None  # subset of allowed fields


def _parse_point_wkt(wkt: Optional[str]) -> Optional[Tuple[float, float]]:
    if not wkt:
        return None
    w = wkt.strip()
    if not w.upper().startswith("POINT(") or not w.endswith(")"):
        return None
    inner = w[w.find("(") + 1: -1]
    parts = inner.replace(",", " ").split()
    if len(parts) != 2:
        return None
    try:
        lon = float(parts[0])
        lat = float(parts[1])
        return lon, lat
    except ValueError:
        return None


async def fetch_insights(session_factory: async_sessionmaker[AsyncSession], insight_params: InsightParams) -> Dict[str, Any]:
    """Return recent alerts plus optional summaries."""
    # Clamp limits
    insight_params.limit = max(1, min(insight_params.limit, 100))
    insight_params.timeseries_limit = max(
        10, min(insight_params.timeseries_limit, 200))

    # Derive active modes
    modes: List[str] = []
    if insight_params.summary_modes:
        for m in insight_params.summary_modes:
            if m not in modes:
                modes.append(m)
    modes = [m for m in modes if m in SUMMARY_MODES_ALLOWED]

    # Alerts list
    filters: List[str] = []
    params: Dict[str, Any] = {"limit": insight_params.limit}
    if insight_params.auv_id:
        filters.append("auv_id = :auv_id")
        params["auv_id"] = insight_params.auv_id
    if insight_params.type:
        filters.append("type = :type")
        params["type"] = insight_params.type
    where_clause = ("WHERE " + " AND ".join(filters)) if filters else ""
    sql = text(
        f"""
        SELECT auv_id, type, severity, status, message, started_at
        FROM alerts
        {where_clause}
        ORDER BY started_at DESC, id DESC
        LIMIT :limit
        """
    )

    alerts: List[Dict[str, Any]] = []
    async with session_factory() as session:
        res = await session.execute(sql, params)
        for r in res.fetchall():
            alerts.append(
                {
                    "auv_id": r.auv_id,
                    "type": r.type,
                    "severity": r.severity,
                    "status": r.status,
                    "message": r.message,
                    "started_at": r.started_at.isoformat() if r.started_at else None,
                }
            )

    out: Dict[str, Any] = {"alerts": alerts}
    if not insight_params.summary:
        return out

    summaries: Dict[str, Any] = {}
    window_start = datetime.now(timezone.utc) - \
        timedelta(minutes=insight_params.window_minutes)

    # Timeseries summary
    if "timeseries" in modes:
        if not insight_params.auv_id:
            summaries["timeseries_error"] = "timeseries summary requires auv_id"
        else:
            if insight_params.timeseries_fields:
                requested_fields: Iterable[str] = [
                    f for f in insight_params.timeseries_fields if f in TIMESERIES_ALLOWED_FIELDS]
            else:
                requested_fields = list(TIMESERIES_ALLOWED_FIELDS)
            ts_sql = text(
                """
                SELECT timestamp, temperature_c, depth_m, velocity_knots, location_wkt
                FROM telemetry
                WHERE auv_id = :auv_id AND timestamp >= :window_start
                ORDER BY timestamp ASC
                LIMIT :ts_limit
                """
            )
            ts_params = {
                "auv_id": insight_params.auv_id,
                "window_start": window_start,
                "ts_limit": insight_params.timeseries_limit,
            }
            points: List[Dict[str, Any]] = []
            async with session_factory() as session:
                res_ts = await session.execute(ts_sql, ts_params)
                for row in res_ts.fetchall():
                    ll = _parse_point_wkt(row.location_wkt)
                    loc = {"lon": ll[0], "lat": ll[1]} if ll else None
                    pt: Dict[str, Any] = {
                        "timestamp": row.timestamp.isoformat() if row.timestamp else None}
                    if "temperature_c" in requested_fields:
                        pt["temperature_c"] = row.temperature_c
                    if "depth_m" in requested_fields:
                        pt["depth_m"] = row.depth_m
                    if "velocity_knots" in requested_fields:
                        pt["velocity_knots"] = row.velocity_knots
                    if "location" in requested_fields:
                        pt["location"] = loc
                    points.append(pt)
            summaries["timeseries"] = {
                "auv_id": insight_params.auv_id,
                "window_minutes": insight_params.window_minutes,
                "fields": list(requested_fields),
                "points": points,
                "count": len(points),
            }

    # Stats summary
    if "stats" in modes:
        stats_filters: List[str] = []
        stats_params: Dict[str, Any] = {"window_start": window_start}
        if insight_params.auv_id:
            stats_filters.append("auv_id = :auv_id")
            stats_params["auv_id"] = insight_params.auv_id
        if insight_params.type:
            stats_filters.append("type = :type")
            stats_params["type"] = insight_params.type
        stats_where = ("WHERE " + " AND ".join(stats_filters)
                       ) if stats_filters else ""
        stats_sql = text(
            f"""
            SELECT
              COUNT(*) AS total_alerts,
              MAX(started_at) AS latest_alert,
              SUM(CASE WHEN started_at >= :window_start THEN 1 ELSE 0 END) AS alerts_in_window
            FROM alerts
            {stats_where}
            """
        )
        by_type_sql = text(
            f"""
            SELECT type, COUNT(*) AS c
            FROM alerts
            {stats_where}
            GROUP BY type
            """
        )
        async with session_factory() as session:
            res_stats = await session.execute(stats_sql, stats_params)
            row_s = res_stats.first()
            res_bt = await session.execute(by_type_sql, stats_params)
            alerts_by_type = {r.type: r.c for r in res_bt.fetchall()}
        summaries["stats"] = {
            "window_minutes": insight_params.window_minutes,
            "total_alerts": (row_s.total_alerts if row_s else 0),
            "alerts_in_window": (row_s.alerts_in_window if row_s else 0),
            "latest_alert_timestamp": row_s.latest_alert.isoformat() if row_s and row_s.latest_alert else None,
            "alerts_by_type": alerts_by_type,
        }

    out["summaries"] = summaries
    return out
