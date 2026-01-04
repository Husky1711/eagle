"""
API Key Authentication Middleware
For protecting public endpoints from unauthorized access
"""
from fastapi import Request, HTTPException, status, Header
from typing import Optional
from app.config import settings
from app.utils.logger import logger
from app.utils.json_handler import JSONHandler
from datetime import datetime, timedelta
import hashlib
import secrets


class APIKeyManager:
    """Manage API keys for public endpoints"""
    
    def __init__(self):
        self.json_handler = JSONHandler(settings.DATA_DIR)
        self.api_keys_file = "api_keys.json"
        self._load_keys()
    
    def _load_keys(self):
        """Load API keys from JSON file"""
        try:
            data = self.json_handler.read(self.api_keys_file)
            if not data:
                data = {
                    "keys": {},
                    "metadata": {
                        "last_updated": datetime.utcnow().isoformat() + "Z"
                    }
                }
                self.json_handler.write(self.api_keys_file, data)
            self.keys = data.get("keys", {})
        except Exception as e:
            logger.error(f"Error loading API keys: {e}")
            self.keys = {}
    
    def generate_key(self, name: str, allowed_endpoints: list, expires_days: Optional[int] = None) -> str:
        """Generate a new API key"""
        # Generate secure random key
        api_key = f"sk_{secrets.token_urlsafe(32)}"
        
        expiry = None
        if expires_days:
            expiry = (datetime.utcnow() + timedelta(days=expires_days)).isoformat() + "Z"
        
        key_data = {
            "name": name,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "expires_at": expiry,
            "allowed_endpoints": allowed_endpoints,
            "usage_count": 0,
            "last_used": None,
            "active": True
        }
        
        self.keys[api_key] = key_data
        self._save_keys()
        
        logger.info(f"Generated API key: {name} (expires: {expiry})")
        return api_key
    
    def revoke_key(self, api_key: str):
        """Revoke an API key"""
        if api_key in self.keys:
            self.keys[api_key]["active"] = False
            self._save_keys()
            logger.info(f"Revoked API key: {api_key[:10]}...")
    
    def validate_key(self, api_key: str, endpoint: str) -> tuple[bool, Optional[str]]:
        """
        Validate API key for specific endpoint
        
        Returns:
            (is_valid, error_message)
        """
        if not api_key:
            return False, "API key required"
        
        if api_key not in self.keys:
            return False, "Invalid API key"
        
        key_data = self.keys[api_key]
        
        # Check if active
        if not key_data.get("active", True):
            return False, "API key revoked"
        
        # Check expiry
        expires_at = key_data.get("expires_at")
        if expires_at:
            expiry = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            if datetime.utcnow() > expiry:
                return False, "API key expired"
        
        # Check endpoint permission
        allowed = key_data.get("allowed_endpoints", [])
        if "*" not in allowed and endpoint not in allowed:
            return False, f"API key not authorized for endpoint: {endpoint}"
        
        # Update usage stats
        key_data["usage_count"] = key_data.get("usage_count", 0) + 1
        key_data["last_used"] = datetime.utcnow().isoformat() + "Z"
        self._save_keys()
        
        return True, None
    
    def _save_keys(self):
        """Save API keys to JSON file"""
        data = {
            "keys": self.keys,
            "metadata": {
                "last_updated": datetime.utcnow().isoformat() + "Z"
            }
        }
        self.json_handler.write(self.api_keys_file, data)
    
    def get_key_info(self, api_key: str) -> Optional[dict]:
        """Get information about an API key (for admin)"""
        return self.keys.get(api_key)


# Global API key manager
api_key_manager = APIKeyManager()


async def verify_api_key(
    request: Request,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
) -> Optional[str]:
    """
    Dependency to verify API key for public endpoints
    
    Returns:
        API key name if valid, None if optional and not provided
    """
    endpoint = request.url.path
    
    # Some endpoints don't require API key (optional)
    optional_endpoints = ["/api/public/pages/", "/api/public/settings"]
    is_optional = any(endpoint.startswith(ep) for ep in optional_endpoints)
    
    if not x_api_key:
        if is_optional:
            return None
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required. Include X-API-Key header."
        )
    
    is_valid, error_msg = api_key_manager.validate_key(x_api_key, endpoint)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_msg or "Invalid API key"
        )
    
    key_info = api_key_manager.get_key_info(x_api_key)
    return key_info.get("name") if key_info else "unknown"


# For endpoints that require API key
async def require_api_key(
    request: Request,
    x_api_key: str = Header(..., alias="X-API-Key")
) -> str:
    """Dependency that requires API key (non-optional)"""
    return await verify_api_key(request, x_api_key)

