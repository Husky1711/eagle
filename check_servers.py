"""Check if backend and frontend servers are running"""
import requests
import time

print("\n" + "="*70)
print("CHECKING SERVERS...")
print("="*70 + "\n")

# Check Backend
print("Checking Backend (http://localhost:8000)...")
try:
    r = requests.get('http://localhost:8000/health', timeout=3)
    if r.status_code == 200:
        print("[OK] Backend is RUNNING")
        backend_ok = True
    else:
        print(f"[FAIL] Backend returned status: {r.status_code}")
        backend_ok = False
except Exception as e:
    print(f"[FAIL] Backend is NOT RUNNING: {str(e)}")
    backend_ok = False

time.sleep(2)

# Check Frontend
print("\nChecking Frontend (http://localhost:5173)...")
try:
    r = requests.get('http://localhost:5173', timeout=5)
    if r.status_code == 200:
        print("[OK] Frontend is RUNNING")
        frontend_ok = True
    else:
        print(f"[WARNING] Frontend returned status: {r.status_code}")
        frontend_ok = True  # Still consider it running
except Exception as e:
    print(f"[WAIT] Frontend may still be starting...")
    print(f"      Error: {str(e)}")
    frontend_ok = False

# Summary
print("\n" + "="*70)
print("SERVER STATUS & URLs")
print("="*70)
print(f"\nBackend Server:")
print(f"  URL: http://localhost:8000")
print(f"  API Docs: http://localhost:8000/docs")
print(f"  Status: {'RUNNING' if backend_ok else 'NOT RUNNING'}")

print(f"\nFrontend Server:")
print(f"  URL: http://localhost:5173")
print(f"  Status: {'RUNNING' if frontend_ok else 'STARTING (check PowerShell window)'}")

print("\n" + "="*70)
print("NEXT STEPS:")
print("="*70)
print("1. Open your browser")
print("2. Visit: http://localhost:5173")
print("3. You should see the LogiSmart website!")
print("\nIf frontend is not running, check the PowerShell window that opened")
print("for any error messages.")
print("="*70 + "\n")

