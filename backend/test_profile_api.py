"""
Test script for Admin Profile Management API endpoints
Run this to verify all profile endpoints are working correctly
"""
import requests
import json
import sys
from pathlib import Path

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/admin"

# Test results
passed_tests = []
failed_tests = []
admin_token = None
test_avatar_filename = None


def test(name: str, func, *args, **kwargs):
    """Run a test and track results"""
    global passed_tests, failed_tests
    try:
        result = func(*args, **kwargs)
        if result:
            print(f"[PASS] {name}")
            passed_tests.append(name)
            return True
        else:
            print(f"[FAIL] {name}")
            failed_tests.append(name)
            return False
    except Exception as e:
        print(f"[FAIL] {name}: {str(e)}")
        failed_tests.append(name)
        return False


def admin_login():
    """Login as admin and get token"""
    global admin_token
    # Try both possible usernames (admin or admin_test)
    for username in ["admin", "admin_test"]:
        try:
            response = requests.post(
                f"{API_BASE}/login",
                json={"username": username, "password": "admin123"}
            )
            if response.status_code == 200:
                admin_token = response.json().get("access_token")
                print(f"Logged in as: {username}")
                return True
        except Exception as e:
            continue
    
    # If both fail, try with NewPass123! (in case password was changed)
    for username in ["admin", "admin_test"]:
        try:
            response = requests.post(
                f"{API_BASE}/login",
                json={"username": username, "password": "NewPass123!"}
            )
            if response.status_code == 200:
                admin_token = response.json().get("access_token")
                print(f"Logged in as: {username} (with NewPass123!)")
                return True
        except Exception as e:
            continue
    
    print(f"Login failed: Could not login with admin/admin123 or admin_test/admin123 or NewPass123!")
    return False


def get_headers():
    """Get headers with auth token"""
    global admin_token
    # If token is None or empty, try to re-login
    if not admin_token:
        admin_login()
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }

def ensure_valid_token():
    """Ensure we have a valid token by testing it, re-login if needed"""
    global admin_token
    if not admin_token:
        return admin_login()
    
    # Test token by making a simple request
    test_response = requests.get(f"{API_BASE}/profile", headers=get_headers())
    if test_response.status_code == 401 or test_response.status_code == 404:
        # Token invalid or user not found - re-login
        return admin_login()
    return True


def test_get_profile():
    """Test GET /api/admin/profile"""
    response = requests.get(f"{API_BASE}/profile", headers=get_headers())
    
    if response.status_code != 200:
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text}")
        return False
    
    data = response.json()
    required_fields = ["username", "created_at"]
    
    for field in required_fields:
        if field not in data:
            print(f"  Missing field: {field}")
            return False
    
    print(f"  Profile: {data.get('username')}")
    print(f"  Email: {data.get('email', 'Not set')}")
    print(f"  Full Name: {data.get('full_name', 'Not set')}")
    print(f"  Avatar: {data.get('avatar', 'Not set')}")
    return True


def test_update_profile():
    """Test PUT /api/admin/profile"""
    update_data = {
        "email": "admin@test.com",
        "full_name": "Test Admin User",
        "description": "This is a test admin profile",
        "phone": "+1234567890"
    }
    
    response = requests.put(
        f"{API_BASE}/profile",
        headers=get_headers(),
        json=update_data
    )
    
    if response.status_code != 200:
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text}")
        return False
    
    data = response.json()
    
    # Verify updates
    if data.get("email") != update_data["email"]:
        print(f"  Email not updated: {data.get('email')} != {update_data['email']}")
        return False
    
    if data.get("full_name") != update_data["full_name"]:
        print(f"  Full name not updated")
        return False
    
    print(f"  Updated email: {data.get('email')}")
    print(f"  Updated full_name: {data.get('full_name')}")
    print(f"  Updated description: {data.get('description')}")
    return True


