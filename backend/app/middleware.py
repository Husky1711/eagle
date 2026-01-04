"""
FastAPI middleware for CORS and rate limiting
"""
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request, HTTPException, status
from app.config import settings
from collections import defaultdict
from datetime import datetime, timedelta
import time

# Simple in-memory rate limiting (for production, use Redis)
rate_limit_store = defaultdict(list)
contact_rate_limit_store = defaultdict(list)


def setup_cors(app):
    """Setup CORS middleware"""
    from app.config import settings
    origins = settings.cors_origins_list if hasattr(settings, 'cors_origins_list') else []
    
    # SECURITY: Never allow all origins in production
    if not origins or origins == ["*"]:
        from app.utils.logger import logger
        logger.warning("CORS_ORIGINS not configured properly! Defaulting to empty list for security.")
        origins = []
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,  # Restrictive - only specified origins
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Specific methods only
        allow_headers=["Content-Type", "Authorization", "X-API-Key", "X-Image-Token"],  # Specific headers only
        expose_headers=["X-RateLimit-Remaining", "X-RateLimit-Reset-After"],  # Rate limit headers
    )


def rate_limit_login(request: Request) -> bool:
    """
    Simple rate limiting for login endpoint
    Returns True if allowed, False if rate limited
    """
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - settings.RATE_LIMIT_WINDOW
    
    # Clean old entries
    rate_limit_store[client_ip] = [
        timestamp for timestamp in rate_limit_store[client_ip]
        if timestamp > window_start
    ]
    
    # Check limit
    if len(rate_limit_store[client_ip]) >= settings.RATE_LIMIT_LOGIN:
        return False
    
    # Add current request
    rate_limit_store[client_ip].append(now)
    return True


def rate_limit_contact(request: Request) -> bool:
    """
    Rate limiting for contact form endpoint
    Returns True if allowed, False if rate limited
    """
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - settings.RATE_LIMIT_CONTACT_WINDOW
    
    # Clean old entries
    contact_rate_limit_store[client_ip] = [
        timestamp for timestamp in contact_rate_limit_store[client_ip]
        if timestamp > window_start
    ]
    
    # Check limit
    if len(contact_rate_limit_store[client_ip]) >= settings.RATE_LIMIT_CONTACT:
        return False
    
    # Add current request
    contact_rate_limit_store[client_ip].append(now)
    return True

