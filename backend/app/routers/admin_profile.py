"""
Admin Profile Management API endpoints
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Request
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.json_handler import JSONHandler
from app.utils.file_handler import FileHandler
from app.auth import verify_password, get_password_hash, verify_token
from app.models.admin import ProfileUpdate, PasswordChange, ProfileResponse
from app.config import settings
from app.utils.admin_logger import log_admin_action
from typing import Optional, Tuple
from datetime import datetime
import re
import os
from pathlib import Path

router = APIRouter()
json_handler = JSONHandler(settings.DATA_DIR)
profile_file_handler = FileHandler(settings.PROFILES_DIR)
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


def validate_username(username: str, exclude_username: Optional[str] = None) -> bool:
    """Validate username format and uniqueness"""
    if not username or len(username) < 3 or len(username) > 30:
        return False
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False
    
    # Check uniqueness
    admin_data = json_handler.read("admin.json")
    users = admin_data.get("users", [])
    for user in users:
        if user.get("username") == username and user.get("username") != exclude_username:
            return False
    return True


def validate_email(email: Optional[str], exclude_username: Optional[str] = None) -> bool:
    """Validate email format and uniqueness"""
    if email is None:
        return True  # Email is optional
    
    # Basic email format check
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        return False
    
    # Check uniqueness
    admin_data = json_handler.read("admin.json")
    users = admin_data.get("users", [])
    for user in users:
        if user.get("email") == email and user.get("username") != exclude_username:
            return False
    return True


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, ""


def get_user_profile(username: str) -> Optional[dict]:
    """Get user profile from admin.json"""
    admin_data = json_handler.read("admin.json")
    users = admin_data.get("users", [])
    return next((u for u in users if u.get("username") == username), None)


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_admin: str = Depends(get_current_admin)):
    """Get current admin's profile"""
    user = get_user_profile(current_admin)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Build avatar URL if exists
    avatar_url = None
    if user.get("avatar"):
        avatar_url = f"/api/admin/profile/avatar/{user['avatar']}"
    
    return ProfileResponse(
        username=user.get("username", ""),
        email=user.get("email"),
        full_name=user.get("full_name"),
        description=user.get("description"),
        phone=user.get("phone"),
        avatar=avatar_url,
        created_at=datetime.fromisoformat(user.get("created_at", "2024-01-01T00:00:00Z")),
        last_login=datetime.fromisoformat(user.get("last_login")) if user.get("last_login") else None,
        updated_at=datetime.fromisoformat(user.get("updated_at")) if user.get("updated_at") else None
    )


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    request: Request,
    profile_update: ProfileUpdate,
    current_admin: str = Depends(get_current_admin)
):
    """Update admin profile"""
    admin_data = json_handler.read("admin.json")
    users = admin_data.get("users", [])
    
    # Find current user
    user_index = next((i for i, u in enumerate(users) if u.get("username") == current_admin), None)
    if user_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    user = users[user_index]
    update_dict = profile_update.model_dump(exclude_unset=True)
    
    # Validate username if being changed (validate format BEFORE checking uniqueness)
    if "username" in update_dict:
        new_username = update_dict["username"]
        # Validate format first
        if not new_username or len(new_username) < 3 or len(new_username) > 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must be between 3 and 30 characters"
            )
        if not re.match(r'^[a-zA-Z0-9_-]+$', new_username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username can only contain letters, numbers, underscores, and hyphens"
            )
        # Then check uniqueness
        if not validate_username(new_username, exclude_username=current_admin):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        user["username"] = new_username
        # Update current_admin for response
        current_admin = new_username
    
    # Validate email if being changed
    if "email" in update_dict:
        new_email = update_dict.get("email")
        if not validate_email(new_email, exclude_username=current_admin):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format or email already exists"
            )
        user["email"] = new_email
    
    # Validate description length
    if "description" in update_dict:
        description = update_dict.get("description", "")
        # Check length even if description is empty string (to allow clearing it)
        if description is not None and len(description) > 500:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Description must be 500 characters or less"
            )
        user["description"] = description
    
    # Validate phone format
    if "phone" in update_dict:
        phone = update_dict.get("phone", "")
        if phone:
            # Basic phone validation (digits, +, spaces, hyphens)
            if not re.match(r'^[\d\s\+\-\(\)]+$', phone):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid phone number format"
                )
        user["phone"] = phone
    
    # Update full_name if provided
    if "full_name" in update_dict:
        user["full_name"] = update_dict.get("full_name")
    
    # Update updated_at timestamp
    user["updated_at"] = datetime.utcnow().isoformat()
    
    # Save updated data
    admin_data["users"] = users
    json_handler.write("admin.json", admin_data)
    
    # Log action
    request_id = getattr(request.state, "request_id", None)
    log_admin_action(
        action="UPDATE",
        resource="profile",
        user=current_admin,
        request_id=request_id
    )
    
    # Build avatar URL if exists
    avatar_url = None
    if user.get("avatar"):
        avatar_url = f"/api/admin/profile/avatar/{user['avatar']}"
    
    return ProfileResponse(
        username=user.get("username", ""),
        email=user.get("email"),
        full_name=user.get("full_name"),
        description=user.get("description"),
        phone=user.get("phone"),
        avatar=avatar_url,
        created_at=datetime.fromisoformat(user.get("created_at", "2024-01-01T00:00:00Z")),
        last_login=datetime.fromisoformat(user.get("last_login")) if user.get("last_login") else None,
        updated_at=datetime.fromisoformat(user.get("updated_at")) if user.get("updated_at") else None
    )


