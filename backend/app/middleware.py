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


def setup_cors(app):
    """Setup CORS middleware"""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
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

