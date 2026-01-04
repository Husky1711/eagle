"""
Admin-related Pydantic models
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.chat import PeriodSummary


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
    chat_usage_today: Optional[PeriodSummary] = None
    chat_usage_week: Optional[PeriodSummary] = None
    chat_usage_month: Optional[PeriodSummary] = None


class ProfileUpdate(BaseModel):
    """Profile update request"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None


class PasswordChange(BaseModel):
    """Password change request"""
    current_password: str
    new_password: str
    confirm_password: str


class ProfileResponse(BaseModel):
    """Profile response"""
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    updated_at: Optional[datetime] = None

