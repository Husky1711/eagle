"""
Run comprehensive API tests multiple times to check stability and reliability
"""
import requests
import time
import sys
import os

# Import test functions from test_api
sys.path.insert(0, os.path.dirname(__file__))
import test_api

# Reset admin token before each run
def reset_admin_token():
    """Reset admin token to None"""
    test_api.admin_token = None

# Test suite - using test_api module functions
ALL_TESTS = [
    ("Health Check", test_api.test_health_check),
    ("Get Home Page", test_api.test_get_home_page),
    ("Get All Pages", test_api.test_get_all_pages),
    ("Get Couriers", test_api.test_get_couriers),
    ("Pricing Calculator - Local", test_api.test_pricing_calculator_local),
    ("Pricing Calculator - Regional", test_api.test_pricing_calculator_regional),
    ("Pricing Calculator - National", test_api.test_pricing_calculator_national),
    ("Pricing Calculator Validation", test_api.test_pricing_calculator_validation),
    ("Tracking Redirect", test_api.test_tracking_redirect),
    ("Tracking Invalid Courier", test_api.test_tracking_invalid_courier),
    ("Get Settings", test_api.test_get_settings),
    ("Admin Login", test_api.test_admin_login),
    ("Admin Login Wrong Password", test_api.test_admin_login_wrong_password),
    ("Admin Login Wrong Username", test_api.test_admin_login_wrong_username),
    ("Dashboard Stats", test_api.test_dashboard_stats),
    ("Get Page Content (Admin)", test_api.test_get_page_content_admin),
    ("Update Page Content", test_api.test_update_page_content),
    ("List Couriers (Admin)", test_api.test_list_couriers_admin),
    ("Create Courier", test_api.test_create_courier),
    ("Update Courier", test_api.test_update_courier),
    ("List Pricing Rules", test_api.test_list_pricing_rules),
    ("Create Pricing Rule", test_api.test_create_pricing_rule),
    ("Get Settings (Admin)", test_api.test_get_settings_admin),
    ("Update Settings", test_api.test_update_settings),
    ("Unauthorized Access", test_api.test_unauthorized_access),
    ("Invalid Token", test_api.test_invalid_token),
]

def check_server():
    """Check if server is running"""
    try:
        response = requests.get(f"{test_api.BASE_URL}/health", timeout=2)
        return response.status_code == 200
    except:
        return False

def run_single_test_suite():
    """Run all tests once and return results"""
    # Reset admin token before each run
    reset_admin_token()
    
    results = {"passed": [], "failed": []}
    
    for test_name, test_func in ALL_TESTS:
        try:
            result = test_func()
            if result:
                results["passed"].append(test_name)
            else:
                results["failed"].append(test_name)
        except Exception as e:
            results["failed"].append(f"{test_name} (ERROR: {str(e)})")
    
    return results

