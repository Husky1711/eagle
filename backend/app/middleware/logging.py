"""
Request/Response logging middleware
"""
import time
import uuid
from datetime import datetime
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message
from app.utils.logger import access_logger, logger
from app.utils.log_sanitizer import LogSanitizer


def generate_request_id() -> str:
    """Generate unique request ID with date prefix"""
    date_str = datetime.utcnow().strftime("%Y%m%d")
    unique_id = str(uuid.uuid4())[:8]
    return f"req-{date_str}-{unique_id}"


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests and responses"""
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID
        request_id = generate_request_id()
        request.state.request_id = request_id
        
        # Start timer
        start_time = time.time()
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Get user info (if authenticated)
        user = None
        if hasattr(request.state, "user"):
            user = request.state.user
        
        # Log request
        request_log = {
            "type": "access",
            "request_id": request_id,
            "method": request.method,
            "path": str(request.url.path),
            "query_params": dict(request.query_params),
            "client_ip": client_ip,
            "user_agent": request.headers.get("user-agent", ""),
            "user": user,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # Sanitize query params
        request_log["query_params"] = LogSanitizer.sanitize_dict(
            request_log["query_params"], "request"
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Get response status
            status_code = response.status_code
            
            # Determine log level based on status and duration
            if status_code >= 500:
                log_level = "ERROR"
            elif status_code >= 400:
                log_level = "WARNING"
            elif duration_ms > 1000:  # Slow request threshold
                log_level = "WARNING"
            else:
                log_level = "INFO"
            
            # Log response
            response_log = {
                **request_log,
                "status_code": status_code,
                "duration_ms": round(duration_ms, 2),
                "log_level": log_level,
            }
            
            # Log with appropriate level
            if log_level == "ERROR":
                logger.error(
                    f"{request.method} {request.url.path} - {status_code} - {duration_ms:.2f}ms",
                    extra=response_log
                )
            elif log_level == "WARNING":
                logger.warning(
                    f"{request.method} {request.url.path} - {status_code} - {duration_ms:.2f}ms",
                    extra=response_log
                )
            else:
                access_logger.bind(type="access").info(
                    f"{request.method} {request.url.path} - {status_code} - {duration_ms:.2f}ms",
                    extra=response_log
                )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Log exception
            duration_ms = (time.time() - start_time) * 1000
            
            error_log = {
                **request_log,
                "status_code": 500,
                "duration_ms": round(duration_ms, 2),
                "error": str(e),
                "error_type": type(e).__name__,
            }
            
            logger.bind(**error_log).error(
                f"{request.method} {request.url.path} - EXCEPTION - {duration_ms:.2f}ms - {str(e)}",
                exc_info=True
            )
            
            # Re-raise exception
            raise

