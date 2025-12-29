"""
Public API endpoints (no authentication required)
"""
from fastapi import APIRouter, HTTPException, status
from app.utils.json_handler import JSONHandler
from app.models.content import PricingCalculate, PricingResult
from app.utils.validators import validate_weight, validate_distance
from app.config import settings
from typing import List
import json

router = APIRouter()
json_handler = JSONHandler(settings.DATA_DIR)


@router.get("/pages/{page_id}")
async def get_page(page_id: str):
    """Get page content"""
    pages = json_handler.read("pages.json")
    
    if page_id not in pages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page '{page_id}' not found"
        )
    
    page_data = pages[page_id]
    
    # Only return published pages
    if not page_data.get("published", True):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found"
        )
    
    return page_data


@router.get("/couriers")
async def get_couriers():
    """Get active couriers"""
    couriers = json_handler.read_list("couriers.json")
    active_couriers = [c for c in couriers if c.get("active", True)]
    
    # Sort by display_order
    active_couriers.sort(key=lambda x: x.get("display_order", 999))
    
    return active_couriers


@router.post("/pricing/calculate", response_model=List[PricingResult])
async def calculate_pricing(request: PricingCalculate):
    """Calculate pricing for given weight and distance"""
    
    # Validate inputs
    weight_valid, weight_error = validate_weight(request.weight)
    if not weight_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=weight_error
        )
    
    distance_valid, distance_error = validate_distance(request.distance)
    if not distance_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=distance_error
        )
    
    # Load pricing rules
    pricing_rules = json_handler.read_list("pricing_rules.json")
    couriers = json_handler.read_list("couriers.json")
    
    # Create courier lookup
    courier_lookup = {c["id"]: c for c in couriers if c.get("active", True)}
    
    results = []
    
    # Calculate price for each matching rule
    for rule in pricing_rules:
        if not rule.get("active", True):
            continue
        
        courier_id = rule.get("courier")
        if courier_id not in courier_lookup:
            continue
        
        weight_range = rule.get("weight_range", {})
        weight_min = weight_range.get("min", 0)
        weight_max = weight_range.get("max", float('inf'))
        
        # Check if weight matches
        if not (weight_min <= request.weight <= weight_max):
            continue
        
        # Find matching distance zone
        distance_zones = rule.get("distance_zones", [])
        matching_zone = None
        
        for zone in distance_zones:
            zone_max = zone.get("max_distance", float('inf'))
            if request.distance <= zone_max:
                matching_zone = zone
                break
        
        if not matching_zone:
            continue
        
        # Calculate price
        base_price = matching_zone.get("base_price", 0)
        price_per_kg = matching_zone.get("price_per_kg", 0)
        total_price = base_price + (request.weight * price_per_kg)
        
        # Build breakdown
        breakdown = {
            "base_price": base_price,
            "weight": request.weight,
            "price_per_kg": price_per_kg,
            "weight_cost": request.weight * price_per_kg,
            "distance": request.distance,
            "zone": matching_zone.get("zone", "unknown")
        }
        
        courier_info = courier_lookup[courier_id]
        
        results.append(PricingResult(
            courier=courier_id,
            courier_name=courier_info.get("name", courier_id),
            price=round(total_price, 2),
            breakdown=breakdown,
            estimated_delivery=matching_zone.get("estimated_delivery")
        ))
    
    # Sort by price (best first)
    results.sort(key=lambda x: x.price)
    
    # Update analytics
    analytics = json_handler.read("analytics.json")
    calculator_count = analytics.get("calculator_usage_count", 0)
    analytics["calculator_usage_count"] = calculator_count + 1
    json_handler.write("analytics.json", analytics)
    
    # Return top 3
    return results[:3]


@router.get("/tracking/{courier_id}/{tracking_id}")
async def redirect_tracking(courier_id: str, tracking_id: str):
    """Get tracking redirect URL"""
    couriers = json_handler.read_list("couriers.json")
    
    courier = next((c for c in couriers if c.get("id") == courier_id and c.get("active", True)), None)
    
    if not courier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Courier not found"
        )
    
    tracking_url_template = courier.get("tracking_url", "")
    tracking_url = tracking_url_template.replace("{id}", tracking_id)
    
    # Update analytics
    analytics = json_handler.read("analytics.json")
    tracking_count = analytics.get("tracking_redirect_count", 0)
    analytics["tracking_redirect_count"] = tracking_count + 1
    json_handler.write("analytics.json", analytics)
    
    return {"redirect_url": tracking_url}


@router.get("/settings")
async def get_settings():
    """Get site settings"""
    settings_data = json_handler.read("settings.json")
    return settings_data

