"""
Admin API endpoints (authentication required)
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.json_handler import JSONHandler
from app.utils.file_handler import FileHandler
from app.auth import verify_password, get_password_hash, verify_token, create_access_token
from app.models.admin import (
    AdminLogin, AdminResponse, DashboardStats,
    ProfileUpdate, PasswordChange, ProfileResponse
)
from app.models.content import (
    PageContent, SectionUpdate, CourierCreate, CourierUpdate,
    PricingRuleCreate, PricingRuleUpdate, SettingsUpdate,
    PricingImportAnalyzeResponse, ImportPreviewRequest, ImportPreviewResponse,
    ImportExecuteRequest, ImportResult, ColumnMapping
)
from app.models.chat import (
    UsageStatsResponse, UsageLogsResponse, PricingConfigResponse, PricingConfigUpdate,
    ModelsListResponse, BulkPricingUpdate, PromptResponse, PromptUpdate,
    PromptGenerateRequest, PromptGenerateResponse
)
from app.services.file_parser import file_parser
from app.services.column_mapper import column_mapper
from app.services.pricing_importer import pricing_importer
from app.services.zone_detector import zone_detector
from app.services.matrix_transformer import matrix_transformer
from app.services.chat_usage_stats import chat_usage_stats
from app.services.chat_pricing import chat_pricing_manager
from app.services.chat_prompt_manager import chat_prompt_manager
from app.config import settings
from app.middleware import rate_limit_login
from app.utils.admin_logger import (
    log_content_update, log_courier_action, log_pricing_rule_action,
    log_media_action, log_settings_update
)
from fastapi import Request
from typing import List, Optional
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


# Profile Management Endpoints
@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_admin: str = Depends(get_current_admin)):
    """Get current admin profile"""
    admin_data = json_handler.read("admin.json")
    users = admin_data.get("users", [])
    
    user = next((u for u in users if u.get("username") == current_admin), None)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Ensure all fields are present (handle legacy data)
    return ProfileResponse(
        username=user.get("username"),
        email=user.get("email"),
        full_name=user.get("full_name"),
        description=user.get("description"),
        phone=user.get("phone"),
        avatar=user.get("avatar"),
        created_at=user.get("created_at", datetime.utcnow().isoformat()),
        last_login=user.get("last_login"),
        updated_at=user.get("updated_at")
    )


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    profile_update: ProfileUpdate,
    current_admin: str = Depends(get_current_admin)
):
    """Update admin profile"""
    admin_data = json_handler.read("admin.json")
    users = admin_data.get("users", [])
    
    user_idx = next((i for i, u in enumerate(users) if u.get("username") == current_admin), -1)
    
    if user_idx == -1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    user = users[user_idx]
    update_data = profile_update.model_dump(exclude_unset=True)
    
    # Start basic update
    user.update(update_data)
    user["updated_at"] = datetime.utcnow().isoformat()
    
    # Save back
    users[user_idx] = user
    admin_data["users"] = users
    json_handler.write("admin.json", admin_data)
    
    # Log action
    from app.utils.admin_logger import log_admin_action
    log_admin_action("UPDATE_PROFILE", "auth", current_admin)
    
    return ProfileResponse(
        username=user.get("username"),
        email=user.get("email"),
        full_name=user.get("full_name"),
        description=user.get("description"),
        phone=user.get("phone"),
        avatar=user.get("avatar"),
        created_at=user.get("created_at", datetime.utcnow().isoformat()),
        last_login=user.get("last_login"),
        updated_at=user.get("updated_at")
    )


@router.post("/profile/password")
async def change_password(
    password_data: PasswordChange,
    current_admin: str = Depends(get_current_admin)
):
    """Change admin password"""
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )
        
    admin_data = json_handler.read("admin.json")
    users = admin_data.get("users", [])
    
    user_idx = next((i for i, u in enumerate(users) if u.get("username") == current_admin), -1)
    
    if user_idx == -1:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    user = users[user_idx]
    
    # Verify current password
    if not verify_password(password_data.current_password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
        
    # Update password
    user["password_hash"] = get_password_hash(password_data.new_password)
    user["updated_at"] = datetime.utcnow().isoformat()
    
    users[user_idx] = user
    admin_data["users"] = users
    json_handler.write("admin.json", admin_data)
    
    # Log action
    from app.utils.admin_logger import log_admin_action
    log_admin_action("CHANGE_PASSWORD", "auth", current_admin)
    
    return {"message": "Password changed successfully"}


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
    
    # Get chat usage summary (fail-safe)
    chat_usage_today = None
    chat_usage_week = None
    chat_usage_month = None
    try:
        chat_summary = chat_usage_stats.get_summary()
        chat_usage_today = chat_summary.get("today")
        chat_usage_week = chat_summary.get("week")
        chat_usage_month = chat_summary.get("month")
    except Exception as e:
        from app.utils.logger import logger
        logger.error(f"Failed to get chat usage summary: {str(e)}", exc_info=True)
    
    return DashboardStats(
        total_pages=len(pages),
        active_couriers=active_couriers,
        media_count=media_count,
        pricing_rules_count=len(pricing_rules),
        calculator_usage_count=analytics.get("calculator_usage_count", 0),
        tracking_redirect_count=analytics.get("tracking_redirect_count", 0),
        last_content_update=last_update,
        chat_usage_today=chat_usage_today,
        chat_usage_week=chat_usage_week,
        chat_usage_month=chat_usage_month
    )


# Content Management Endpoints
@router.get("/content/pages")
async def get_all_pages(current_admin: str = Depends(get_current_admin)):
    """Get all pages summary"""
    pages = json_handler.read("pages.json")
    
    pages_list = []
    for page_id, data in pages.items():
        pages_list.append({
            "id": page_id,
            "lastModified": data.get("lastModified"),
            "published": data.get("published", True),
            # In a real app we might store author, for now hardcode or infer
            "author": "Admin" 
        })
        
    return pages_list


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
        "size": len(file_content),
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


# Pricing Import
@router.post("/pricing/import/analyze", response_model=PricingImportAnalyzeResponse)
async def analyze_import_file(
    request: Request,
    file: UploadFile = File(...),
    current_admin: str = Depends(get_current_admin)
):
    """
    Analyze uploaded Excel/CSV file for pricing import
    Returns column names, sample rows, and total row count
    """
    try:
        # Parse file
        result = await file_parser.parse_file(file)
        
        # Detect zones
        zone_detection = zone_detector.detect_zones(result["columns"])
        
        # Determine import type
        import_type = "zone_based" if zone_detection["is_zone_based"] else "standard"
        
        # Generate mapping suggestions
        mapping_suggestions = column_mapper.suggest_mappings(result["columns"])
        
        # Log admin action
        request_id = getattr(request.state, "request_id", None)
        log_pricing_rule_action(
            action="IMPORT_ANALYZE",
            rule_id=None,
            user=current_admin,
            request_id=request_id
        )
        
        return PricingImportAnalyzeResponse(
            file_id=result["file_id"],
            columns=result["columns"],
            sample_rows=result["sample_rows"],
            total_rows=result["total_rows"],
            mapping_suggestions=mapping_suggestions,
            zone_detection=zone_detection,
            import_type=import_type
        )
    except HTTPException:
        raise
    except Exception as e:
        from app.utils.logger import logger
        logger.error(f"Error analyzing import file: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing file: {str(e)}"
        )


@router.post("/pricing/import/preview", response_model=ImportPreviewResponse)
async def preview_import(
    request: Request,
    preview_data: ImportPreviewRequest,
    current_admin: str = Depends(get_current_admin)
):
    """
    Preview import with column mapping
    Returns preview rows, validation errors, and statistics
    """
    try:
        # Load file data
        file_data = file_parser.get_file_data(preview_data.file_id)
        if not file_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File data not found. Please re-upload the file."
            )
        rows = file_data.get("rows", [])
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data rows found in the uploaded file."
            )
        
        # Validate mapping - convert ColumnMapping objects to dicts
        mapping_dict = {}
        for col_name, mapping in preview_data.column_mapping.items():
            if isinstance(mapping, dict):
                mapping_dict[col_name] = mapping
            else:
                # Convert ColumnMapping Pydantic model to dict
                mapping_dict[col_name] = {
                    "mapped_field": mapping.mapped_field,
                    "field_type": mapping.field_type,
                    "show_in_ui": mapping.show_in_ui,
                    "custom_field_name": mapping.custom_field_name
                }
        
        mapping_errors = column_mapper.validate_mapping(mapping_dict)
        if mapping_errors:
            # Format mapping errors as a user-friendly message
            error_messages = []
            for err in mapping_errors:
                if isinstance(err, dict):
                    error_messages.append(err.get("message", str(err)))
                else:
                    error_messages.append(str(err))
            error_message = ". ".join(error_messages) if error_messages else "Invalid column mapping"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        # Load couriers for validation
        couriers = json_handler.read_list("couriers.json")
        courier_ids = {c.get("id", "").lower(): c.get("id", "") for c in couriers}
        courier_names = {c.get("name", "").lower(): c.get("id", "") for c in couriers}
        
        # Load existing rules for duplicate detection
        existing_rules = json_handler.read_list("pricing_rules.json")
        
        # Process rows and validate
        preview_rows = []
        errors = []
        stats = {
            "will_create": 0,
            "will_update": 0,
            "will_skip": 0,
            "total_valid": 0,
            "total_errors": 0
        }
        
        # Process first 20 rows for preview
        preview_count = min(20, len(rows))
        
        for row_idx, row in enumerate(rows[:preview_count]):
            row_errors = []
            mapped_data = {}
            
            # Apply mapping
            for column_name, mapping_config in preview_data.column_mapping.items():
                # Handle both dict and ColumnMapping object
                if isinstance(mapping_config, dict):
                    mapped_field = mapping_config.get("mapped_field")
                    custom_field_name = mapping_config.get("custom_field_name")
                else:
                    mapped_field = mapping_config.mapped_field if hasattr(mapping_config, 'mapped_field') else None
                    custom_field_name = mapping_config.custom_field_name if hasattr(mapping_config, 'custom_field_name') else None
                
                if not mapped_field or mapped_field == "":
                    # Unmapped column - skip
                    continue
                
                if mapped_field == "custom":
                    # Custom field
                    if column_name in row:
                        if custom_field_name:
                            mapped_data[f"custom_{custom_field_name}"] = row[column_name]
                        else:
                            mapped_data[f"custom_{column_name}"] = row[column_name]
                    continue
                
                # Get value from row
                value = row.get(column_name, "")
                
                # Validate based on field type
                if mapped_field == "courier":
                    # Validate courier exists
                    value_lower = str(value).lower().strip()
                    courier_id = courier_ids.get(value_lower) or courier_names.get(value_lower)
                    if not courier_id:
                        row_errors.append({
                            "row": row_idx + 1,
                            "column": column_name,
                            "error": f"Courier '{value}' not found in system",
                            "value": value
                        })
                    else:
                        mapped_data["courier"] = courier_id
                
                elif mapped_field in ["weight_min", "weight_max", "distance_min", "distance_max", "price_per_kg", "base_price"]:
                    # Validate numeric
                    try:
                        num_value = float(value) if value else 0
                        if num_value < 0:
                            row_errors.append({
                                "row": row_idx + 1,
                                "column": column_name,
                                "error": f"Value must be positive, got: {value}",
                                "value": value
                            })
                        else:
                            mapped_data[mapped_field] = num_value
                    except (ValueError, TypeError):
                        row_errors.append({
                            "row": row_idx + 1,
                            "column": column_name,
                            "error": f"Invalid number: {value}",
                            "value": value
                        })
                else:
                    mapped_data[mapped_field] = value
            
            # Validate required fields
            if "courier" not in mapped_data:
                row_errors.append({
                    "row": row_idx + 1,
                    "column": "courier",
                    "error": "Courier is required",
                    "value": ""
                })
            
            if "weight_min" not in mapped_data or "weight_max" not in mapped_data:
                row_errors.append({
                    "row": row_idx + 1,
                    "column": "weight",
                    "error": "Weight min and max are required",
                    "value": ""
                })
            
            # Determine import action for stats (only if no errors)
            if not row_errors:
                if preview_data.import_mode == "update" or preview_data.import_mode == "update_create":
                    # Check if rule exists
                    courier = mapped_data.get("courier")
                    weight_min = mapped_data.get("weight_min")
                    weight_max = mapped_data.get("weight_max")
                    
                    if courier and weight_min is not None and weight_max is not None:
                        duplicate = next((
                            r for r in existing_rules
                            if r.get("courier") == courier
                            and r.get("weight_range", {}).get("min") == weight_min
                            and r.get("weight_range", {}).get("max") == weight_max
                        ), None)
                        if duplicate:
                            stats["will_update"] += 1
                        else:
                            stats["will_create"] += 1
                    else:
                        stats["will_create"] += 1
                elif preview_data.import_mode == "skip_duplicates":
                    # Check for duplicate
                    courier = mapped_data.get("courier")
                    weight_min = mapped_data.get("weight_min")
                    weight_max = mapped_data.get("weight_max")
                    
                    if courier and weight_min is not None and weight_max is not None:
                        duplicate = next((
                            r for r in existing_rules
                            if r.get("courier") == courier
                            and r.get("weight_range", {}).get("min") == weight_min
                            and r.get("weight_range", {}).get("max") == weight_max
                        ), None)
                        if duplicate:
                            stats["will_skip"] += 1
                        else:
                            stats["will_create"] += 1
                    else:
                        stats["will_create"] += 1
                else:
                    # Default: create mode
                    stats["will_create"] += 1
            
            # Add to preview
            preview_rows.append({
                "row_number": row_idx + 1,
                "data": mapped_data,
                "original_row": row,
                "has_errors": len(row_errors) > 0
            })
            
            # Add errors
            if row_errors:
                errors.extend(row_errors)
                stats["total_errors"] += len(row_errors)
            else:
                stats["total_valid"] += 1
        
        # Log admin action
        request_id = getattr(request.state, "request_id", None)
        log_pricing_rule_action(
            action="IMPORT_PREVIEW",
            rule_id=None,
            user=current_admin,
            request_id=request_id
        )
        
        return ImportPreviewResponse(
            preview_rows=preview_rows,
            errors=errors,
            stats=stats
        )
        
    except HTTPException:
        raise
    except Exception as e:
        from app.utils.logger import logger
        logger.error(f"Error generating import preview: {str(e)}", exc_info=True)
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating preview: {str(e)}"
        )


@router.post("/pricing/import/execute", response_model=ImportResult)
async def execute_import(
    request: Request,
    execute_data: ImportExecuteRequest,
    current_admin: str = Depends(get_current_admin)
):
    """
    Execute the pricing import
    Creates/updates pricing rules based on uploaded file and column mapping
    """
    try:
        # Handle zone-based imports
        if execute_data.import_type == "zone_based":
            # Get file data
            file_data = file_parser.get_file_data(execute_data.file_id)
            if not file_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="File data not found. Please re-upload the file."
                )
            
            rows = file_data.get("rows", [])
            if not rows:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No data rows found in the uploaded file."
                )
            
            # Get zone detection from file analysis (we need to re-analyze or store it)
            # For now, detect zones from columns
            zone_detection = zone_detector.detect_zones(file_data.get("columns", []))
            
            if not zone_detection["is_zone_based"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Zone-based import requested but no zones detected in file."
                )
            
            if not execute_data.courier:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Courier is required for zone-based imports."
                )
            
            if not zone_detection["weight_column"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Weight column not detected. Please ensure your file has a weight column."
                )
            
            # Transform matrix data
            transformed_rules, transform_errors = matrix_transformer.transform_matrix_data(
                rows=rows,
                zone_columns=zone_detection["zone_columns"],
                weight_column=zone_detection["weight_column"],
                courier=execute_data.courier,
                weight_conversion_method=execute_data.weight_conversion_method or "point_to_range",
                service_type=execute_data.service_type
            )
            
            # Import the transformed rules
            result = pricing_importer.execute_zone_based_import(
                rules=transformed_rules,
                import_mode=execute_data.import_mode,
                errors=transform_errors
            )
        else:
            # Standard import (existing logic)
            # Convert ColumnMapping objects to dicts
            mapping_dict = {}
            for col_name, mapping in execute_data.column_mapping.items():
                if isinstance(mapping, dict):
                    mapping_dict[col_name] = mapping
                else:
                    # Convert ColumnMapping Pydantic model to dict
                    mapping_dict[col_name] = {
                        "mapped_field": mapping.mapped_field,
                        "field_type": mapping.field_type,
                        "show_in_ui": mapping.show_in_ui,
                        "custom_field_name": mapping.custom_field_name
                    }
            
            # Execute import
            result = pricing_importer.execute_import(
                file_id=execute_data.file_id,
                column_mapping=mapping_dict,
                import_mode=execute_data.import_mode
            )
        
        # Log admin action
        request_id = getattr(request.state, "request_id", None)
        log_pricing_rule_action(
            action="IMPORT_EXECUTE",
            rule_id=None,
            user=current_admin,
            request_id=request_id
        )
        
        return ImportResult(
            success_count=result["success_count"],
            error_count=result["error_count"],
            skipped_count=result.get("skipped_count", 0),
            errors=result["errors"],
            imported_rules=result["imported_rules"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        from app.utils.logger import logger
        logger.error(f"Error executing import: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing import: {str(e)}"
        )


# Chat Usage API Endpoints
@router.get("/chat/usage/stats", response_model=UsageStatsResponse)
async def get_chat_usage_stats(
    period: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_admin: str = Depends(get_current_admin)
):
    """
    Get chat usage statistics for a period
    
    Query params:
    - period: today|7d|15d|30d|month|custom
    - start_date: ISO date string (required if period=custom)
    - end_date: ISO date string (required if period=custom)
    """
    try:
        return chat_usage_stats.get_stats(period, start_date, end_date)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        from app.utils.logger import logger
        logger.error(f"Error getting chat usage stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving usage statistics"
        )


@router.get("/chat/usage/logs", response_model=UsageLogsResponse)
async def get_chat_usage_logs(
    page: int = 1,
    limit: int = 50,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_admin: str = Depends(get_current_admin)
):
    """
    Get paginated chat usage logs
    
    Query params:
    - page: Page number (default: 1)
    - limit: Items per page (default: 50, max: 500)
    - start_date: Start date filter (ISO format, optional)
    - end_date: End date filter (ISO format, optional)
    """
    try:
        return chat_usage_stats.get_logs(page, limit, start_date, end_date)
    except Exception as e:
        from app.utils.logger import logger
        logger.error(f"Error getting chat usage logs: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving usage logs"
        )


@router.get("/chat/pricing", response_model=PricingConfigResponse)
async def get_chat_pricing(current_admin: str = Depends(get_current_admin)):
    """Get chat pricing configuration"""
    try:
        pricing_config = chat_pricing_manager.get_pricing_config()
        return PricingConfigResponse(models=pricing_config)
    except Exception as e:
        from app.utils.logger import logger
        logger.error(f"Error getting chat pricing: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving pricing configuration"
        )


@router.put("/chat/pricing", response_model=PricingConfigResponse)
async def update_chat_pricing(
    pricing_update: PricingConfigUpdate,
    current_admin: str = Depends(get_current_admin)
):
    """Update chat pricing configuration for a single model"""
    try:
        updated_config = chat_pricing_manager.update_pricing_config(
            model=pricing_update.model,
            input_price_per_million=pricing_update.input_price_per_million,
            output_price_per_million=pricing_update.output_price_per_million,
            currency=pricing_update.currency,
            speed_tps=pricing_update.speed_tps,
            context_window=pricing_update.context_window
        )
        return PricingConfigResponse(models=updated_config)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        from app.utils.logger import logger
        logger.error(f"Error updating chat pricing: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating pricing configuration"
        )


@router.put("/chat/pricing/bulk", response_model=PricingConfigResponse)
async def bulk_update_chat_pricing(
    bulk_update: BulkPricingUpdate,
    current_admin: str = Depends(get_current_admin)
):
    """Bulk update chat pricing configuration for multiple models"""
    try:
        if not bulk_update.updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No updates provided"
            )
        
        updated_config = chat_pricing_manager.bulk_update_pricing(bulk_update.updates)
        return PricingConfigResponse(models=updated_config)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        from app.utils.logger import logger
        logger.error(f"Error bulk updating chat pricing: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error bulk updating pricing configuration"
        )


# Chat Prompt Management API Endpoints
@router.get("/chat/prompt", response_model=PromptResponse)
async def get_chat_prompt(current_admin: str = Depends(get_current_admin)):
    """Get current chat prompt"""
    try:
        prompt_text = chat_prompt_manager.get_prompt()
        # Get metadata
        data = json_handler.read(settings.CHAT_PROMPT_FILE)
        last_updated_str = data.get("metadata", {}).get("last_updated", "2024-01-15T00:00:00Z") if data else "2024-01-15T00:00:00Z"
        last_updated = datetime.fromisoformat(last_updated_str.replace('Z', '+00:00'))
        
        return PromptResponse(
            prompt=prompt_text,
            last_updated=last_updated
        )
    except Exception as e:
        from app.utils.logger import logger
        logger.error(f"Error getting chat prompt: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving chat prompt"
        )


@router.put("/chat/prompt", response_model=PromptResponse)
async def update_chat_prompt(
    prompt_update: PromptUpdate,
    current_admin: str = Depends(get_current_admin)
):
    """Update chat prompt"""
    try:
        updated_data = chat_prompt_manager.update_prompt(
            prompt_text=prompt_update.prompt,
            updated_by=current_admin
        )
        
        last_updated_str = updated_data.get("metadata", {}).get("last_updated", "2024-01-15T00:00:00Z")
        last_updated = datetime.fromisoformat(last_updated_str.replace('Z', '+00:00'))
        
        return PromptResponse(
            prompt=updated_data["prompt"],
            last_updated=last_updated
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        from app.utils.logger import logger
        logger.error(f"Error updating chat prompt: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating chat prompt"
        )


@router.post("/chat/prompt/generate", response_model=PromptGenerateResponse)
async def generate_chat_prompt(
    generate_request: PromptGenerateRequest,
    current_admin: str = Depends(get_current_admin)
):
    """Generate enhanced prompt from raw input text using LLM"""
    try:
        generated_prompt = chat_prompt_manager.generate_prompt(generate_request.input_text)
        
        return PromptGenerateResponse(prompt=generated_prompt)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        from app.utils.logger import logger
        logger.error(f"Error generating chat prompt: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating chat prompt"
        )


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


# Avatar Upload
@router.post("/upload/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_admin: str = Depends(get_current_admin)
):
    """Upload admin avatar"""
    # 1. Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # 2. Save file
    try:
        # Use file_handler to save to "avatars" subdirectory
        # Note: file_handler.save expects a subfolder relative to UPLOADS_DIR
        file_path = await file_handler.save(file, "avatars")
        
        # 3. Construct URL
        # Assumption: Static files are served from /static/uploads
        avatar_url = f"/static/uploads/{file_path}"
        
        return {"url": avatar_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )
