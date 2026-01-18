"""
TalentBrains API - Application Entry Point

This module creates and configures the FastAPI application with security features.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.rate_limit import setup_rate_limiting
from app.api.v1.router import api_router


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title=settings.app_name,
        description="AI-Powered Talent Matching Platform API",
        version=settings.app_version,
        docs_url="/docs" if settings.debug else None,  # Disable docs in production
        redoc_url="/redoc" if settings.debug else None,
        openapi_url="/openapi.json" if settings.debug else None
    )
    
    # Configure CORS middleware with specific origins and methods
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Client-Info",
            "X-Request-ID",
            "Accept",
            "Origin",
        ],
        expose_headers=["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
        max_age=600,  # Cache preflight requests for 10 minutes
    )
    
    # Set up rate limiting
    setup_rate_limiting(app)
    
    # Debug middleware to log requests (remove in production)
    @app.middleware("http")
    async def debug_auth_middleware(request: Request, call_next):
        auth_header = request.headers.get("Authorization", "None")
        if "matching" in request.url.path:
            print(f"[DEBUG] Request to {request.url.path}")
            print(f"[DEBUG] Authorization header present: {auth_header[:30] if auth_header != 'None' else 'None'}...")
            print(f"[DEBUG] All headers: {dict(request.headers)}")
        response = await call_next(request)
        return response
    
    # Global exception handler for unhandled errors
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """
        Global exception handler that prevents leaking internal details.
        """
        # Log the actual error internally
        print(f"Unhandled error: {type(exc).__name__}: {exc}")
        
        # Return a safe error message to the client
        if settings.debug:
            # In debug mode, show more details
            return JSONResponse(
                status_code=500,
                content={
                    "detail": str(exc),
                    "type": type(exc).__name__
                }
            )
        else:
            # In production, hide internal details
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "An internal error occurred. Please try again later."
                }
            )
    
    # Include API routers
    app.include_router(
        api_router,
        prefix=settings.api_v1_prefix
    )
    
    # Root endpoints
    @app.get("/")
    def read_root():
        """Root endpoint returning API information."""
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "status": "running",
            "docs": "/docs" if settings.debug else "disabled"
        }
    
    @app.get("/health")
    def health_check():
        """Health check endpoint."""
        return {"status": "healthy"}
    
    return app


# Create application instance
app = create_app()
