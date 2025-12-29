"""
Admin API endpoints (authentication required)
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.json_handler import JSONHandler
from app.utils.file_handler import FileHandler
from app.auth import verify_password, get_password_hash, verify_token, create_access_token
from app.models.admin import AdminLogin, AdminResponse, DashboardStats
from app.models.content import (
    PageContent, SectionUpdate, CourierCreate, CourierUpdate,
    PricingRuleCreate, PricingRuleUpdate, SettingsUpdate
)
from app.config import settings
from app.middleware import rate_limit_login
from app.utils.admin_logger import (
    log_content_update, log_courier_action, log_pricing_rule_action,
    log_media_action, log_settings_update
)
from fastapi import Request
from typing import List
from datetime import datetime
import uuid

router = APIRouter()
json_handler = JSONHandler(settings.DATA_DIR)
file_handler = FileHandler(settings.UPLOADS_DIR)
security = HTTPBearer()


def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to verify admin authentication"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    return username


@router.post("/login", response_model=AdminResponse)
async def admin_login(request: Request, login_data: AdminLogin):
    """Admin login"""
    
    # Rate limiting
    if not rate_limit_login(request):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )
    
    # Load admin users
    admin_data = json_handler.read("admin.json")
    users = admin_data.get("users", [])
    
    # Find user
    user = next((u for u in users if u.get("username") == login_data.username), None)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Update last login
    user["last_login"] = datetime.utcnow().isoformat()
    json_handler.write("admin.json", admin_data)
    
    # Create token
    access_token = create_access_token(data={"sub": login_data.username})
    
    # Log successful login (no sensitive data)
    request_id = getattr(request.state, "request_id", None)
    from app.utils.admin_logger import log_admin_action
    log_admin_action(
        action="LOGIN",
        resource="auth",
        user=login_data.username,
        request_id=request_id
    )
    
    return AdminResponse(
        access_token=access_token,
        username=login_data.username
    )


@router.post("/logout")
async def admin_logout(current_admin: str = Depends(get_current_admin)):
    """Admin logout (client-side token removal)"""
    return {"message": "Logged out successfully"}


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_admin: str = Depends(get_current_admin)):
    """Get dashboard statistics"""
    
    pages = json_handler.read("pages.json")
    couriers = json_handler.read_list("couriers.json")
    media = json_handler.read("media.json")
    pricing_rules = json_handler.read_list("pricing_rules.json")
    analytics = json_handler.read("analytics.json")
    
    # Count active couriers
    active_couriers = len([c for c in couriers if c.get("active", True)])
    
    # Count media
    media_list = media.get("files", [])
    media_count = len(media_list)
    
    # Get last content update
    last_update = None
    for page_id, page_data in pages.items():
        page_modified = page_data.get("lastModified")
        if page_modified:
            page_dt = datetime.fromisoformat(page_modified.replace('Z', '+00:00'))
            if last_update is None or page_dt > last_update:
                last_update = page_dt
    
    return DashboardStats(
        total_pages=len(pages),
        active_couriers=active_couriers,
        media_count=media_count,
        pricing_rules_count=len(pricing_rules),
        calculator_usage_count=analytics.get("calculator_usage_count", 0),
        tracking_redirect_count=analytics.get("tracking_redirect_count", 0),
        last_content_update=last_update
    )


# Content Management Endpoints
@router.get("/content/{page_id}")
async def get_page_content(page_id: str, current_admin: str = Depends(get_current_admin)):
    """Get page content for editing"""
    pages = json_handler.read("pages.json")
    
    if page_id not in pages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page '{page_id}' not found"
        )
    
    return pages[page_id]


@router.put("/content/{page_id}")
async def update_page_content(
    request: Request,
    page_id: str,
    content: PageContent,
    current_admin: str = Depends(get_current_admin)
):
    """Update page content"""
    pages = json_handler.read("pages.json")
    
    if page_id not in pages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page '{page_id}' not found"
        )
    
    # Update content
    content_dict = content.model_dump()
    content_dict["lastModified"] = datetime.utcnow().isoformat()
    pages[page_id] = content_dict
    
    json_handler.write("pages.json", pages)
    
    # Log admin action
    request_id = getattr(request.state, "request_id", None)
    log_content_update(page_id, current_admin, request_id)
    
    return {"message": "Page updated successfully", "page_id": page_id}


@router.patch("/sections/{section_id}")
async def toggle_section(
    section_id: str,
    update: SectionUpdate,
    current_admin: str = Depends(get_current_admin)
):
    """Toggle section enable/disable"""
    sections = json_handler.read("sections.json")
    
    # Parse section_id (format: "page_id.section_name")
    parts = section_id.split(".", 1)
    if len(parts) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid section ID format. Use 'page_id.section_name'"
        )
    
    page_id, section_name = parts
    
    if page_id not in sections:
        sections[page_id] = {}
    
    if section_name not in sections[page_id]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Section '{section_id}' not found"
        )
    
    sections[page_id][section_name]["enabled"] = update.enabled
    json_handler.write("sections.json", sections)
    
    return {"message": "Section updated successfully", "section_id": section_id}


# Media Management Endpoints
@router.post("/media/upload")
async def upload_media(
    request: Request,
    file: UploadFile = File(...),
    current_admin: str = Depends(get_current_admin)
):
    """Upload media file"""
    
    # Read file content
    file_content = await file.read()
    
    # Validate file
    is_valid, error_msg = file_handler.validate_file(file.filename, len(file_content))
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Save file
    filename, relative_path = file_handler.save_file(file_content, file.filename)
    
    # Update media.json
    media = json_handler.read("media.json")
    if "files" not in media:
        media["files"] = []
    
    file_id = str(uuid.uuid4())
    media["files"].append({
        "id": file_id,
        "filename": filename,
        "original_name": file.filename,
        "path": relative_path,
        "uploaded_at": datetime.utcnow().isoformat(),
        "uploaded_by": current_admin
    })
    
    json_handler.write("media.json", media)
    
    # Log admin action
    request_id = getattr(request.state, "request_id", None)
    log_media_action("UPLOAD", file_id, current_admin, request_id)
    
    return {
        "message": "File uploaded successfully",
        "filename": filename,
        "path": relative_path
    }


@router.get("/media")
async def list_media(current_admin: str = Depends(get_current_admin)):
    """List all media files"""
    media = json_handler.read("media.json")
    return media.get("files", [])


@router.delete("/media/{file_id}")
async def delete_media(
    request: Request,
    file_id: str,
    current_admin: str = Depends(get_current_admin)
):
    """Delete media file"""
    media = json_handler.read("media.json")
    files = media.get("files", [])
    
    file_to_delete = next((f for f in files if f.get("id") == file_id), None)
    
    if not file_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Delete physical file
    file_handler.delete_file(file_to_delete["filename"])
    
    # Remove from media.json
    media["files"] = [f for f in files if f.get("id") != file_id]
    json_handler.write("media.json", media)
    
    # Log admin action
    request_id = getattr(request.state, "request_id", None)
    log_media_action("DELETE", file_id, current_admin, request_id)
    
    return {"message": "File deleted successfully"}


# Courier Management Endpoints
@router.get("/couriers")
async def list_couriers(current_admin: str = Depends(get_current_admin)):
    """List all couriers (admin view)"""
    couriers = json_handler.read_list("couriers.json")
    return couriers


@router.post("/couriers")
async def create_courier(
    request: Request,
    courier: CourierCreate,
    current_admin: str = Depends(get_current_admin)
):
    """Create new courier"""
    couriers = json_handler.read_list("couriers.json")
    
    # Generate ID from name (lowercase, replace spaces with underscores)
    courier_id = courier.name.lower().replace(" ", "_").replace("-", "_")
    
    # Check if ID already exists
    existing_ids = [c.get("id") for c in couriers]
    if courier_id in existing_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Courier with ID '{courier_id}' already exists"
        )
    
    new_courier = {
        "id": courier_id,
        "name": courier.name,
        "logo": courier.logo,
        "tracking_url": courier.tracking_url,
        "description": courier.description,
        "active": True,
        "display_order": courier.display_order
    }
    
    couriers.append(new_courier)
    json_handler.write_list("couriers.json", couriers)
    
    # Log admin action
    request_id = getattr(request.state, "request_id", None)
    log_courier_action("CREATE", courier_id, current_admin, request_id)
    
    return {"message": "Courier created successfully", "courier": new_courier}


@router.put("/couriers/{courier_id}")
async def update_courier(
    request: Request,
    courier_id: str,
    courier_update: CourierUpdate,
    current_admin: str = Depends(get_current_admin)
):
    """Update courier"""
    couriers = json_handler.read_list("couriers.json")
    
    courier = next((c for c in couriers if c.get("id") == courier_id), None)
    
    if not courier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Courier not found"
        )
    
    # Update fields
    update_data = courier_update.model_dump(exclude_unset=True)
    courier.update(update_data)
    
    json_handler.write_list("couriers.json", couriers)
    
    # Log admin action
    request_id = getattr(request.state, "request_id", None)
    log_courier_action("UPDATE", courier_id, current_admin, request_id)
    
    return {"message": "Courier updated successfully", "courier": courier}


@router.delete("/couriers/{courier_id}")
async def delete_courier(
    request: Request,
    courier_id: str,
    current_admin: str = Depends(get_current_admin)
):
    """Delete courier"""
    success = json_handler.delete_item("couriers.json", courier_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Courier not found"
        )
    
    # Log admin action
    request_id = getattr(request.state, "request_id", None)
    log_courier_action("DELETE", courier_id, current_admin, request_id)
    
    return {"message": "Courier deleted successfully"}


# Pricing Rules Management
@router.get("/pricing/rules")
async def list_pricing_rules(current_admin: str = Depends(get_current_admin)):
    """List all pricing rules"""
    rules = json_handler.read_list("pricing_rules.json")
    return rules


@router.post("/pricing/rules")
async def create_pricing_rule(
    request: Request,
    rule: PricingRuleCreate,
    current_admin: str = Depends(get_current_admin)
):
    """Create new pricing rule"""
    rules = json_handler.read_list("pricing_rules.json")
    
    rule_id = str(uuid.uuid4())
    new_rule = {
        "id": rule_id,
        **rule.model_dump()
    }
    
    rules.append(new_rule)
    json_handler.write_list("pricing_rules.json", rules)
    
    # Log admin action
    request_id = getattr(request.state, "request_id", None)
    log_pricing_rule_action("CREATE", rule_id, current_admin, request_id)
    
    return {"message": "Pricing rule created successfully", "rule": new_rule}


@router.put("/pricing/rules/{rule_id}")
async def update_pricing_rule(
    request: Request,
    rule_id: str,
    rule_update: PricingRuleUpdate,
    current_admin: str = Depends(get_current_admin)
):
    """Update pricing rule"""
    success = json_handler.update_item("pricing_rules.json", rule_id, rule_update.model_dump(exclude_unset=True))
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pricing rule not found"
        )
    
    # Log admin action
    request_id = getattr(request.state, "request_id", None)
    log_pricing_rule_action("UPDATE", rule_id, current_admin, request_id)
    
    return {"message": "Pricing rule updated successfully"}


@router.delete("/pricing/rules/{rule_id}")
async def delete_pricing_rule(
    request: Request,
    rule_id: str,
    current_admin: str = Depends(get_current_admin)
):
    """Delete pricing rule"""
    success = json_handler.delete_item("pricing_rules.json", rule_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pricing rule not found"
        )
    
    # Log admin action
    request_id = getattr(request.state, "request_id", None)
    log_pricing_rule_action("DELETE", rule_id, current_admin, request_id)
    
    return {"message": "Pricing rule deleted successfully"}


# Settings Management
@router.get("/settings")
async def get_settings(current_admin: str = Depends(get_current_admin)):
    """Get site settings"""
    settings_data = json_handler.read("settings.json")
    return settings_data


@router.put("/settings")
async def update_settings(
    request: Request,
    settings_update: SettingsUpdate,
    current_admin: str = Depends(get_current_admin)
):
    """Update site settings"""
    settings_data = json_handler.read("settings.json")
    
    update_dict = settings_update.model_dump(exclude_unset=True)
    
    for key, value in update_dict.items():
        if key in settings_data:
            settings_data[key].update(value)
        else:
            settings_data[key] = value
    
    json_handler.write("settings.json", settings_data)
    
    # Log admin action
    request_id = getattr(request.state, "request_id", None)
    log_settings_update(current_admin, request_id)
    
    return {"message": "Settings updated successfully", "settings": settings_data}

