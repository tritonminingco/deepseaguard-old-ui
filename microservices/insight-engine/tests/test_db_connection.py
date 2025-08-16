import os
import pytest
from sqlalchemy import text
from app.services.db import get_engine

@pytest.mark.asyncio
async def test_database_connectivity():
    """Simple connectivity test replacing removed ping()."""
    engine = get_engine()
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT 1"))
        scalar = result.scalar()
    assert scalar == 1
