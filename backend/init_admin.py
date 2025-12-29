"""
Script to initialize or update admin password
Run this to set up the admin user with a secure password
"""
import sys
from app.auth import get_password_hash
from app.utils.json_handler import JSONHandler
from app.config import settings

def init_admin(username: str = "admin", password: str = None):
    """Initialize admin user with password"""
    
    if not password:
        print("Usage: python init_admin.py <username> <password>")
        print("Example: python init_admin.py admin mySecurePassword123")
        sys.exit(1)
    
    json_handler = JSONHandler(settings.DATA_DIR)
    admin_data = json_handler.read("admin.json")
    
    # Hash password
    password_hash = get_password_hash(password)
    
    # Check if user exists
    users = admin_data.get("users", [])
    user = next((u for u in users if u.get("username") == username), None)
    
    if user:
        # Update existing user
        user["password_hash"] = password_hash
        print(f"[OK] Updated password for user '{username}'")
    else:
        # Create new user
        new_user = {
            "username": username,
            "password_hash": password_hash,
            "created_at": "2024-01-01T00:00:00Z",
            "last_login": None
        }
        users.append(new_user)
        print(f"[OK] Created new admin user '{username}'")
    
    admin_data["users"] = users
    json_handler.write("admin.json", admin_data)
    print("[OK] Admin user saved successfully!")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python init_admin.py <username> <password>")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    init_admin(username, password)