def test_update_username():
    """Test PUT /api/admin/profile with username change"""
    global admin_token
    
    # First, try to change to a new username
    update_data = {
        "username": "admin_test"
    }
    
    response = requests.put(
        f"{API_BASE}/profile",
        headers=get_headers(),
        json=update_data
    )
    
    if response.status_code != 200:
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text}")
        return False
    
    data = response.json()
    if data.get("username") != "admin_test":
        print(f"  Username not updated")
        return False
    
    print(f"  Username changed to: {data.get('username')}")
    
    # Re-login with new username to get new token
    login_response = requests.post(
        f"{API_BASE}/login",
        json={"username": "admin_test", "password": "admin123"}
    )
    if login_response.status_code == 200:
        admin_token = login_response.json().get("access_token")
        print(f"  Re-logged in with new username")
    
    # Change back to admin
    update_data = {"username": "admin"}
    response = requests.put(
        f"{API_BASE}/profile",
        headers=get_headers(),
        json=update_data
    )
    
    if response.status_code != 200:
        print(f"  Failed to change username back")
        return False
    
    print(f"  Username changed back to: admin")
    
    # Re-login with original username
    login_response = requests.post(
        f"{API_BASE}/login",
        json={"username": "admin", "password": "admin123"}
    )
    if login_response.status_code == 200:
        admin_token = login_response.json().get("access_token")
        print(f"  Re-logged in with original username")
    
    return True


def test_update_username_duplicate():
    """Test PUT /api/admin/profile with invalid username (should fail)"""
    global admin_token
    
    # Ensure we have a valid token
    ensure_valid_token()
    
    # Test with invalid format (too short)
    update_data = {
        "username": "ab"  # Too short (min 3 chars)
    }
    
    response = requests.put(
        f"{API_BASE}/profile",
        headers=get_headers(),
        json=update_data
    )
    
    # Should fail with 400
    if response.status_code == 400:
        print(f"  Correctly rejected invalid username (too short)")
        return True
    else:
        print(f"  Should have rejected invalid username, got {response.status_code}")
        if response.status_code != 200:
            print(f"  Response: {response.text}")
        return False


def test_update_email_validation():
    """Test PUT /api/admin/profile with invalid email (should fail)"""
    update_data = {
        "email": "invalid-email-format"
    }
    
    response = requests.put(
        f"{API_BASE}/profile",
        headers=get_headers(),
        json=update_data
    )
    
    # Should fail with 400 or 422
    if response.status_code in [400, 422]:
        print(f"  Correctly rejected invalid email")
        return True
    else:
        print(f"  Should have rejected invalid email, got {response.status_code}")
        return False


def test_update_description_too_long():
    """Test PUT /api/admin/profile with description too long (should fail)"""
    global admin_token
    
    # Ensure we have a valid token - re-login if needed
    profile_response = requests.get(f"{API_BASE}/profile", headers=get_headers())
    if profile_response.status_code != 200:
        admin_login()
    
    update_data = {
        "description": "x" * 501  # 501 characters (max is 500)
    }
    
    response = requests.put(
        f"{API_BASE}/profile",
        headers=get_headers(),
        json=update_data
    )
    
    # Should fail with 400
    if response.status_code == 400:
        print(f"  Correctly rejected description too long")
        return True
    else:
        print(f"  Should have rejected long description, got {response.status_code}")
        if response.status_code != 200:
            print(f"  Response: {response.text}")
        return False


def test_change_password():
    """Test POST /api/admin/profile/password"""
    # First, we need to know the current password is "admin123"
    password_data = {
        "current_password": "admin123",
        "new_password": "NewPass123!",
        "confirm_password": "NewPass123!"
    }
    
    response = requests.post(
        f"{API_BASE}/profile/password",
        headers=get_headers(),
        json=password_data
    )
    
    if response.status_code != 200:
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text}")
        return False
    
    print(f"  Password changed successfully")
    
    # Change it back
    password_data = {
        "current_password": "NewPass123!",
        "new_password": "admin123",
        "confirm_password": "admin123"
    }
    
    response = requests.post(
        f"{API_BASE}/profile/password",
        headers=get_headers(),
        json=password_data
    )
    
    if response.status_code != 200:
        print(f"  Failed to change password back")
        return False
    
    print(f"  Password changed back to original")
    return True


def test_change_password_wrong_current():
    """Test POST /api/admin/profile/password with wrong current password (should fail)"""
    global admin_token
    
    # Ensure we have a valid token
    ensure_valid_token()
    
    password_data = {
        "current_password": "wrongpassword",
        "new_password": "NewPass123!",
        "confirm_password": "NewPass123!"
    }
    
    response = requests.post(
        f"{API_BASE}/profile/password",
        headers=get_headers(),
        json=password_data
    )
    
    # Should fail with 401 (or 400 if backend uses 400 for this)
    if response.status_code in [400, 401]:
        error_detail = response.json().get("detail", "")
        if "password" in error_detail.lower() or "incorrect" in error_detail.lower():
            print(f"  Correctly rejected wrong current password (status: {response.status_code})")
            return True
    
    print(f"  Should have rejected wrong password, got {response.status_code}")
    if response.status_code != 200:
        print(f"  Response: {response.text}")
    return False


