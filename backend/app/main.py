"""
FastAPI main application
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.config import settings
from app.middleware import setup_cors
from app.middleware.logging import LoggingMiddleware
from app.routers import public, admin
from app.routers import admin_profile
from app.utils.logger import logger
from app.utils.log_sanitizer import LogSanitizer
import traceback

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Logistics Aggregator CMS - Backend API"
)

# Setup CORS
setup_cors(app)

# Add logging middleware
app.add_middleware(LoggingMiddleware)

# Mount static files (for uploaded images)
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOADS_DIR)), name="uploads")

# Include routers
app.include_router(public.router, prefix="/api/public", tags=["Public"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(admin_profile.router, prefix="/api/admin", tags=["Admin"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler with logging"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Get user if available
    user = getattr(request.state, "user", None)
    
    # Build error context
    error_context = {
        "request_id": request_id,
        "path": str(request.url.path),
        "method": request.method,
        "user": user,
        "client_ip": request.client.host if request.client else "unknown",
        "error_type": type(exc).__name__,
        "error_message": str(exc),
    }
    
    # Sanitize error context
    error_context = LogSanitizer.sanitize_error_context(error_context)
    
    # Log full exception with stack trace
    logger.bind(**error_context).error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        exc_info=True
    )
    
    # Return sanitized error response
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "request_id": request_id
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """HTTP exception handler with logging"""
    request_id = getattr(request.state, "request_id", "unknown")
    user = getattr(request.state, "user", None)
    
    # Log HTTP exceptions (4xx, 5xx)
    log_level = "ERROR" if exc.status_code >= 500 else "WARNING"
    
    error_context = {
        "request_id": request_id,
        "path": str(request.url.path),
        "method": request.method,
        "status_code": exc.status_code,
        "user": user,
        "client_ip": request.client.host if request.client else "unknown",
    }
    
    error_context = LogSanitizer.sanitize_error_context(error_context)
    
    if log_level == "ERROR":
        logger.bind(**error_context).error(
            f"HTTP {exc.status_code}: {exc.detail}"
        )
    else:
        logger.bind(**error_context).warning(
            f"HTTP {exc.status_code}: {exc.detail}"
        )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "request_id": request_id
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Validation error handler with logging"""
    request_id = getattr(request.state, "request_id", "unknown")
    user = getattr(request.state, "user", None)
    
    # Sanitize validation errors
    errors = LogSanitizer.sanitize_list(exc.errors(), "error")
    
    error_context = {
        "request_id": request_id,
        "path": str(request.url.path),
        "method": request.method,
        "user": user,
        "validation_errors": errors,
    }
    
    logger.bind(**error_context).warning(
        f"Validation error: {len(errors)} field(s) invalid"
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": errors,
            "request_id": request_id
        }
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Logistics Aggregator CMS API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

