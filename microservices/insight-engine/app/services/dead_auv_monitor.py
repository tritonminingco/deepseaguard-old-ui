"""
Dead AUV monitor: detects when an AUV is silent for a configured time.
"""

import asyncio
from datetime import datetime
from typing import AsyncIterator, Dict

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import DEAD_AUV_TIMEOUT_SECONDS, DEAD_AUV_SCAN_INTERVAL_SECONDS
from app.services.alerts_ingest import create_dead_auv_alert_generic


async def _overdue_auvs(session: AsyncSession, timeout_s: int) -> Dict[str, datetime]:
	"""Return overdue AUVs mapping auv_id -> last_seen from auv_status table."""
	res = await session.execute( text("SELECT auv_id, last_seen FROM auv_status WHERE now() - last_seen >= (INTERVAL '1 second' * :t)"), {"t": timeout_s}, )
	return {r[0]: r[1] for r in res.fetchall()}


async def dead_auv_scanner(session_factory) -> AsyncIterator[Dict]:
	"""Periodically scan DB for AUVs that are overdue. Uses AsyncSession factory.
	Yields alert dicts when a dead AUV is detected.
	"""
	while True:
		print("[dead_auv_scanner] Starting scan tick")
		try:
			# Phase 1: read last_seen map in its own short-lived session
			async with session_factory() as rsession:
				print("[dead_auv_scanner] Opened DB session (read)")
				dead_auvs = await _overdue_auvs(rsession, DEAD_AUV_TIMEOUT_SECONDS)
				print(f"[dead_auv_scanner] Retrieved {len(dead_auvs)} AUV last_seen records")

			if dead_auvs:
				# Loop through dead AUVs and create alert payloads
				for auv_id, last_seen in dead_auvs.items():
					payload = {
						"type": "dead_auv",
						"auv_id": auv_id,
						"last_seen": last_seen.isoformat(),
						"threshold_seconds": DEAD_AUV_TIMEOUT_SECONDS,
					}

					# Phase 2: create alerts in separate short-lived write transactions
					print(f"[dead_auv_scanner] AUV {auv_id} considered DEAD; creating alert")
					try:
						async with session_factory() as wsession:
							async with wsession.begin():
								# Insert alerts into DB
								alert_id = await create_dead_auv_alert_generic(
									wsession,
									auv_id=auv_id,
									last_seen_iso=last_seen.isoformat(),
									threshold_seconds=DEAD_AUV_TIMEOUT_SECONDS,
								)
						print(f"[dead_auv_scanner] Created alert id={alert_id} for AUV {auv_id}")
					except Exception as e:
						print(f"[dead_auv_scanner] Create dead_auv alert error for {auv_id}: {e}")
					print(f"[dead_auv_scanner] Yielding payload for AUV {auv_id}")
					yield payload
			
		except Exception as e:
			# Log and continue
			print(f"[dead_auv_scanner] Dead AUV scanner error: {e}")

		print(f"[dead_auv_scanner] Sleeping {DEAD_AUV_SCAN_INTERVAL_SECONDS}s before next scan")
		await asyncio.sleep(DEAD_AUV_SCAN_INTERVAL_SECONDS)
