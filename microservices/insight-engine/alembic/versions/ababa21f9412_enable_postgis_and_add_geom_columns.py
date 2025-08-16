"""enable PostGIS and add geom columns

Revision ID: ababa21f9412
Revises: c4dc7cf4c602
Create Date: 2025-08-10 12:37:35.882276

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ababa21f9412'
down_revision: Union[str, Sequence[str], None] = 'c4dc7cf4c602'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Enable PostGIS extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    # Add geom column to telemetry
    op.execute("ALTER TABLE telemetry ADD COLUMN geom geometry(Point, 4326);")
    op.execute("""
        UPDATE telemetry
        SET geom = ST_GeomFromText(location_wkt, 4326)
        WHERE location_wkt IS NOT NULL;
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_geom ON telemetry USING GIST (geom);")

    # Add geom column to zones
    op.execute("ALTER TABLE zones ADD COLUMN geom geometry(Geometry, 4326);")
    op.execute("""
        UPDATE zones
        SET geom = ST_GeomFromText(geom_wkt, 4326)
        WHERE geom_wkt IS NOT NULL;
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_zones_geom ON zones USING GIST (geom);")


def downgrade() -> None:
    """Downgrade schema."""
    # Remove indexes
    op.execute("DROP INDEX IF EXISTS idx_zones_geom;")
    op.execute("DROP INDEX IF EXISTS idx_telemetry_geom;")

    # Remove geom columns
    op.execute("ALTER TABLE zones DROP COLUMN IF EXISTS geom;")
    op.execute("ALTER TABLE telemetry DROP COLUMN IF EXISTS geom;")

    # Optionally drop PostGIS extension
    op.execute("DROP EXTENSION IF EXISTS postgis;")