def test_change_password_mismatch():
    """Test POST /api/admin/profile/password with mismatched passwords (should fail)"""
    password_data = {
        "current_password": "admin123",
        "new_password": "NewPass123!",
        "confirm_password": "DifferentPass123!"
    }
    
    response = requests.post(
        f"{API_BASE}/profile/password",
        headers=get_headers(),
        json=password_data
    )
    
    # Should fail with 400
    if response.status_code == 400:
        print(f"  Correctly rejected mismatched passwords")
        return True
    else:
        print(f"  Should have rejected mismatched passwords, got {response.status_code}")
        return False


def test_change_password_weak():
    """Test POST /api/admin/profile/password with weak password (should fail)"""
    global admin_token
    
    # Ensure we have a valid token
    ensure_valid_token()
    
    # Get current password
    profile_response = requests.get(f"{API_BASE}/profile", headers=get_headers())
    if profile_response.status_code != 200:
        print(f"  Could not get profile")
        return False
    
    current_username = profile_response.json().get("username", "admin")
    current_password = None
    for pwd in ["admin123", "NewPass123!"]:
        login_test = requests.post(
            f"{API_BASE}/login",
            json={"username": current_username, "password": pwd}
        )
        if login_test.status_code == 200:
            current_password = pwd
            break
    
    if not current_password:
        print(f"  Could not determine current password")
        return False
    
    password_data = {
        "current_password": current_password,
        "new_password": "weak",
        "confirm_password": "weak"
    }
    
    response = requests.post(
        f"{API_BASE}/profile/password",
        headers=get_headers(),
        json=password_data
    )
    
    # Should fail with 400
    if response.status_code == 400:
        print(f"  Correctly rejected weak password")
        return True
    else:
        print(f"  Should have rejected weak password, got {response.status_code}")
        if response.status_code != 200:
            print(f"  Response: {response.text}")
        return False


def test_upload_avatar():
    """Test POST /api/admin/profile/avatar"""
    global test_avatar_filename
    
    # Create a minimal valid JPEG image (1x1 pixel)
    # JPEG header + minimal data
    # This is a valid 1x1 pixel grayscale JPEG
    jpeg_data = bytes([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
        0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
        0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4, 0x00, 0x14,
        0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x80, 0xFF, 0xD9
    ])
    
    files = {
        'file': ('test_avatar.jpg', jpeg_data, 'image/jpeg')
    }
    
    headers = {
        "Authorization": f"Bearer {admin_token}"
    }
    
    response = requests.post(
        f"{API_BASE}/profile/avatar",
        headers=headers,
        files=files
    )
    
    if response.status_code != 200:
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text}")
        return False
    
    data = response.json()
    avatar_url = data.get("avatar")
    
    if not avatar_url:
        print(f"  No avatar URL returned")
        return False
    
    # Extract filename from URL
    test_avatar_filename = avatar_url.split("/")[-1]
    print(f"  Avatar uploaded: {avatar_url}")
    return True


def test_upload_avatar_invalid_format():
    """Test POST /api/admin/profile/avatar with invalid format (should fail)"""
    global admin_token
    
    # Ensure we have a valid token
    ensure_valid_token()
    
    # Upload a text file instead of image
    files = {
        'file': ('test.txt', b'This is not an image', 'text/plain')
    }
    
    headers = {
        "Authorization": f"Bearer {admin_token}"
    }
    
    response = requests.post(
        f"{API_BASE}/profile/avatar",
        headers=headers,
        files=files
    )
    
    # Should fail with 400
    if response.status_code == 400:
        print(f"  Correctly rejected invalid file format")
        return True
    else:
        print(f"  Should have rejected invalid format, got {response.status_code}")
        if response.status_code != 200:
            print(f"  Response: {response.text}")
        return False


