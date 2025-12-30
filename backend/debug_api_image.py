import requests

# The file we found on disk
TEST_FILENAME = "c315cc88-0469-4609-90c9-fb6f64f33d2a.jpg"

# The URL the frontend is trying to use (proxied via 5173 or direct to 8000)
# Testing direct to backend first to isolate backend logic from proxy
URL = f"http://127.0.0.1:8000/api/public/uploads/{TEST_FILENAME}"

print(f"Testing access to: {URL}")

try:
    response = requests.get(URL, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {response.headers}")
    if response.status_code == 200:
        print(f"Success! Content-Type: {response.headers.get('Content-Type')}")
        print(f"Content Length: {len(response.content)} bytes")
    else:
        print("Failed to retrieve image.")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Error connecting to backend: {e}")