@router.post("/profile/password")
async def change_password(
    request: Request,
    password_data: PasswordChange,
    current_admin: str = Depends(get_current_admin)
):
    """Change admin password"""
    # Validate new passwords match
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation do not match"
        )
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Get user
    admin_data = json_handler.read("admin.json")
    users = admin_data.get("users", [])
    user = next((u for u in users if u.get("username") == current_admin), None)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Verify current password
    if not verify_password(password_data.current_password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    # Check if new password is same as current
    if verify_password(password_data.new_password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    user["password_hash"] = get_password_hash(password_data.new_password)
    user["updated_at"] = datetime.utcnow().isoformat()
    
    # Save updated data
    admin_data["users"] = users
    json_handler.write("admin.json", admin_data)
    
    # Log action
    request_id = getattr(request.state, "request_id", None)
    log_admin_action(
        action="CHANGE_PASSWORD",
        resource="profile",
        user=current_admin,
        request_id=request_id
    )
    
    return {"message": "Password changed successfully"}


@router.post("/profile/avatar")
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_admin: str = Depends(get_current_admin)
):
    """Upload profile avatar image"""
    # Read file content
    file_content = await file.read()
    
    # Get user
    admin_data = json_handler.read("admin.json")
    users = admin_data.get("users", [])
    user = next((u for u in users if u.get("username") == current_admin), None)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Delete old avatar if exists
    old_avatar = user.get("avatar")
    if old_avatar:
        old_avatar_path = settings.PROFILES_DIR / old_avatar
        if old_avatar_path.exists():
            try:
                old_avatar_path.unlink()
            except Exception:
                pass  # Ignore deletion errors
    
    # Save new avatar
    try:
        filename, relative_path = profile_file_handler.save_profile_image(
            file_content, file.filename, current_admin
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save avatar: {str(e)}"
        )
    
    # Update user profile
    user["avatar"] = filename
    user["updated_at"] = datetime.utcnow().isoformat()
    
    # Save updated data
    admin_data["users"] = users
    json_handler.write("admin.json", admin_data)
    
    # Log action
    request_id = getattr(request.state, "request_id", None)
    log_admin_action(
        action="UPLOAD_AVATAR",
        resource="profile",
        user=current_admin,
        request_id=request_id
    )
    
    avatar_url = f"/api/admin/profile/avatar/{filename}"
    return {
        "message": "Avatar uploaded successfully",
        "avatar": avatar_url
    }


@router.delete("/profile/avatar")
async def delete_avatar(
    request: Request,
    current_admin: str = Depends(get_current_admin)
):
    """Delete profile avatar"""
    # Get user
    admin_data = json_handler.read("admin.json")
    users = admin_data.get("users", [])
    user = next((u for u in users if u.get("username") == current_admin), None)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Delete avatar file if exists
    avatar = user.get("avatar")
    if avatar:
        avatar_path = settings.PROFILES_DIR / avatar
        if avatar_path.exists():
            try:
                avatar_path.unlink()
            except Exception:
                pass  # Ignore deletion errors
    
    # Update user profile
    user["avatar"] = None
    user["updated_at"] = datetime.utcnow().isoformat()
    
    # Save updated data
    admin_data["users"] = users
    json_handler.write("admin.json", admin_data)
    
    # Log action
    request_id = getattr(request.state, "request_id", None)
    log_admin_action(
        action="DELETE_AVATAR",
        resource="profile",
        user=current_admin,
        request_id=request_id
    )
    
    return {"message": "Avatar deleted successfully"}


@router.get("/profile/avatar/{filename}")
async def get_avatar(filename: str):
    """Serve profile avatar image"""
    file_path = settings.PROFILES_DIR / filename
    
    # Security: Prevent path traversal
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar not found"
        )
    
    # Verify file is in profiles directory
    try:
        file_path.resolve().relative_to(settings.PROFILES_DIR.resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid file path"
        )
    
    # Determine content type
    ext = file_path.suffix.lower()
    content_type_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp"
    }
    content_type = content_type_map.get(ext, "image/jpeg")
    
    # Read and return file
    try:
        with open(file_path, "rb") as f:
            file_content = f.read()
        
        return Response(
            content=file_content,
            media_type=content_type,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=31536000",
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading avatar: {str(e)}"
        )

