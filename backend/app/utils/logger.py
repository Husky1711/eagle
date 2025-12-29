"""
Centralized logging configuration using Loguru
"""
import sys
import os
from pathlib import Path
from datetime import datetime
from loguru import logger
from app.config import settings

# Log directory
LOG_DIR = Path(__file__).parent.parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Subdirectories for different log types
LOG_SUBDIRS = {
    "app": LOG_DIR / "app",
    "error": LOG_DIR / "error",
    "access": LOG_DIR / "access",
    "admin": LOG_DIR / "admin",
}

# Create subdirectories
for subdir in LOG_SUBDIRS.values():
    subdir.mkdir(parents=True, exist_ok=True)

# Environment detection
ENV = os.getenv("ENV", "development").lower()
IS_PRODUCTION = ENV == "production"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO" if IS_PRODUCTION else "DEBUG")

# Remove default handler
logger.remove()

# Log format (JSON) - Using serialize=True for proper JSON output with extra fields
# When serialize=True, Loguru outputs JSON automatically, so we use a simple format
LOG_FORMAT = "{time:YYYY-MM-DD HH:mm:ss.SSS} | {level} | {name}:{function}:{line} - {message}"

# Add console handler (development only)
if not IS_PRODUCTION:
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
        level=LOG_LEVEL,
        colorize=True,
    )

# Main app log (all levels)
logger.add(
    LOG_SUBDIRS["app"] / "app-{time:YYYY-MM-DD}.log",
    format=LOG_FORMAT,
    level=LOG_LEVEL,
    rotation="00:00",  # Rotate at midnight
    retention="30 days",
    compression=None,
    encoding="utf-8",
    enqueue=True,  # Thread-safe
    serialize=True,  # JSON serialization includes extra fields automatically
)

# Error log (errors only)
logger.add(
    LOG_SUBDIRS["error"] / "error-{time:YYYY-MM-DD}.log",
    format=LOG_FORMAT,
    level="ERROR",
    rotation="00:00",
    retention="30 days",
    compression=None,
    encoding="utf-8",
    enqueue=True,
    serialize=True,
)

# Access log (HTTP requests/responses)
access_logger = logger.bind(name="access")
logger.add(
    LOG_SUBDIRS["access"] / "access-{time:YYYY-MM-DD}.log",
    format=LOG_FORMAT,
    level="INFO",
    rotation="00:00",
    retention="30 days",
    compression=None,
    encoding="utf-8",
    enqueue=True,
    serialize=True,
    filter=lambda record: record.get("extra", {}).get("type") == "access",
)

# Admin log (admin actions)
admin_logger = logger.bind(name="admin")
logger.add(
    LOG_SUBDIRS["admin"] / "admin-{time:YYYY-MM-DD}.log",
    format=LOG_FORMAT,
    level="INFO",
    rotation="00:00",
    retention="30 days",
    compression=None,
    encoding="utf-8",
    enqueue=True,
    serialize=True,
    filter=lambda record: record.get("extra", {}).get("type") == "admin",
)

# Export configured logger
__all__ = ["logger", "access_logger", "admin_logger", "LOG_DIR"]

