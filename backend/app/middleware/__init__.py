# Middleware modules
# Import from parent level middleware.py (not this package)
import sys
from pathlib import Path

# Add parent directory to path to import middleware.py
parent_dir = Path(__file__).parent.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

# Import from the middleware.py file (not this package)
import importlib.util
spec = importlib.util.spec_from_file_location("app.middleware_module", parent_dir / "middleware.py")
middleware_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(middleware_module)

setup_cors = middleware_module.setup_cors
rate_limit_login = middleware_module.rate_limit_login

__all__ = ["setup_cors", "rate_limit_login"]

