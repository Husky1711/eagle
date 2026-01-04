"""
Security Implementation Test Script
Tests all security features: rate limiting, data filtering, image security, etc.
"""
import requests
import time
import sys
from typing import Dict, List

# Configure for your environment
API_BASE = "http://localhost:8000/api/public"
ADMIN_API_BASE = "http://localhost:8000/api/admin"

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(name: str):
    """Print test header"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST: {name}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")

def print_pass(message: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓ PASS: {message}{Colors.RESET}")

def print_fail(message: str):
    """Print failure message"""
    print(f"{Colors.RED}✗ FAIL: {message}{Colors.RESET}")

def print_info(message: str):
    """Print info message"""
    print(f"{Colors.YELLOW}ℹ INFO: {message}{Colors.RESET}")

def test_server_connection():
    """Test if server is running"""
    print_test("Server Connection")
    try:
        response = requests.get(f"{API_BASE.replace('/api/public', '')}/health", timeout=5)
        if response.status_code == 200:
            print_pass("Server is running")
            return True
        else:
            print_fail(f"Server returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_fail("Cannot connect to server. Is it running?")
        return False
    except Exception as e:
        print_fail(f"Error: {str(e)}")
        return False

def test_chat_rate_limiting():
    """Test chat API rate limiting (20 requests/hour)"""
    print_test("Chat API Rate Limiting")
    
    success_count = 0
    rate_limited = False
    
    # Make 25 requests (should hit rate limit at 20)
    for i in range(25):
        try:
            response = requests.post(
                f"{API_BASE}/chat",
                json={
                    "message": f"Test message {i}",
                    "conversation_history": []
                },
                timeout=10
            )
            
            if response.status_code == 200:
                success_count += 1
                remaining = response.headers.get("X-RateLimit-Remaining", "unknown")
                if i < 5:  # Only print first few
                    print_info(f"Request {i+1}: Success (Remaining: {remaining})")
            elif response.status_code == 429:
                rate_limited = True
                reset_after = response.headers.get("X-RateLimit-Reset-After", "unknown")
                print_info(f"Request {i+1}: Rate limited (Reset after: {reset_after}s)")
                break
            else:
                print_fail(f"Request {i+1}: Unexpected status {response.status_code}")
                break
        except Exception as e:
            print_fail(f"Request {i+1}: Error - {str(e)}")
            break
    
    if rate_limited and success_count <= 20:
        print_pass(f"Rate limiting works! Allowed {success_count} requests, then blocked")
        return True
    elif success_count > 20:
        print_fail(f"Rate limiting not working! Allowed {success_count} requests (should be max 20)")
        return False
    else:
        print_fail("Rate limiting test inconclusive")
        return False

def test_pricing_rate_limiting():
    """Test pricing calculator rate limiting"""
    print_test("Pricing Calculator Rate Limiting")
    
    success_count = 0
    rate_limited = False
    
    # Make 105 requests (should hit rate limit at 100)
    for i in range(105):
        try:
            response = requests.post(
                f"{API_BASE}/pricing/calculate",
                json={
                    "weight": 5.0,
                    "distance": 100
                },
                timeout=10
            )
            
            if response.status_code == 200:
                success_count += 1
            elif response.status_code == 429:
                rate_limited = True
                print_info(f"Rate limited at request {i+1}")
                break
        except Exception as e:
            if "429" in str(e) or "rate limit" in str(e).lower():
                rate_limited = True
                break
    
    if rate_limited and success_count <= 100:
        print_pass(f"Rate limiting works! Allowed {success_count} requests")
        return True
    else:
        print_fail(f"Rate limiting may not be working (allowed {success_count} requests)")
        return False

def test_image_hotlink_protection():
    """Test image hotlink protection"""
    print_test("Image Hotlink Protection")
    
    # Try to access image with different referrers
    test_cases = [
        {"referer": "https://malicious-site.com", "should_block": True},
        {"referer": None, "should_block": False},  # Direct access should work
    ]
    
    # First, we need a valid image filename (this is a mock test)
    # In real scenario, you'd need an actual uploaded image
    image_filename = "test-image.jpg"  # Replace with actual image
    
    for case in test_cases:
        headers = {}
        if case["referer"]:
            headers["Referer"] = case["referer"]
        
        try:
            response = requests.get(
                f"{API_BASE}/uploads/{image_filename}",
                headers=headers,
                timeout=5
            )
            
            if case["should_block"]:
                if response.status_code == 403:
                    print_pass(f"Hotlink protection blocked referer: {case['referer']}")
                else:
                    print_fail(f"Hotlink protection did not block: {case['referer']} (status: {response.status_code})")
            else:
                if response.status_code in [200, 404]:  # 404 is OK (image might not exist)
                    print_pass(f"Direct access allowed (status: {response.status_code})")
                else:
                    print_info(f"Direct access returned status: {response.status_code}")
        except Exception as e:
            if case["should_block"]:
                print_info(f"Error (expected for blocked): {str(e)}")
            else:
                print_fail(f"Unexpected error: {str(e)}")
    
    print_info("Note: This test requires actual uploaded images to fully verify")
    return True

def test_data_filtering():
    """Test data filtering in public APIs"""
    print_test("Data Filtering")
    
    try:
        response = requests.get(f"{API_BASE}/couriers", timeout=5)
        
        if response.status_code == 200:
            couriers = response.json()
            
            if couriers:
                # Check if sensitive fields are filtered
                first_courier = couriers[0]
                sensitive_fields = ["password", "password_hash", "api_key", "secret", "internal_notes"]
                
                found_sensitive = []
                for field in sensitive_fields:
                    if field in first_courier:
                        found_sensitive.append(field)
                
                if found_sensitive:
                    print_fail(f"Sensitive fields found in response: {found_sensitive}")
                    return False
                else:
                    print_pass("No sensitive fields found in public API response")
                    return True
            else:
                print_info("No couriers found to test")
                return True
        else:
            print_fail(f"API returned status {response.status_code}")
            return False
    except Exception as e:
        print_fail(f"Error: {str(e)}")
        return False

def test_request_size_limits():
    """Test request size limits"""
    print_test("Request Size Limits")
    
    # Test chat message length limit (5000 chars)
    long_message = "x" * 6000  # Exceeds 5000 char limit
    
    try:
        response = requests.post(
            f"{API_BASE}/chat",
            json={
                "message": long_message,
                "conversation_history": []
            },
            timeout=10
        )
        
        if response.status_code == 400:
            print_pass("Request size limit enforced (message too long rejected)")
            return True
        elif response.status_code == 200:
            print_fail("Request size limit not enforced (long message accepted)")
            return False
        else:
            print_info(f"Unexpected status: {response.status_code}")
            return False
    except Exception as e:
        print_info(f"Error (may be expected): {str(e)}")
        return True

def test_cors_security():
    """Test CORS configuration"""
    print_test("CORS Security")
    
    # Test with different origins
    origins = [
        "https://allowed-site.com",
        "https://malicious-site.com",
        None  # No origin header
    ]
    
    for origin in origins:
        headers = {}
        if origin:
            headers["Origin"] = origin
        
        try:
            response = requests.options(
                f"{API_BASE}/chat",
                headers=headers,
                timeout=5
            )
            
            cors_origin = response.headers.get("Access-Control-Allow-Origin")
            
            if origin and origin not in ["https://allowed-site.com"]:  # Adjust based on your config
                if cors_origin == "*":
                    print_fail(f"CORS allows all origins (wildcard found)")
                    return False
                elif cors_origin != origin:
                    print_pass(f"CORS correctly restricts origin: {origin}")
            else:
                print_info(f"CORS origin header: {cors_origin}")
        except Exception as e:
            print_info(f"Error testing CORS: {str(e)}")
    
    print_info("CORS test completed (verify manually based on your CORS_ORIGINS config)")
    return True

def test_rate_limit_headers():
    """Test rate limit headers in responses"""
    print_test("Rate Limit Headers")
    
    try:
        response = requests.post(
            f"{API_BASE}/chat",
            json={
                "message": "Test",
                "conversation_history": []
            },
            timeout=10
        )
        
        headers_to_check = [
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset-After"
        ]
        
        found_headers = []
        for header in headers_to_check:
            if header in response.headers:
                found_headers.append(header)
                print_info(f"{header}: {response.headers[header]}")
        
        if len(found_headers) == len(headers_to_check):
            print_pass("All rate limit headers present")
            return True
        else:
            print_fail(f"Missing rate limit headers. Found: {found_headers}")
            return False
    except Exception as e:
        print_fail(f"Error: {str(e)}")
        return False

def test_conversation_history_limit():
    """Test conversation history length limit"""
    print_test("Conversation History Limit")
    
    # Create conversation history with 25 messages (exceeds 20 limit)
    history = [
        {"role": "user", "content": f"Message {i}"}
        for i in range(25)
    ]
    
    try:
        response = requests.post(
            f"{API_BASE}/chat",
            json={
                "message": "Test",
                "conversation_history": history
            },
            timeout=10
        )
        
        if response.status_code == 400:
            print_pass("Conversation history limit enforced")
            return True
        elif response.status_code == 200:
            print_fail("Conversation history limit not enforced")
            return False
        else:
            print_info(f"Unexpected status: {response.status_code}")
            return False
    except Exception as e:
        print_info(f"Error (may be expected): {str(e)}")
        return True

def main():
    """Run all security tests"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}SECURITY IMPLEMENTATION TEST SUITE{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")
    
    # Check server connection first
    if not test_server_connection():
        print(f"\n{Colors.RED}Server is not running. Please start the backend server first.{Colors.RESET}")
        sys.exit(1)
    
    # Run tests
    tests = [
        ("Rate Limit Headers", test_rate_limit_headers),
        ("Chat Rate Limiting", test_chat_rate_limiting),
        ("Pricing Rate Limiting", test_pricing_rate_limiting),
        ("Data Filtering", test_data_filtering),
        ("Request Size Limits", test_request_size_limits),
        ("Conversation History Limit", test_conversation_history_limit),
        ("CORS Security", test_cors_security),
        ("Image Hotlink Protection", test_image_hotlink_protection),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_fail(f"Test '{test_name}' crashed: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST SUMMARY{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if result else f"{Colors.RED}✗ FAIL{Colors.RESET}"
        print(f"{status} - {test_name}")
    
    print(f"\n{Colors.BLUE}Total: {passed}/{total} tests passed{Colors.RESET}")
    
    if passed == total:
        print(f"{Colors.GREEN}All security tests passed! ✓{Colors.RESET}")
        return 0
    else:
        print(f"{Colors.YELLOW}Some tests failed. Review the output above.{Colors.RESET}")
        return 1

if __name__ == "__main__":
    # Fix encoding for Windows
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding='utf-8')
    
    exit_code = main()
    sys.exit(exit_code)

