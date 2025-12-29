"""
Comprehensive API testing script for all scenarios
"""
import requests
import json
import os
from pathlib import Path

BASE_URL = "http://localhost:8000"
API_PUBLIC = f"{BASE_URL}/api/public"
API_ADMIN = f"{BASE_URL}/api/admin"

# Test results
results = {
    "passed": [],
    "failed": []
}

def test(name: str, func):
    """Run a test and record results"""
    try:
        print(f"\n[TEST] Testing: {name}")
        result = func()
        if result:
            print(f"[PASS] {name}")
            results["passed"].append(name)
        else:
            print(f"[FAIL] {name}")
            results["failed"].append(name)
    except Exception as e:
        print(f"[ERROR] {name}: {str(e)}")
        results["failed"].append(name)

def print_response(response):
    """Pretty print response"""
    try:
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")

# ==================== PUBLIC API TESTS ====================

def test_health_check():
    """Test health check endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    return response.status_code == 200

def test_get_home_page():
    """Test getting home page content"""
    response = requests.get(f"{API_PUBLIC}/pages/home")
    if response.status_code == 200:
        data = response.json()
        assert "content" in data
        assert "meta" in data
        return True
    return False

def test_get_all_pages():
    """Test getting all page types"""
    pages = ["home", "pricing", "tracking", "about", "contact"]
    for page in pages:
        response = requests.get(f"{API_PUBLIC}/pages/{page}")
        if response.status_code != 200:
            return False
    return True

def test_get_couriers():
    """Test getting active couriers"""
    response = requests.get(f"{API_PUBLIC}/couriers")
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        return True
    return False

def test_pricing_calculator_local():
    """Test pricing calculator - local delivery"""
    payload = {
        "weight": 2.5,
        "distance": 30,
        "service_type": None
    }
    response = requests.post(f"{API_PUBLIC}/pricing/calculate", json=payload)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert len(data) <= 3  # Should return top 3
        # Check first result is best (lowest price)
        if len(data) > 1:
            assert data[0]["price"] <= data[1]["price"]
        return True
    return False

def test_pricing_calculator_regional():
    """Test pricing calculator - regional delivery"""
    payload = {
        "weight": 3.0,
        "distance": 200
    }
    response = requests.post(f"{API_PUBLIC}/pricing/calculate", json=payload)
    if response.status_code == 200:
        data = response.json()
        assert len(data) > 0
        return True
    return False

def test_pricing_calculator_national():
    """Test pricing calculator - national delivery"""
    payload = {
        "weight": 4.5,
        "distance": 1500
    }
    response = requests.post(f"{API_PUBLIC}/pricing/calculate", json=payload)
    if response.status_code == 200:
        data = response.json()
        assert len(data) > 0
        return True
    return False

def test_pricing_calculator_validation():
    """Test pricing calculator validation"""
    # Test negative weight
    payload = {"weight": -1, "distance": 100}
    response = requests.post(f"{API_PUBLIC}/pricing/calculate", json=payload)
    assert response.status_code == 400
    
    # Test zero distance
    payload = {"weight": 2, "distance": 0}
    response = requests.post(f"{API_PUBLIC}/pricing/calculate", json=payload)
    assert response.status_code == 400
    
    return True

def test_tracking_redirect():
    """Test tracking redirect"""
    response = requests.get(f"{API_PUBLIC}/tracking/dtdc/ABC123456")
    if response.status_code == 200:
        data = response.json()
        assert "redirect_url" in data
        assert "ABC123456" in data["redirect_url"]
        return True
    return False

def test_tracking_invalid_courier():
    """Test tracking with invalid courier"""
    response = requests.get(f"{API_PUBLIC}/tracking/invalid_courier/ABC123")
    return response.status_code == 404

def test_get_settings():
    """Test getting site settings"""
    response = requests.get(f"{API_PUBLIC}/settings")
    if response.status_code == 200:
        data = response.json()
        assert "site" in data
        assert "contact" in data
        return True
    return False

# ==================== ADMIN API TESTS ====================

admin_token = None

def test_admin_login():
    """Test admin login"""
    global admin_token
    payload = {
        "username": "admin",
        "password": "admin123"
    }
    response = requests.post(f"{API_ADMIN}/login", json=payload)
    if response.status_code == 200:
        data = response.json()
        assert "access_token" in data
        admin_token = data["access_token"]
        return True
    return False

def test_admin_login_wrong_password():
    """Test admin login with wrong password"""
    payload = {
        "username": "admin",
        "password": "wrongpassword"
    }
    response = requests.post(f"{API_ADMIN}/login", json=payload)
    return response.status_code == 401

def test_admin_login_wrong_username():
    """Test admin login with wrong username"""
    payload = {
        "username": "wronguser",
        "password": "admin123"
    }
    response = requests.post(f"{API_ADMIN}/login", json=payload)
    return response.status_code == 401

def test_dashboard_stats():
    """Test getting dashboard stats"""
    global admin_token
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{API_ADMIN}/dashboard/stats", headers=headers)
    if response.status_code == 200:
        data = response.json()
        assert "total_pages" in data
        assert "active_couriers" in data
        assert "media_count" in data
        return True
    return False

def test_get_page_content_admin():
    """Test getting page content for editing"""
    global admin_token
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{API_ADMIN}/content/home", headers=headers)
    if response.status_code == 200:
        data = response.json()
        assert "content" in data
        return True
    return False

def test_update_page_content():
    """Test updating page content"""
    global admin_token
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get current content
    response = requests.get(f"{API_ADMIN}/content/home", headers=headers)
    current_data = response.json()
    
    # Update content
    update_data = {
        "meta": current_data.get("meta", {}),
        "content": {
            **current_data.get("content", {}),
            "hero": {
                "headline": "Updated Headline - Test",
                "subheadline": current_data["content"]["hero"]["subheadline"],
                "cta": current_data["content"]["hero"]["cta"],
                "ctaLink": current_data["content"]["hero"]["ctaLink"]
            }
        },
        "published": True
    }
    
    response = requests.put(f"{API_ADMIN}/content/home", json=update_data, headers=headers)
    if response.status_code == 200:
        # Verify update
        response = requests.get(f"{API_ADMIN}/content/home", headers=headers)
        updated_data = response.json()
        assert updated_data["content"]["hero"]["headline"] == "Updated Headline - Test"
        
        # Restore original
        requests.put(f"{API_ADMIN}/content/home", json=current_data, headers=headers)
        return True
    return False

def test_list_couriers_admin():
    """Test listing couriers (admin)"""
    global admin_token
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{API_ADMIN}/couriers", headers=headers)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        return True
    return False

def test_create_courier():
    """Test creating a new courier"""
    global admin_token
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    payload = {
        "name": "Test Courier",
        "logo": "",
        "tracking_url": "https://test.com/track/{id}",
        "description": "Test courier for testing",
        "display_order": 99
    }
    
    response = requests.post(f"{API_ADMIN}/couriers", json=payload, headers=headers)
    if response.status_code == 200:
        data = response.json()
        courier_id = data["courier"]["id"]
        
        # Clean up - delete the test courier
        requests.delete(f"{API_ADMIN}/couriers/{courier_id}", headers=headers)
        return True
    return False

def test_update_courier():
    """Test updating a courier"""
    global admin_token
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get first courier
    response = requests.get(f"{API_ADMIN}/couriers", headers=headers)
    couriers = response.json()
    if len(couriers) == 0:
        return False
    
    courier_id = couriers[0]["id"]
    original_name = couriers[0]["name"]
    
    # Update
    update_data = {
        "name": "Updated Courier Name - Test"
    }
    response = requests.put(f"{API_ADMIN}/couriers/{courier_id}", json=update_data, headers=headers)
    
    if response.status_code == 200:
        # Restore original
        restore_data = {"name": original_name}
        requests.put(f"{API_ADMIN}/couriers/{courier_id}", json=restore_data, headers=headers)
        return True
    return False

def test_list_pricing_rules():
    """Test listing pricing rules"""
    global admin_token
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{API_ADMIN}/pricing/rules", headers=headers)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
        return True
    return False

def test_create_pricing_rule():
    """Test creating a pricing rule"""
    global admin_token
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    payload = {
        "courier": "dtdc",
        "weight_range": {
            "min": 5,
            "max": 10,
            "unit": "kg"
        },
        "distance_zones": [
            {
                "zone": "local",
                "max_distance": 50,
                "unit": "km",
                "base_price": 40,
                "price_per_kg": 60,
                "estimated_delivery": "2-3 days"
            }
        ],
        "active": True
    }
    
    response = requests.post(f"{API_ADMIN}/pricing/rules", json=payload, headers=headers)
    if response.status_code == 200:
        data = response.json()
        if "rule" in data and "id" in data["rule"]:
            rule_id = data["rule"]["id"]
            # Clean up
            delete_response = requests.delete(f"{API_ADMIN}/pricing/rules/{rule_id}", headers=headers)
            return delete_response.status_code == 200
        return False
    else:
        print(f"   Status: {response.status_code}, Response: {response.text}")
        return False

def test_get_settings_admin():
    """Test getting settings (admin)"""
    global admin_token
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{API_ADMIN}/settings", headers=headers)
    if response.status_code == 200:
        data = response.json()
        assert "site" in data
        return True
    return False

def test_update_settings():
    """Test updating settings"""
    global admin_token
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get current settings
    response = requests.get(f"{API_ADMIN}/settings", headers=headers)
    current_settings = response.json()
    
    # Update
    update_data = {
        "contact": {
            "phone": "+91-9999999999"
        }
    }
    response = requests.put(f"{API_ADMIN}/settings", json=update_data, headers=headers)
    
    if response.status_code == 200:
        # Restore original
        restore_data = {
            "contact": current_settings["contact"]
        }
        requests.put(f"{API_ADMIN}/settings", json=restore_data, headers=headers)
        return True
    return False

def test_unauthorized_access():
    """Test accessing protected routes without token"""
    response = requests.get(f"{API_ADMIN}/dashboard/stats")
    return response.status_code == 403

def test_invalid_token():
    """Test accessing with invalid token"""
    headers = {"Authorization": "Bearer invalid_token_here"}
    response = requests.get(f"{API_ADMIN}/dashboard/stats", headers=headers)
    return response.status_code == 401

# ==================== RUN ALL TESTS ====================

def main():
    """Run all tests"""
    print("=" * 60)
    print("STARTING COMPREHENSIVE API TESTS")
    print("=" * 60)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        if response.status_code != 200:
            print("[ERROR] Server is not running! Please start the server first:")
            print("   cd backend && uvicorn app.main:app --reload --port 8000")
            return
    except:
        print("[ERROR] Cannot connect to server! Please start the server first:")
        print("   cd backend && uvicorn app.main:app --reload --port 8000")
        return
    
    print("[OK] Server is running!")
    
    # Public API Tests
    print("\n" + "=" * 60)
    print("PUBLIC API TESTS")
    print("=" * 60)
    
    test("Health Check", test_health_check)
    test("Get Home Page", test_get_home_page)
    test("Get All Pages", test_get_all_pages)
    test("Get Couriers", test_get_couriers)
    test("Pricing Calculator - Local", test_pricing_calculator_local)
    test("Pricing Calculator - Regional", test_pricing_calculator_regional)
    test("Pricing Calculator - National", test_pricing_calculator_national)
    test("Pricing Calculator Validation", test_pricing_calculator_validation)
    test("Tracking Redirect", test_tracking_redirect)
    test("Tracking Invalid Courier", test_tracking_invalid_courier)
    test("Get Settings", test_get_settings)
    
    # Admin API Tests
    print("\n" + "=" * 60)
    print("ADMIN API TESTS")
    print("=" * 60)
    
    test("Admin Login", test_admin_login)
    test("Admin Login Wrong Password", test_admin_login_wrong_password)
    test("Admin Login Wrong Username", test_admin_login_wrong_username)
    test("Dashboard Stats", test_dashboard_stats)
    test("Get Page Content (Admin)", test_get_page_content_admin)
    test("Update Page Content", test_update_page_content)
    test("List Couriers (Admin)", test_list_couriers_admin)
    test("Create Courier", test_create_courier)
    test("Update Courier", test_update_courier)
    test("List Pricing Rules", test_list_pricing_rules)
    test("Create Pricing Rule", test_create_pricing_rule)
    test("Get Settings (Admin)", test_get_settings_admin)
    test("Update Settings", test_update_settings)
    test("Unauthorized Access", test_unauthorized_access)
    test("Invalid Token", test_invalid_token)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"[PASS] Passed: {len(results['passed'])}")
    print(f"[FAIL] Failed: {len(results['failed'])}")
    total = len(results['passed']) + len(results['failed'])
    if total > 0:
        print(f"[INFO] Success Rate: {len(results['passed'])/total*100:.1f}%")
    
    if results['failed']:
        print("\n[FAIL] Failed Tests:")
        for test_name in results['failed']:
            print(f"   - {test_name}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()

