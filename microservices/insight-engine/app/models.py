"""
SQLAlchemy ORM models for Insight Engine.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Index, String, Integer, Float, DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
	"""Base declarative class for all ORM models."""


class Telemetry(Base):
	"""Telemetry rows from AUVs.

	Note: PostGIS geometry (geom) will be added via migration. We store location_wkt here.
	"""

	__tablename__ = "telemetry"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	auv_id: Mapped[str] = mapped_column(String(64), index=True)
	timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
	zone_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True) # The allowed parcel / contract zone the AUV is supposed to stay inside.
	depth_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
	velocity_knots: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
	temperature_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
	turbidity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
	location_wkt: Mapped[Optional[str]] = mapped_column(String(128), nullable=True) # Text WKT (Well-Known Text) form of the point (e.g., POINT(lon lat)).
	raw: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True) # Raw original telemetry data
	zone_violation: Mapped[Optional[str]] = mapped_column(String(64), nullable=True) # Displays Zone violation condition per row.

	__table_args__ = (
		Index("ix_telemetry_auv_time", "auv_id", "timestamp"),
	)


class Zone(Base):
	"""Geofencing zones.

	Note: PostGIS geometry (geom) will be added via migration from geom_wkt.
	"""

	__tablename__ = "zones"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	zone_id: Mapped[str] = mapped_column(String(128), unique=True)
	name: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
	geom_wkt: Mapped[str] = mapped_column(Text)
	kind: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # e.g., restricted, protected


class AUVStatus(Base):
	"""Last-seen cache per AUV for dead AUV detection."""

	__tablename__ = "auv_status"

	auv_id: Mapped[str] = mapped_column(String(64), primary_key=True)
	last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class Alert(Base):
	"""Alerts for environmental, zone, and dead AUV conditions."""

	__tablename__ = "alerts"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	auv_id: Mapped[str] = mapped_column(String(64), index=True)
	type: Mapped[str] = mapped_column(String(64), index=True)  # environmental | zone_violation | dead_auv
	severity: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
	message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
	payload: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
	status: Mapped[str] = mapped_column(String(16), default="active")  # active | resolved
	started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
	ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
