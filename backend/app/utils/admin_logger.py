"""
Admin action logging utilities
"""
from typing import Optional
from datetime import datetime
from app.utils.logger import admin_logger
from app.utils.log_sanitizer import LogSanitizer


def log_admin_action(
    action: str,
    resource: str,
    resource_id: Optional[str] = None,
    user: Optional[str] = None,
    request_id: Optional[str] = None,
    additional_data: Optional[dict] = None
):
    """
    Log admin action
    
    Args:
        action: Action type (CREATE, UPDATE, DELETE, READ, etc.)
        resource: Resource type (page, courier, pricing_rule, etc.)
        resource_id: ID of the resource
        user: Username performing the action
        request_id: Request ID for correlation
        additional_data: Any additional context (will be sanitized)
    """
    log_data = {
        "type": "admin",
        "action": action.upper(),
        "resource": resource,
        "resource_id": resource_id,
        "user": user,
        "request_id": request_id,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    # Add additional data if provided (sanitized)
    if additional_data:
        log_data["additional"] = LogSanitizer.sanitize_dict(additional_data, "admin")
    
    # Log with admin logger
    admin_logger.bind(**log_data).info(
        f"Admin action: {action.upper()} {resource}" + (f" ({resource_id})" if resource_id else "")
    )


def log_content_update(
    page_id: str,
    user: str,
    request_id: Optional[str] = None
):
    """Log content page update"""
    log_admin_action(
        action="UPDATE",
        resource="page",
        resource_id=page_id,
        user=user,
        request_id=request_id
    )


def log_courier_action(
    action: str,
    courier_id: Optional[str] = None,
    user: Optional[str] = None,
    request_id: Optional[str] = None
):
    """Log courier management action"""
    log_admin_action(
        action=action,
        resource="courier",
        resource_id=courier_id,
        user=user,
        request_id=request_id
    )


def log_pricing_rule_action(
    action: str,
    rule_id: Optional[str] = None,
    user: Optional[str] = None,
    request_id: Optional[str] = None
):
    """Log pricing rule management action"""
    log_admin_action(
        action=action,
        resource="pricing_rule",
        resource_id=rule_id,
        user=user,
        request_id=request_id
    )


def log_media_action(
    action: str,
    file_id: Optional[str] = None,
    user: Optional[str] = None,
    request_id: Optional[str] = None
):
    """Log media management action"""
    log_admin_action(
        action=action,
        resource="media",
        resource_id=file_id,
        user=user,
        request_id=request_id
    )


def log_settings_update(
    user: str,
    request_id: Optional[str] = None
):
    """Log settings update"""
    log_admin_action(
        action="UPDATE",
        resource="settings",
        resource_id=None,
        user=user,
        request_id=request_id
    )

