"""
Load GeoJSON polygons into the zones table (SRID=4326), upserting by zone_id.

Usage (examples):
  python scripts/load_zones.py /path/to/mapCircle.geojson --prefix ISA-ZONE-TEST --kind restricted
  python scripts/load_zones.py randomShapeMap.geojson --prefix ISA-ZONE --start 1 --name-from-file

Notes:
- Accepts FeatureCollection or single Feature (Polygon/MultiPolygon).
- For each feature, computes geom from GeoJSON, sets SRID=4326, stores geom and geom_wkt.
- Upsert on zone_id (INSERT ... ON CONFLICT (zone_id) DO UPDATE ...).
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Make 'app' importable when running as a script
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from app.services.db import get_sessionmaker  # noqa: E402


def _iter_features(doc: Dict[str, Any]):
    """Yield GeoJSON Feature dicts from a FeatureCollection/Feature/Geometry doc."""
    t = (doc.get("type") or "").lower()
    if t == "featurecollection":
        for feat in doc.get("features", []) or []:
            if isinstance(feat, dict):
                yield feat
    elif t == "feature":
        yield doc
    else:
        # Treat raw geometry as one feature
        yield {"type": "Feature", "properties": {}, "geometry": doc}


async def _upsert_zone(
    session: AsyncSession,
    *,
    zone_id: str,
    name: str,
    kind: str,
    geometry: Dict[str, Any],
    srid: int = 4326,
) -> None:
    """Insert or update a single zone from a geometry dict."""
    geom_json = json.dumps(geometry)
    sql = text(
        """
        WITH g AS (
          SELECT ST_SetSRID(ST_MakeValid(ST_GeomFromGeoJSON(:geom_json)), :srid) AS geom
        )
        INSERT INTO zones (zone_id, name, geom_wkt, kind, geom)
        SELECT :zone_id, :name, ST_AsText(geom), :kind, geom
        FROM g
        ON CONFLICT (zone_id) DO UPDATE
        SET name = EXCLUDED.name,
            geom_wkt = EXCLUDED.geom_wkt,
            kind = EXCLUDED.kind,
            geom = EXCLUDED.geom
        """
    )
    await session.execute(
        sql,
        {"geom_json": geom_json, "srid": srid, "zone_id": zone_id, "name": name, "kind": kind},
    )


async def load_file(
    session: AsyncSession,
    file_path: Path,
    *,
    prefix: str,
    start: int,
    kind: str,
    name_from_file: bool,
) -> int:
    """Load a .geojson file into zones. Returns number of zones upserted."""
    doc = json.loads(file_path.read_text())
    count = 0
    idx = start
    for feat in _iter_features(doc):
        geom = feat.get("geometry")
        if not geom:
            continue
        props = feat.get("properties") or {}
        # Allow explicit zone_id in properties if provided
        zone_id = props.get("zone_id") or f"{prefix}-{idx}"
        name = (f"{file_path.stem}-{idx}" if name_from_file else props.get("name") or zone_id)
        await _upsert_zone(session, zone_id=zone_id, name=name, kind=kind, geometry=geom)
        count += 1
        idx += 1
    return count


async def amain(args: argparse.Namespace) -> None:
    Session = get_sessionmaker()
    total = 0
    for fp in args.files:
        p = Path(fp)
        if not p.exists():
            print(f"[load_zones] Skip missing file: {p}")
            continue
        async with Session() as session:
            async with session.begin():
                n = await load_file(
                    session,
                    p,
                    prefix=args.prefix,
                    start=args.start,
                    kind=args.kind,
                    name_from_file=args.name_from_file,
                )
            print(f"[load_zones] {p.name}: upserted {n} zone(s)")
            total += n
    print(f"[load_zones] Done. Total zones upserted: {total}")


def parse_args(argv: List[str]) -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Load GeoJSON polygons into zones table")
    ap.add_argument("files", nargs="+", help=".geojson file(s) to load")
    ap.add_argument("--prefix", default="ISA-ZONE-TEST", help="Prefix for generated zone_id (default: %(default)s)")
    ap.add_argument("--start", type=int, default=1, help="Starting index for generated zone_id (default: %(default)s)")
    ap.add_argument("--kind", default="restricted", help="Zone kind label (default: %(default)s)")
    ap.add_argument("--name-from-file", action="store_true", help="Use <filename>-<n> as zone name")
    return ap.parse_args(argv)


def main() -> None:
    args = parse_args(sys.argv[1:])
    asyncio.run(amain(args))


if __name__ == "__main__":
    main()
