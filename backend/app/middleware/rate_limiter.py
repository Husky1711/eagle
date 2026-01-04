"""
Advanced Rate Limiting Middleware
Supports Redis (production) and in-memory (development) backends
"""
from fastapi import Request, HTTPException, status
from typing import Optional, Dict
from datetime import datetime, timedelta
import time
import hashlib
from collections import defaultdict
from app.config import settings
from app.utils.logger import logger

# Try to import Redis, fallback to in-memory if not available
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available, using in-memory rate limiting (not production-ready)")

# In-memory fallback (for development)
_memory_store: Dict[str, list] = defaultdict(list)
_ip_blacklist: Dict[str, datetime] = {}


class RateLimiter:
    """Advanced rate limiter with Redis support and IP blacklisting"""
    
    def __init__(self):
        self.redis_client = None
        if REDIS_AVAILABLE and hasattr(settings, 'REDIS_URL'):
            try:
                self.redis_client = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=2
                )
                # Test connection
                self.redis_client.ping()
                logger.info("Redis rate limiting enabled")
            except Exception as e:
                logger.warning(f"Redis connection failed, using in-memory: {e}")
                self.redis_client = None
    
    def _get_client_key(self, identifier: str, endpoint: str) -> str:
        """Generate Redis key for rate limiting"""
        return f"rate_limit:{endpoint}:{identifier}"
    
    def _get_blacklist_key(self, identifier: str) -> str:
        """Generate Redis key for IP blacklist"""
        return f"blacklist:ip:{identifier}"
    
    def is_blacklisted(self, identifier: str) -> bool:
        """Check if IP/identifier is blacklisted"""
        if self.redis_client:
            try:
                return self.redis_client.exists(self._get_blacklist_key(identifier)) > 0
            except Exception:
                return False
        else:
            # In-memory check
            if identifier in _ip_blacklist:
                expiry = _ip_blacklist[identifier]
                if datetime.utcnow() < expiry:
                    return True
                else:
                    del _ip_blacklist[identifier]
            return False
    
    def blacklist(self, identifier: str, duration_seconds: int = 3600):
        """Blacklist an IP/identifier for specified duration"""
        expiry = datetime.utcnow() + timedelta(seconds=duration_seconds)
        
        if self.redis_client:
            try:
                self.redis_client.setex(
                    self._get_blacklist_key(identifier),
                    duration_seconds,
                    "1"
                )
                logger.warning(f"Blacklisted {identifier} for {duration_seconds} seconds")
            except Exception as e:
                logger.error(f"Failed to blacklist in Redis: {e}")
        else:
            _ip_blacklist[identifier] = expiry
            logger.warning(f"Blacklisted {identifier} for {duration_seconds} seconds (in-memory)")
    
    def check_rate_limit(
        self,
        request: Request,
        endpoint: str,
        max_requests: int,
        window_seconds: int,
        identifier: Optional[str] = None
    ) -> tuple[bool, int, int]:
        """
        Check rate limit for a request
        
        Returns:
            (is_allowed, remaining_requests, reset_after_seconds)
        """
        # Get identifier (IP address or custom)
        if identifier is None:
            identifier = self._get_client_identifier(request)
        
        # Check blacklist first
        if self.is_blacklisted(identifier):
            logger.warning(f"Blocked blacklisted identifier: {identifier}")
            return False, 0, 0
        
        key = self._get_client_key(identifier, endpoint)
        now = time.time()
        window_start = now - window_seconds
        
        if self.redis_client:
            try:
                # Use Redis sorted set for sliding window
                pipe = self.redis_client.pipeline()
                # Remove old entries
                pipe.zremrangebyscore(key, 0, window_start)
                # Count current requests
                pipe.zcard(key)
                # Add current request
                pipe.zadd(key, {str(now): now})
                # Set expiry
                pipe.expire(key, window_seconds)
                results = pipe.execute()
                
                current_count = results[1]
                remaining = max(0, max_requests - current_count - 1)
                reset_after = int(window_seconds - (now - window_start))
                
                if current_count >= max_requests:
                    # Auto-blacklist after repeated violations
                    violation_key = f"violations:{identifier}:{endpoint}"
                    violations = self.redis_client.incr(violation_key)
                    self.redis_client.expire(violation_key, 3600)  # 1 hour window
                    
                    if violations >= 10:  # 10 violations in 1 hour = blacklist
                        self.blacklist(identifier, duration_seconds=86400)  # 24 hours
                    
                    return False, remaining, reset_after
                
                return True, remaining, reset_after
                
            except Exception as e:
                logger.error(f"Redis rate limit error: {e}, falling back to in-memory")
                # Fallback to in-memory
                self.redis_client = None
        
        # In-memory fallback
        if identifier not in _memory_store:
            _memory_store[identifier] = []
        
        # Clean old entries
        _memory_store[identifier] = [
            ts for ts in _memory_store[identifier]
            if ts > window_start
        ]
        
        current_count = len(_memory_store[identifier])
        remaining = max(0, max_requests - current_count - 1)
        reset_after = int(window_seconds - (now - window_start))
        
        if current_count >= max_requests:
            return False, remaining, reset_after
        
        # Add current request
        _memory_store[identifier].append(now)
        
        return True, remaining, reset_after
    
    def _get_client_identifier(self, request: Request) -> str:
        """Get unique identifier for client (IP + User-Agent hash)"""
        ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        
        # Hash user agent to prevent enumeration
        ua_hash = hashlib.md5(user_agent.encode()).hexdigest()[:8]
        
        return f"{ip}:{ua_hash}"


# Global rate limiter instance
rate_limiter = RateLimiter()


# Convenience functions for specific endpoints
def rate_limit_chat(request: Request) -> tuple[bool, int, int]:
    """Rate limit for chat API (20 requests per hour per IP)"""
    return rate_limiter.check_rate_limit(
        request=request,
        endpoint="chat",
        max_requests=20,
        window_seconds=3600  # 1 hour
    )


def rate_limit_pricing_calc(request: Request) -> tuple[bool, int, int]:
    """Rate limit for pricing calculator (100 requests per hour per IP)"""
    return rate_limiter.check_rate_limit(
        request=request,
        endpoint="pricing_calc",
        max_requests=100,
        window_seconds=3600
    )


def rate_limit_image_access(request: Request) -> tuple[bool, int, int]:
    """Rate limit for image access (1000 requests per hour per IP)"""
    return rate_limiter.check_rate_limit(
        request=request,
        endpoint="image_access",
        max_requests=1000,
        window_seconds=3600
    )


def rate_limit_public_api(request: Request, endpoint: str) -> tuple[bool, int, int]:
    """Generic rate limit for public APIs (50 requests per minute per IP)"""
    return rate_limiter.check_rate_limit(
        request=request,
        endpoint=f"public_{endpoint}",
        max_requests=50,
        window_seconds=60
    )

