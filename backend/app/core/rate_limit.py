"""
Rate Limiting Configuration

Provides rate limiting middleware and decorators to protect API endpoints
from abuse and resource exhaustion attacks.
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request


def get_user_identifier(request: Request) -> str:
    """
    Get a unique identifier for rate limiting.
    Uses authenticated user ID if available, otherwise falls back to IP address.
    """
    # Try to get user from authorization header (if authenticated)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        # Use a hash of the token as identifier (more specific limiting)
        token = auth_header[7:]
        if len(token) > 20:
            # Use last 20 chars of token as identifier (enough for uniqueness)
            return f"user:{token[-20:]}"
    
    # Fall back to IP address for unauthenticated requests
    return get_remote_address(request)


# Create the rate limiter with custom key function
limiter = Limiter(
    key_func=get_user_identifier,
    default_limits=["100/minute"],  # Default limit for all endpoints
    storage_uri="memory://",  # Use memory storage (for production, use Redis)
    strategy="fixed-window"
)


# Rate limit presets for different endpoint types
class RateLimits:
    """Predefined rate limits for different types of operations."""
    
    # Authentication endpoints - strict limits to prevent brute force
    AUTH = "5/minute"
    
    # Data reading endpoints - moderate limits
    READ = "60/minute"
    
    # Data writing endpoints - stricter limits
    WRITE = "30/minute"
    
    # Expensive operations (matching, analytics) - strict limits
    COMPUTE = "10/minute"
    
    # Admin operations - moderate limits
    ADMIN = "20/minute"
    
    # Public/health endpoints - relaxed limits
    PUBLIC = "200/minute"


def setup_rate_limiting(app):
    """
    Set up rate limiting on the FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
