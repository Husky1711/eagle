"""
Application configuration and settings
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directory
BASE_DIR = Path(__file__).parent.parent

class Settings(BaseSettings):
    """Application settings"""
    
    # App Info
    APP_NAME: str = "Logistics Aggregator CMS"
    APP_VERSION: str = "1.0.0"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
    
    # File Paths
    DATA_DIR: Path = BASE_DIR / "storage" / "data"
    UPLOADS_DIR: Path = BASE_DIR / "storage" / "uploads"
    
    # Rate Limiting
    RATE_LIMIT_LOGIN: int = 5  # attempts per window
    RATE_LIMIT_WINDOW: int = 900  # 15 minutes in seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

