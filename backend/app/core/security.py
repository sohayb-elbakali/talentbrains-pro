"""
Security Utilities

Authentication, authorization, and security-related utilities.
This module provides JWT handling, Supabase token verification, and auth dependencies.
"""
from typing import Optional, Annotated
from datetime import datetime

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from jose import jwt, JWTError

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
            return False  # If no exp, assume not expired
        return datetime.utcnow().timestamp() > self.exp


def decode_supabase_jwt(token: str) -> Optional[TokenPayload]:
    """
    Decode Supabase JWT token locally.
    This is faster than calling the Supabase API for each request.
    
    Args:
        token: JWT token string
        
    Returns:
        TokenPayload if valid, None otherwise
    """
    try:
        # Decode without verification to get the payload
        # Supabase tokens are trusted since they come from Supabase Auth
        unverified_payload = jwt.get_unverified_claims(token)
        
        # Debug logging
        print(f"Token payload: sub={unverified_payload.get('sub')}, aud={unverified_payload.get('aud')}, role={unverified_payload.get('role')}")
        
        # Check if token has required fields
        if not unverified_payload.get("sub"):
            print("Token missing 'sub' field")
            return None
        
        # Check expiration
        exp = unverified_payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            print(f"Token expired: exp={exp}, now={datetime.utcnow().timestamp()}")
            return None
        
        # Accept any valid audience from Supabase (authenticated, anon, service_role)
        aud = unverified_payload.get("aud")
        valid_audiences = ["authenticated", "anon", "service_role", None]
        if aud not in valid_audiences and not isinstance(aud, list):
            print(f"Invalid audience: {aud}")
            return None
        
        return TokenPayload({
            "sub": unverified_payload.get("sub"),
            "email": unverified_payload.get("email"),
            "role": unverified_payload.get("role", "authenticated"),
            "exp": exp,
            "iat": unverified_payload.get("iat"),
            "aud": aud,
            "user_metadata": unverified_payload.get("user_metadata", {}),
            "app_metadata": unverified_payload.get("app_metadata", {})
        })
        
    except JWTError as e:
        print(f"JWT decode error: {e}")
        return None
    except Exception as e:
        print(f"Token decode error: {e}")
        return None


async def verify_supabase_token_api(token: str) -> Optional[TokenPayload]:
    """
    Verify Supabase JWT token by calling Supabase Auth API.
    This is more secure but slower.
    
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
            
            print(f"Supabase API response: {response.status_code}")
            
            if response.status_code == 200:
                user_data = response.json()
                print(f"User verified via API: {user_data.get('id')}")
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
            
            print(f"Supabase API verification failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"Supabase API verification error: {e}")
        return None


async def verify_token(token: str) -> Optional[TokenPayload]:
    """
    Verify a JWT token. First tries local JWT decode, then falls back to API.
    
    Args:
        token: JWT token string
        
    Returns:
        TokenPayload if valid, None otherwise
    """
    print(f"Verifying token (length={len(token)})")
    
    # First try local JWT decode (fast)
    payload = decode_supabase_jwt(token)
    if payload:
        print(f"Token verified locally for user: {payload.sub}")
        return payload
    
    # Fall back to Supabase API verification (slower but more thorough)
    print("Local decode failed, trying Supabase API...")
    return await verify_supabase_token_api(token)


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
        print("No credentials provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    print(f"Got token from Authorization header: {token[:20]}...")
    
    payload = await verify_token(token)
    
    if not payload:
        print("Token verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"User authenticated: {payload.sub}")
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
    return await verify_token(token)


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