def test_get_avatar():
    """Test GET /api/admin/profile/avatar/{filename}"""
    global test_avatar_filename
    
    if not test_avatar_filename:
        print(f"  No avatar filename available (upload test may have failed)")
        return False
    
    response = requests.get(
        f"{API_BASE}/profile/avatar/{test_avatar_filename}",
        headers=get_headers()
    )
    
    if response.status_code != 200:
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text}")
        return False
    
    # Check content type
    content_type = response.headers.get("Content-Type", "")
    if "image" not in content_type:
        print(f"  Wrong content type: {content_type}")
        return False
    
    print(f"  Avatar retrieved successfully (Content-Type: {content_type})")
    return True


def test_delete_avatar():
    """Test DELETE /api/admin/profile/avatar"""
    global admin_token
    
    # Ensure we have a valid token - re-login if needed
    profile_response = requests.get(f"{API_BASE}/profile", headers=get_headers())
    if profile_response.status_code != 200:
        admin_login()
    
    response = requests.delete(
        f"{API_BASE}/profile/avatar",
        headers=get_headers()
    )
    
    if response.status_code != 200:
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text}")
        return False
    
    print(f"  Avatar deleted successfully")
    
    # Verify it's deleted by checking profile
    profile_response = requests.get(f"{API_BASE}/profile", headers=get_headers())
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        if profile_data.get("avatar") is None:
            print(f"  Avatar confirmed deleted from profile")
            return True
        else:
            print(f"  Avatar still in profile: {profile_data.get('avatar')}")
            return False
    
    return False


def test_unauthorized_access():
    """Test accessing profile without token (should fail)"""
    response = requests.get(f"{API_BASE}/profile")
    
    # Should fail with 403 or 401
    if response.status_code in [401, 403]:
        print(f"  Correctly rejected unauthorized access")
        return True
    else:
        print(f"  Should have rejected unauthorized access, got {response.status_code}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("Admin Profile Management API Test Suite")
    print("=" * 60)
    print()
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code != 200:
            print("ERROR: Backend server is not running!")
            print(f"Please start the server: cd backend && uvicorn app.main:app --reload")
            sys.exit(1)
    except requests.exceptions.RequestException:
        print("ERROR: Cannot connect to backend server!")
        print(f"Please start the server: cd backend && uvicorn app.main:app --reload")
        sys.exit(1)
    
    print("Backend server is running")
    print()
    
    # Login first
    print("Step 1: Admin Login")
    print("-" * 60)
    if not admin_login():
        print("ERROR: Failed to login. Cannot continue tests.")
        print("Make sure admin user exists with password 'admin123'")
        sys.exit(1)
    print("Login successful")
    print()
    
    # Run tests
    print("Step 2: Running Profile API Tests")
    print("-" * 60)
    print()
    
    # Profile retrieval tests
    print("Profile Retrieval Tests:")
    test("Get Profile", test_get_profile)
    print()
    
    # Profile update tests
    print("Profile Update Tests:")
    test("Update Profile (email, name, description, phone)", test_update_profile)
    test("Update Username", test_update_username)
    test("Update Username - Duplicate/Invalid (should fail)", test_update_username_duplicate)
    test("Update Email - Invalid Format (should fail)", test_update_email_validation)
    test("Update Description - Too Long (should fail)", test_update_description_too_long)
    print()
    
    # Password change tests
    print("Password Change Tests:")
    test("Change Password", test_change_password)
    test("Change Password - Wrong Current (should fail)", test_change_password_wrong_current)
    test("Change Password - Mismatch (should fail)", test_change_password_mismatch)
    test("Change Password - Weak Password (should fail)", test_change_password_weak)
    print()
    
    # Avatar tests
    print("Avatar Management Tests:")
    test("Upload Avatar", test_upload_avatar)
    test("Upload Avatar - Invalid Format (should fail)", test_upload_avatar_invalid_format)
    test("Get Avatar", test_get_avatar)
    test("Delete Avatar", test_delete_avatar)
    print()
    
    # Security tests
    print("Security Tests:")
    test("Unauthorized Access (should fail)", test_unauthorized_access)
    print()
    
    # Summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Passed: {len(passed_tests)}")
    print(f"Failed: {len(failed_tests)}")
    print()
    
    if failed_tests:
        print("Failed Tests:")
        for test_name in failed_tests:
            print(f"  - {test_name}")
        print()
    
    if len(failed_tests) == 0:
        print("All tests passed!")
        return 0
    else:
        print(f"{len(failed_tests)} test(s) failed. Please check the output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

