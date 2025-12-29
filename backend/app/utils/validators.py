"""
Input validation utilities
"""
from typing import Optional
import re


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Validate phone number (basic validation)"""
    # Remove spaces, dashes, parentheses
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    # Check if it's digits with optional + prefix
    return bool(re.match(r'^\+?[1-9]\d{9,14}$', cleaned))


def validate_tracking_number(tracking_id: str) -> bool:
    """Validate tracking number format (alphanumeric, 6-20 chars)"""
    return bool(re.match(r'^[A-Za-z0-9]{6,20}$', tracking_id))


def validate_weight(weight: float) -> tuple[bool, Optional[str]]:
    """Validate weight (must be positive, reasonable max)"""
    if weight <= 0:
        return False, "Weight must be greater than 0"
    if weight > 1000:  # 1000 kg max
        return False, "Weight exceeds maximum limit (1000 kg)"
    return True, None


def validate_distance(distance: float) -> tuple[bool, Optional[str]]:
    """Validate distance (must be positive, reasonable max)"""
    if distance <= 0:
        return False, "Distance must be greater than 0"
    if distance > 10000:  # 10000 km max
        return False, "Distance exceeds maximum limit (10000 km)"
    return True, None

