import requests
import sys

# File we know exists from previous 'ls'
TEST_FILENAME = "6cfda02b-93db-454b-8922-7d69bab217c8.jpg"
URL = f"http://127.0.0.1:8000/uploads/{TEST_FILENAME}"

print(f"Testing access to: {URL}")

try:
    response = requests.get(URL, timeout=5)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"Success! Content Content-Type: {response.headers.get('Content-Type')}")
        print(f"Content Length: {len(response.content)} bytes")
    else:
        print("Failed to retrieve image.")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Error connecting to backend: {e}")
