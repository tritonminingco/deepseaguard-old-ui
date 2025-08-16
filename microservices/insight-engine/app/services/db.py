"""SQLAlchemy (async) database bootstrap for PostgreSQL & PostGIS with PgBouncer."""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.config.settings import ASYNC_DB_URL

_engine: Optional[AsyncEngine] = None
_sessionmaker: Optional[async_sessionmaker[AsyncSession]] = None


def get_engine() -> AsyncEngine:
	"""Return a singleton AsyncEngine configured for PgBouncer.
	"""
	global _engine
	if _engine is not None:
		return _engine

	_engine = create_async_engine(
		ASYNC_DB_URL,
		echo=False,
		poolclass=NullPool, # disables SQLAlchemy's pooling so PgBouncer controls connections
		pool_pre_ping=True,  # check connection health before using it.
		connect_args={
			# asyncpg option to disable prepared-statement cache (PgBouncer txn pooling friendly)
			"statement_cache_size": 0,
			# optional server settings (shows up in pg_stat_activity)
			"server_settings": {"application_name": "insight-engine-auv"},
		},
	)
	return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
	"""Return a singleton async sessionmaker bound to the engine.
	"""
	global _sessionmaker
	if _sessionmaker is not None:
		return _sessionmaker
	_sessionmaker = async_sessionmaker(get_engine(), expire_on_commit=False)
	return _sessionmaker