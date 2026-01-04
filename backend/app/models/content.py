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
    styles: Optional[Dict[str, Any]] = None
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
    custom_fields: Optional[Dict[str, Any]] = None  # Dynamic custom fields from Excel
    # Zone-based pricing support
    pricing_type: Optional[str] = "distance"  # "distance" or "zone"
    zone: Optional[str] = None  # Zone identifier (e.g., "zone_1", "us", "ca")
    zone_name: Optional[str] = None  # Original zone name from Excel
    price: Optional[float] = None  # Direct price for zone-based pricing (not per kg)


class PricingRuleUpdate(BaseModel):
    """Update pricing rule request"""
    courier: Optional[str] = None
    weight_range: Optional[Dict[str, Any]] = None
    distance_zones: Optional[List[Dict[str, Any]]] = None
    active: Optional[bool] = None
    custom_fields: Optional[Dict[str, Any]] = None  # Dynamic custom fields
    # Zone-based pricing support
    pricing_type: Optional[str] = None  # "distance" or "zone"
    zone: Optional[str] = None
    zone_name: Optional[str] = None
    price: Optional[float] = None


class PricingCalculate(BaseModel):
    """Pricing calculation request"""
    weight: float
    distance: Optional[float] = None
    destination: Optional[str] = None
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
    header: Optional[Dict[str, Any]] = None
    footer: Optional[Dict[str, Any]] = None
    chatbot: Optional[Dict[str, Any]] = None


# Pricing Import Models
class PricingImportAnalyzeResponse(BaseModel):
    """Response from import file analysis"""
    file_id: str
    columns: List[str]
    sample_rows: List[Dict[str, Any]]
    total_rows: int
    mapping_suggestions: Optional[Dict[str, Dict[str, Any]]] = None  # Column name -> mapping suggestion
    # Zone detection results
    zone_detection: Optional[Dict[str, Any]] = None  # Zone columns, weight column, is_zone_based
    import_type: Optional[str] = "standard"  # "standard" or "zone_based"


class ColumnMapping(BaseModel):
    """Column mapping configuration"""
    column_name: str
    mapped_field: Optional[str] = None  # "courier", "weight_min", "weight_max", "distance_min", "distance_max", "price_per_kg", "custom"
    field_type: Optional[str] = None  # "text", "number", "currency", "boolean"
    show_in_ui: bool = True
    custom_field_name: Optional[str] = None  # If mapped_field is "custom", this is the custom field name


class ImportPreviewRequest(BaseModel):
    """Request for import preview"""
    file_id: str
    column_mapping: Dict[str, ColumnMapping]  # column_name -> ColumnMapping
    import_mode: str = "create"  # "create", "update", "skip_duplicates"


class ImportPreviewResponse(BaseModel):
    """Response from import preview"""
    preview_rows: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]  # {row: int, column: str, error: str, value: Any}
    stats: Dict[str, int]  # {will_create: int, will_update: int, will_skip: int, total_valid: int, total_errors: int}


class ImportExecuteRequest(BaseModel):
    """Request to execute import"""
    file_id: str
    column_mapping: Dict[str, ColumnMapping]
    import_mode: str = "create"  # "create", "update", "skip_duplicates"
    import_type: str = "standard"  # "standard" or "zone_based"
    courier: Optional[str] = None  # Required for zone-based imports
    weight_conversion_method: Optional[str] = "point_to_range"  # For zone-based imports
    service_type: Optional[str] = None  # Optional service type (e.g., "UPS Envelope")


class ImportResult(BaseModel):
    """Result from import execution"""
    success_count: int
    error_count: int
    errors: List[Dict[str, Any]]  # {row: int, column: str, error: str, value: Any}
    imported_rules: List[Any]  # List of created/updated rule IDs (strings) or rule objects
    skipped_count: int = 0

