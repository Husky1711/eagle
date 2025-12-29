"""
Content-related Pydantic models
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class PageContent(BaseModel):
    """Page content structure"""
    meta: Optional[Dict[str, Any]] = None
    content: Dict[str, Any]
    published: bool = True
    lastModified: Optional[datetime] = None


class SectionUpdate(BaseModel):
    """Section enable/disable update"""
    enabled: bool


class CourierCreate(BaseModel):
    """Create courier request"""
    name: str
    logo: Optional[str] = None
    tracking_url: str
    description: Optional[str] = None
    display_order: int = 0


class CourierUpdate(BaseModel):
    """Update courier request"""
    name: Optional[str] = None
    logo: Optional[str] = None
    tracking_url: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    display_order: Optional[int] = None


class PricingRuleCreate(BaseModel):
    """Create pricing rule request"""
    courier: str
    weight_range: Dict[str, Any]  # {"min": 0, "max": 5, "unit": "kg"}
    distance_zones: List[Dict[str, Any]]
    active: bool = True


class PricingRuleUpdate(BaseModel):
    """Update pricing rule request"""
    courier: Optional[str] = None
    weight_range: Optional[Dict[str, Any]] = None
    distance_zones: Optional[List[Dict[str, Any]]] = None
    active: Optional[bool] = None


class PricingCalculate(BaseModel):
    """Pricing calculation request"""
    weight: float
    distance: float
    service_type: Optional[str] = None


class PricingResult(BaseModel):
    """Pricing calculation result"""
    courier: str
    courier_name: str
    price: float
    breakdown: Dict[str, Any]
    estimated_delivery: Optional[str] = None


class SettingsUpdate(BaseModel):
    """Settings update request"""
    site: Optional[Dict[str, Any]] = None
    contact: Optional[Dict[str, Any]] = None
    social: Optional[Dict[str, Any]] = None

