"""
Test script to verify logging system is working correctly
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"
API_PUBLIC = f"{BASE_URL}/api/public"
API_ADMIN = f"{BASE_URL}/api/admin"

def test_logging():
    """Test various scenarios to generate logs"""
    print("=" * 70)
    print("TESTING LOGGING SYSTEM")
    print("=" * 70)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        if response.status_code != 200:
            print("[ERROR] Server is not running!")
            return
    except:
        print("[ERROR] Cannot connect to server!")
        return
    
    print("[OK] Server is running\n")
    
    # Test 1: Public API request (should log to access log)
    print("Test 1: Public API request...")
    response = requests.get(f"{API_PUBLIC}/pages/home")
    request_id = response.headers.get("X-Request-ID", "N/A")
    print(f"  Status: {response.status_code}")
    print(f"  Request ID: {request_id}")
    print("  [OK] Should be logged in access log\n")
    
    # Test 2: Slow request (should log as WARNING)
    print("Test 2: Slow request simulation...")
    # This will be logged as WARNING if > 1s
    response = requests.get(f"{API_PUBLIC}/couriers")
    print(f"  Status: {response.status_code}")
    print("  [OK] Should be logged in access log\n")
    
    # Test 3: Error request (404 - should log as WARNING)
    print("Test 3: Error request (404)...")
    try:
        response = requests.get(f"{API_PUBLIC}/pages/nonexistent")
        print(f"  Status: {response.status_code}")
        print("  [OK] Should be logged as WARNING\n")
    except:
        pass
    
    # Test 4: Admin login (should log to admin log)
    print("Test 4: Admin login...")
    login_response = requests.post(
        f"{API_ADMIN}/login",
        json={"username": "admin", "password": "admin123"}
    )
    if login_response.status_code == 200:
        token = login_response.json()["access_token"]
        print("  [OK] Login successful - should be logged in admin log")
        print("  [OK] Should be logged in access log\n")
        
        # Test 5: Admin action (should log to admin log)
        print("Test 5: Admin action (get dashboard stats)...")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_ADMIN}/dashboard/stats", headers=headers)
        print(f"  Status: {response.status_code}")
        print("  [OK] Should be logged in admin log\n")
        
        # Test 6: Admin action (update content - should log to admin log)
        print("Test 6: Admin action (get page content)...")
        response = requests.get(f"{API_ADMIN}/content/home", headers=headers)
        print(f"  Status: {response.status_code}")
        print("  [OK] Should be logged in access log\n")
        
        # Test 7: Validation error (should log as WARNING)
        print("Test 7: Validation error...")
        try:
            response = requests.post(
                f"{API_PUBLIC}/pricing/calculate",
                json={"weight": -1, "distance": 100}  # Invalid weight
            )
            print(f"  Status: {response.status_code}")
            print("  [OK] Should be logged as WARNING\n")
        except:
            pass
    
    # Test 8: Check log files
    print("=" * 70)
    print("CHECKING LOG FILES")
    print("=" * 70)
    
    from pathlib import Path
    log_dir = Path(__file__).parent / "logs"
    
    log_files = {
        "app": log_dir / "app" / f"app-{time.strftime('%Y-%m-%d')}.log",
        "error": log_dir / "error" / f"error-{time.strftime('%Y-%m-%d')}.log",
        "access": log_dir / "access" / f"access-{time.strftime('%Y-%m-%d')}.log",
        "admin": log_dir / "admin" / f"admin-{time.strftime('%Y-%m-%d')}.log",
    }
    
    for log_type, log_path in log_files.items():
        if log_path.exists():
            with open(log_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                print(f"\n{log_type.upper()} LOG ({log_path.name}):")
                print(f"  Lines: {len(lines)}")
                if lines:
                    # Show last 2 lines
                    for line in lines[-2:]:
                        try:
                            log_data = json.loads(line.strip())
                            print(f"  - {log_data.get('level', 'N/A')}: {log_data.get('message', 'N/A')[:80]}")
                        except:
                            print(f"  - {line.strip()[:80]}")
        else:
            print(f"\n{log_type.upper()} LOG: File not found")
    
    print("\n" + "=" * 70)
    print("LOGGING TEST COMPLETE")
    print("=" * 70)
    print("\nCheck the log files in backend/logs/ directory")
    print("All requests should have Request IDs in response headers")

if __name__ == "__main__":
    test_logging()
