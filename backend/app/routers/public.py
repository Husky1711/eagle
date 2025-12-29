"""
Public API endpoints (no authentication required)
"""
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response
from app.utils.json_handler import JSONHandler
from app.models.content import PricingCalculate, PricingResult
from app.utils.validators import validate_weight, validate_distance
from app.config import settings
from typing import List
import json
import httpx
from urllib.parse import quote

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


@router.get("/logo/{courier_name}")
async def get_courier_logo(courier_name: str):
    """Proxy endpoint to fetch courier logos (bypasses CORS)"""
    # Logo URL mapping - Using more reliable sources
    logo_urls = {
        'dtdc': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/DTDC_logo.svg',
        'bluedart': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Blue_Dart_Express_logo.svg',
        'blue-dart': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Blue_Dart_Express_logo.svg',
        'blue dart': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Blue_Dart_Express_logo.svg',
        'fedex': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/FedEx_Express.svg',
        'fed ex': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/FedEx_Express.svg',
        'fed-ex': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/FedEx_Express.svg',
        'delhivery': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Delhivery_logo.svg/256px-Delhivery_logo.svg.png',
        'shiprocket': 'https://www.shiprocket.in/wp-content/uploads/2020/11/shiprocket-logo.svg',
        'ship rocket': 'https://www.shiprocket.in/wp-content/uploads/2020/11/shiprocket-logo.svg',
        'dhl': 'https://upload.wikimedia.org/wikipedia/commons/7/77/DHL_Logo.svg',
        'ups': 'https://upload.wikimedia.org/wikipedia/commons/6/60/UPS_logo_2014.svg',
        'aramex': 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Aramex_logo.svg',
    }
    
    courier_key = courier_name.lower().strip()
    logo_url = logo_urls.get(courier_key)
    
    if not logo_url:
        # Try variations
        variations = [
            courier_key.replace(" ", ""),
            courier_key.replace(" ", "-"),
            courier_key.replace("-", ""),
        ]
        for var in variations:
            if var in logo_urls:
                logo_url = logo_urls[var]
                break
    
    if not logo_url:
        # Fallback: try Clearbit
        domain = courier_key.replace(" ", "").replace("-", "")
        logo_url = f'https://logo.clearbit.com/{domain}.com'
    
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            # Add user agent to avoid blocking
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = await client.get(logo_url, headers=headers)
            
            if response.status_code == 200 and len(response.content) > 0:
                # Determine content type
                content_type = response.headers.get('content-type', 'image/png')
                if 'svg' in logo_url.lower() or 'svg' in content_type.lower():
                    content_type = 'image/svg+xml'
                elif 'png' in content_type.lower():
                    content_type = 'image/png'
                elif 'jpeg' in content_type.lower() or 'jpg' in content_type.lower():
                    content_type = 'image/jpeg'
                
                return Response(
                    content=response.content,
                    media_type=content_type,
                    headers={
                        'Cache-Control': 'public, max-age=86400',  # Cache for 1 day
                        'Access-Control-Allow-Origin': '*',
                    }
                )
            else:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Logo not found (status: {response.status_code})"
                )
    except httpx.TimeoutException:
        # Return a simple SVG placeholder
        svg_placeholder = f'''<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="100" fill="#f3f4f6"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">{courier_name}</text>
</svg>'''
        return Response(
            content=svg_placeholder.encode('utf-8'),
            media_type='image/svg+xml',
            headers={'Cache-Control': 'public, max-age=3600'}
        )
    except httpx.RequestError as e:
        # Return a simple SVG placeholder
        svg_placeholder = f'''<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="100" fill="#f3f4f6"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">{courier_name}</text>
</svg>'''
        return Response(
            content=svg_placeholder.encode('utf-8'),
            media_type='image/svg+xml',
            headers={'Cache-Control': 'public, max-age=3600'}
        )
    except Exception as e:
        # Return a simple SVG placeholder as fallback
        svg_placeholder = f'''<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="100" fill="#f3f4f6"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">{courier_name}</text>
</svg>'''
        return Response(
            content=svg_placeholder.encode('utf-8'),
            media_type='image/svg+xml',
            headers={'Cache-Control': 'public, max-age=3600'}
        )

