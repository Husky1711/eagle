"""
Admin-related Pydantic models
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class AdminLogin(BaseModel):
    """Admin login request"""
    username: str
    password: str


class AdminResponse(BaseModel):
    """Admin login response"""
    access_token: str
    token_type: str = "bearer"
    username: str


class DashboardStats(BaseModel):
    """Dashboard statistics"""
    total_pages: int
    active_couriers: int
    media_count: int
    pricing_rules_count: int
    calculator_usage_count: int
    tracking_redirect_count: int
    last_content_update: Optional[datetime] = None

