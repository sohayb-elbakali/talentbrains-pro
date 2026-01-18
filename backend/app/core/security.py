"""
Security Utilities

Authentication, authorization, and security-related utilities.
This module provides JWT handling, Supabase token verification, and auth dependencies.
"""
from typing import Optional, Annotated
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx

from app.core.config import settings


# HTTP Bearer token scheme
security_scheme = HTTPBearer(auto_error=False)


class TokenPayload:
    """Represents decoded JWT token payload."""
    
    def __init__(self, payload: dict):
        self.sub = payload.get("sub")  # User ID
        self.email = payload.get("email")
        self.role = payload.get("role", "authenticated")
        self.exp = payload.get("exp")
        self.iat = payload.get("iat")
        self.aud = payload.get("aud")
        self.raw = payload
    
    @property
    def user_id(self) -> Optional[str]:
        return self.sub
    
    @property
    def is_expired(self) -> bool:
        if not self.exp:
            return True
        return datetime.utcnow().timestamp() > self.exp


async def verify_supabase_token(token: str) -> Optional[TokenPayload]:
    """
    Verify Supabase JWT token by calling Supabase Auth API.
    
    Args:
        token: JWT token string (without 'Bearer ' prefix)
        
    Returns:
        TokenPayload if valid, None otherwise
    """
    try:
        # Call Supabase auth API to verify the token
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_key
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return TokenPayload({
                    "sub": user_data.get("id"),
                    "email": user_data.get("email"),
                    "role": user_data.get("role", "authenticated"),
                    "exp": None,  # Supabase handles expiration
                    "iat": None,
                    "aud": "authenticated",
                    "user_metadata": user_data.get("user_metadata", {}),
                    "app_metadata": user_data.get("app_metadata", {})
                })
            
            return None
            
    except Exception as e:
        print(f"Token verification error: {e}")
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> TokenPayload:
    """
    FastAPI dependency that extracts and verifies the current user from JWT token.
    
    Raises:
        HTTPException: 401 if no token or invalid token
        
    Returns:
        TokenPayload with user information
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = await verify_supabase_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> Optional[TokenPayload]:
    """
    FastAPI dependency that optionally extracts the current user.
    Returns None if no valid token is provided (doesn't raise exception).
    
    Returns:
        TokenPayload with user information or None
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    return await verify_supabase_token(token)


async def get_admin_user(
    current_user: TokenPayload = Depends(get_current_user)
) -> TokenPayload:
    """
    FastAPI dependency that requires admin role.
    
    Raises:
        HTTPException: 403 if user is not admin
        
    Returns:
        TokenPayload with admin user information
    """
    # Check for admin role in app_metadata or user_metadata
    app_metadata = current_user.raw.get("app_metadata", {})
    user_metadata = current_user.raw.get("user_metadata", {})
    
    user_role = (
        app_metadata.get("role") or 
        user_metadata.get("role") or 
        current_user.role
    )
    
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user


def require_roles(*allowed_roles: str):
    """
    Factory function to create a dependency that checks for specific roles.
    
    Args:
        allowed_roles: List of role names that are allowed access
        
    Returns:
        Dependency function that verifies user has one of the allowed roles
    """
    async def role_checker(
        current_user: TokenPayload = Depends(get_current_user)
    ) -> TokenPayload:
        app_metadata = current_user.raw.get("app_metadata", {})
        user_metadata = current_user.raw.get("user_metadata", {})
        
        user_role = (
            app_metadata.get("role") or 
            user_metadata.get("role") or 
            current_user.role
        )
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        
        return current_user
    
    return role_checker


# Type aliases for cleaner dependency injection
CurrentUser = Annotated[TokenPayload, Depends(get_current_user)]
OptionalUser = Annotated[Optional[TokenPayload], Depends(get_current_user_optional)]
AdminUser = Annotated[TokenPayload, Depends(get_admin_user)]
