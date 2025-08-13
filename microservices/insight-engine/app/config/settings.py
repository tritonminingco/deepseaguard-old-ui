"""
Runtime configuration loaded from .env
"""
import os
from dotenv import load_dotenv

load_dotenv()  # take environment variables

# Database connection string
DB_URL: str = os.getenv("DATABASE_CONNECTION_STRING")
ASYNC_DB_URL: str = os.getenv("ASYNC_DATABASE_CONNECTION_STRING")

# Dead AUV timeout in seconds before we alert
DEAD_AUV_TIMEOUT_SECONDS: int = int(os.getenv("DEAD_AUV_TIMEOUT_SECONDS"))
# How often to scan for dead AUVs (seconds)
DEAD_AUV_SCAN_INTERVAL_SECONDS: int = int(os.getenv("DEAD_AUV_SCAN_INTERVAL_SECONDS"))


TELEMETRY_WS_URL = os.getenv("TELEMETRY_WS_URL")