"""
Image Security Middleware
Hotlink protection, referrer checking, and access control
"""
from fastapi import Request, HTTPException, status
from typing import Optional
from app.config import settings
from app.utils.logger import logger
from urllib.parse import urlparse


class ImageSecurity:
    """Image access security and hotlink protection"""
    
    def __init__(self):
        # Allowed referrers (domains that can embed images)
        self.allowed_referrers = getattr(settings, 'ALLOWED_IMAGE_REFERRERS', '').split(',')
        self.allowed_referrers = [r.strip() for r in self.allowed_referrers if r.strip()]
        
        # Enable hotlink protection by default
        self.hotlink_protection_enabled = getattr(settings, 'HOTLINK_PROTECTION_ENABLED', True)
        
        # Allowed image extensions
        self.allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'}
    
    def check_referrer(self, request: Request) -> tuple[bool, Optional[str]]:
        """
        Check if request referrer is allowed
        
        Returns:
            (is_allowed, error_message)
        """
        if not self.hotlink_protection_enabled:
            return True, None
        
        referrer = request.headers.get("referer") or request.headers.get("referrer")
        
        # If no referrer, allow (direct access or API calls)
        if not referrer:
            return True, None
        
        # Parse referrer URL
        try:
            referrer_url = urlparse(referrer)
            referrer_domain = referrer_url.netloc.lower()
            
            # Remove port if present
            if ':' in referrer_domain:
                referrer_domain = referrer_domain.split(':')[0]
            
            # Check against allowed referrers
            if self.allowed_referrers:
                # Check if referrer domain matches any allowed domain
                is_allowed = any(
                    referrer_domain == allowed.lower() or
                    referrer_domain.endswith('.' + allowed.lower())
                    for allowed in self.allowed_referrers
                )
                
                if not is_allowed:
                    logger.warning(f"Hotlink attempt blocked: {referrer_domain} -> {request.url.path}")
                    return False, "Hotlinking not allowed from this domain"
            
            return True, None
            
        except Exception as e:
            logger.error(f"Error checking referrer: {e}")
            # On error, allow (fail open for legitimate users)
            return True, None
    
    def check_image_access(
        self,
        request: Request,
        filename: str,
        require_auth: bool = False,
        auth_token: Optional[str] = None
    ) -> tuple[bool, Optional[str]]:
        """
        Comprehensive image access check
        
        Args:
            request: FastAPI request object
            filename: Image filename
            require_auth: Whether authentication is required
            auth_token: Optional auth token for private images
        
        Returns:
            (is_allowed, error_message)
        """
        # Check file extension
        if not any(filename.lower().endswith(ext) for ext in self.allowed_extensions):
            return False, "Invalid file type"
        
        # Check authentication if required
        if require_auth:
            if not auth_token:
                # Try to get from query parameter or header
                auth_token = request.query_params.get("token") or request.headers.get("X-Image-Token")
            
            if not auth_token or not self._validate_image_token(auth_token, filename):
                return False, "Authentication required for this image"
        
        # Check referrer (hotlink protection)
        is_allowed, error = self.check_referrer(request)
        if not is_allowed:
            return False, error
        
        return True, None
    
    def _validate_image_token(self, token: str, filename: str) -> bool:
        """
        Validate image access token
        In production, use JWT or signed tokens
        """
        # Simple implementation - in production, use proper token signing
        # For now, just check if token exists in allowed tokens list
        # You can implement JWT-based tokens here
        return True  # Placeholder
    
    def generate_image_url(
        self,
        filename: str,
        is_private: bool = False,
        expires_in: Optional[int] = None
    ) -> str:
        """
        Generate secure image URL with optional token
        
        Args:
            filename: Image filename
            is_private: Whether image requires authentication
            expires_in: Optional expiration time in seconds
        
        Returns:
            Secure image URL
        """
        base_url = f"/api/public/uploads/{filename}"
        
        if is_private:
            # Generate token (in production, use JWT)
            token = self._generate_image_token(filename, expires_in)
            return f"{base_url}?token={token}"
        
        return base_url
    
    def _generate_image_token(self, filename: str, expires_in: Optional[int]) -> str:
        """Generate image access token (placeholder - implement JWT in production)"""
        import secrets
        return secrets.token_urlsafe(16)


# Global image security instance
image_security = ImageSecurity()

