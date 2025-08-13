import asyncio
import pytest
from datetime import datetime, timezone
import sqlalchemy as sa
from sqlalchemy import text, bindparam
from app.services.db import get_sessionmaker
from app.services.zone_detector import detect_zone_violation

@pytest.mark.asyncio
async def test_detect_zone_violation_inside_and_outside():
    """
    Test zone violation detection for telemetry inside and outside zone_id.
    Assumes zones table has zone_id loaded with a valid geom.
    """
    Session = get_sessionmaker()
    # Coordinates inside zone_id polygon (adjust as needed for your test zone)
    zone_id = "ISA-ZONE-2"
    inside_wkt = "POINT(-125.5 10.5)"  # Should be inside zone_id
    outside_wkt = "POINT(-130.0 15.0)"  # Should be outside zone_id
    now = datetime.now(timezone.utc)

    insert_stmt = text("""
        INSERT INTO telemetry (auv_id, timestamp, zone_id, location_wkt, geom)
        VALUES ('AUV-TEST', :ts, :zone_id, :wkt_txt, ST_GeomFromText(:wkt_geom, 4326))
        RETURNING id
    """).bindparams(
        bindparam("ts"),
        bindparam("zone_id", type_=sa.Text()),
        bindparam("wkt_txt", type_=sa.Text()),   # make both params Text to avoid asyncpg ambiguity
        bindparam("wkt_geom", type_=sa.Text()),
    )

    async with Session() as session:
        async with session.begin():
            res = await session.execute(insert_stmt, {"ts": now, "zone_id":zone_id, "wkt_txt": inside_wkt, "wkt_geom": inside_wkt})
            tid_inside = res.scalar()

    # Should not trigger violation
    result_inside = await detect_zone_violation(Session, tid_inside)
    assert result_inside is None, f"Expected no violation for inside point, got: {result_inside}"

    async with Session() as session:
        async with session.begin():
            # Insert telemetry outside zone
            res = await session.execute(insert_stmt, {"ts": now, "zone_id":zone_id, "wkt_txt": outside_wkt, "wkt_geom": outside_wkt})
            tid_outside = res.scalar()

    # Should trigger violation
    result_outside = await detect_zone_violation(Session, tid_outside)
    assert result_outside is not None, "Expected violation for outside point, got None"
    assert result_outside["violation"] == "outside", f"Expected 'outside' violation, got: {result_outside}"
    assert result_outside["zone_id"] == zone_id
