"""
Application configuration and settings
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory
BASE_DIR = Path(__file__).parent.parent

class Settings(BaseSettings):
    """Application settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields from .env that aren't in the model
    )
    
    # App Info
    APP_NAME: str = "Logistics Aggregator CMS"
    APP_VERSION: str = "1.0.0"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> list:
        """Parse CORS_ORIGINS string into list"""
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
    
    # File Paths
    DATA_DIR: Path = BASE_DIR / "storage" / "data"
    UPLOADS_DIR: Path = BASE_DIR / "storage" / "uploads"
    PROFILES_DIR: Path = BASE_DIR / "storage" / "uploads" / "profiles"
    
    # Rate Limiting
    RATE_LIMIT_LOGIN: int = 5  # attempts per window
    RATE_LIMIT_WINDOW: int = 900  # 15 minutes in seconds
    RATE_LIMIT_CONTACT: int = 3  # contact form submissions per hour
    RATE_LIMIT_CONTACT_WINDOW: int = 3600  # 1 hour in seconds
    
    # Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""  # Gmail address (sender)
    SMTP_PASSWORD: str = ""  # Gmail App Password
    SMTP_FROM_EMAIL: str = ""  # From email (defaults to SMTP_USER if not set)
    CONTACT_EMAIL: str = ""  # Fallback admin email (if admin profile has no email)

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.PROFILES_DIR.mkdir(parents=True, exist_ok=True)

