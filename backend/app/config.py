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
    TEMP_DIR: Path = BASE_DIR / "storage" / "temp" / "imports"
    
    # Import Settings
    MAX_IMPORT_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    IMPORT_SAMPLE_ROWS: int = 20  # Number of sample rows to return
    
    # Rate Limiting
    RATE_LIMIT_LOGIN: int = 5  # attempts per window
    RATE_LIMIT_WINDOW: int = 900  # 15 minutes in seconds
    RATE_LIMIT_CONTACT: int = 3  # contact form submissions per hour
    RATE_LIMIT_CONTACT_WINDOW: int = 3600  # 1 hour in seconds
    
    # Redis Configuration (optional, for distributed rate limiting)
    REDIS_URL: str = ""  # e.g., "redis://localhost:6379/0"
    
    # Request Size Limits
    MAX_REQUEST_SIZE: int = 1 * 1024 * 1024  # 1MB
    MAX_CHAT_MESSAGE_LENGTH: int = 5000  # characters
    MAX_CONVERSATION_HISTORY: int = 20  # messages
    MAX_PRICING_CALC_ITEMS: int = 10  # items per request
    
    # Image Security
    HOTLINK_PROTECTION_ENABLED: bool = True
    ALLOWED_IMAGE_REFERRERS: str = ""  # Comma-separated list of allowed domains
    
    # API Key Configuration
    API_KEY_REQUIRED: bool = False  # Set to True to require API keys for public endpoints
    
    # Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""  # Gmail address (sender)
    SMTP_PASSWORD: str = ""  # Gmail App Password
    SMTP_FROM_EMAIL: str = ""  # From email (defaults to SMTP_USER if not set)
    CONTACT_EMAIL: str = ""  # Fallback admin email (if admin profile has no email)
    
    # GROQ LLM Configuration
    GROQ_API_KEY: str = ""  # GROQ API key for chat completions
    
    # Chat Usage Configuration
    CHAT_USAGE_LOG_FILE: str = "chat_usage.json"
    CHAT_PRICING_CONFIG_FILE: str = "chat_pricing.json"
    CHAT_PROMPT_FILE: str = "chat_prompt.json"
    CHAT_USAGE_RETENTION_DAYS: int = 90  # Keep logs for 90 days
    CHAT_STATS_CACHE_TTL: int = 300  # 5 minutes cache TTL

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.PROFILES_DIR.mkdir(parents=True, exist_ok=True)
settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)