def run_multiple_tests(num_runs=5):
    """Run tests multiple times and collect statistics"""
    print("=" * 70)
    print("MULTIPLE TEST RUNS - STABILITY CHECK")
    print("=" * 70)
    
    # Check server
    if not check_server():
        print("[ERROR] Server is not running! Please start the server first:")
        print("   cd backend && uvicorn app.main:app --reload --port 8000")
        return
    
    print(f"[INFO] Running {len(ALL_TESTS)} tests, {num_runs} times each")
    print(f"[INFO] Total test executions: {len(ALL_TESTS) * num_runs}")
    print()
    
    all_results = []
    total_passed = 0
    total_failed = 0
    run_times = []
    test_statistics = {test_name: {"passed": 0, "failed": 0} for test_name, _ in ALL_TESTS}
    
    for run_num in range(1, num_runs + 1):
        print(f"Run #{run_num}/{num_runs}...", end=" ", flush=True)
        
        start_time = time.time()
        results = run_single_test_suite()
        elapsed = time.time() - start_time
        run_times.append(elapsed)
        
        passed = len(results["passed"])
        failed = len(results["failed"])
        
        all_results.append({
            "run": run_num,
            "passed": passed,
            "failed": failed,
            "time": elapsed,
            "failed_tests": results["failed"].copy()
        })
        
        total_passed += passed
        total_failed += failed
        
        # Update test statistics
        for test_name in results["passed"]:
            if test_name in test_statistics:
                test_statistics[test_name]["passed"] += 1
        for test_name in results["failed"]:
            # Extract base test name (before any error message)
            base_name = test_name.split(" (ERROR:")[0]
            if base_name in test_statistics:
                test_statistics[base_name]["failed"] += 1
            else:
                # If test name not found, add it
                test_statistics[base_name] = {"passed": 0, "failed": 1}
        
        status = "[PASS]" if failed == 0 else f"[FAIL - {failed} tests]"
        print(f"{status} ({elapsed:.2f}s)")
        
        # Small delay between runs
        if run_num < num_runs:
            time.sleep(0.5)
    
    # Final Statistics
    print("\n" + "=" * 70)
    print("FINAL STATISTICS")
    print("=" * 70)
    
    print(f"\nTotal Runs: {num_runs}")
    print(f"Tests per Run: {len(ALL_TESTS)}")
    print(f"Total Test Executions: {num_runs * len(ALL_TESTS)}")
    print(f"Total Passed: {total_passed}")
    print(f"Total Failed: {total_failed}")
    
    if num_runs > 0:
        avg_passed = total_passed / num_runs
        avg_failed = total_failed / num_runs
        print(f"\nAverage per Run:")
        print(f"  Passed: {avg_passed:.1f}")
        print(f"  Failed: {avg_failed:.1f}")
    
    if run_times:
        avg_time = sum(run_times) / len(run_times)
        min_time = min(run_times)
        max_time = max(run_times)
        print(f"\nPerformance:")
        print(f"  Average Time: {avg_time:.2f}s")
        print(f"  Fastest Run: {min_time:.2f}s")
        print(f"  Slowest Run: {max_time:.2f}s")
        print(f"  Time Variance: {max_time - min_time:.2f}s")
    
    # Check for consistency
    print(f"\nConsistency Check:")
    all_passed = all(r["failed"] == 0 for r in all_results)
    if all_passed:
        print(f"  [OK] All {num_runs} runs passed 100% - System is stable!")
    else:
        inconsistent_runs = [r for r in all_results if r["failed"] > 0]
        print(f"  [WARNING] {len(inconsistent_runs)} runs had failures:")
        for run in inconsistent_runs:
            print(f"    Run #{run['run']}: {run['failed']} failures")
            if len(run['failed_tests']) <= 5:
                print(f"      Failed: {', '.join(run['failed_tests'])}")
    
    # Test reliability analysis
    print(f"\nTest Reliability Analysis:")
    flaky_tests = []
    stable_tests = []
    
    for test_name, stats in test_statistics.items():
        total = stats["passed"] + stats["failed"]
        if total > 0:
            pass_rate = (stats["passed"] / total) * 100
            if pass_rate < 100:
                flaky_tests.append((test_name, pass_rate, stats["failed"]))
            else:
                stable_tests.append(test_name)
    
    if flaky_tests:
        print(f"  [WARNING] Found {len(flaky_tests)} potentially flaky tests:")
        for test_name, pass_rate, failures in sorted(flaky_tests, key=lambda x: x[1]):
            print(f"    {test_name}: {pass_rate:.1f}% pass rate ({failures}/{num_runs} failures)")
    else:
        print(f"  [OK] All {len(ALL_TESTS)} tests are 100% reliable!")
    
    # Overall success rate
    total_tests = total_passed + total_failed
    if total_tests > 0:
        success_rate = (total_passed / total_tests) * 100
        print(f"\nOverall Success Rate: {success_rate:.2f}%")
        
        if success_rate == 100.0:
            print(f"[SUCCESS] Perfect stability - 100% pass rate across all {num_runs} runs!")
            print(f"         All {len(ALL_TESTS)} tests passed {num_runs} times each.")
        elif success_rate >= 99.0:
            print(f"[EXCELLENT] Very high stability - {success_rate:.2f}% pass rate")
        elif success_rate >= 95.0:
            print(f"[GOOD] High stability - {success_rate:.2f}% pass rate")
        else:
            print(f"[WARNING] Low stability - {success_rate:.2f}% pass rate")
            print(f"          Consider investigating flaky tests.")
    
    print("\n" + "=" * 70)
    
    return all_results, test_statistics

if __name__ == "__main__":
    # Get number of runs from command line or use default
    num_runs = 10
    if len(sys.argv) > 1:
        try:
            num_runs = int(sys.argv[1])
        except ValueError:
            print(f"[WARNING] Invalid number of runs: {sys.argv[1]}. Using default: 10")
    
    print(f"[INFO] Will run {len(ALL_TESTS)} tests, {num_runs} times each")
    print(f"[INFO] Press Ctrl+C to stop early\n")
    
    try:
        results, stats = run_multiple_tests(num_runs)
    except KeyboardInterrupt:
        print("\n\n[INFO] Tests interrupted by user")
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
