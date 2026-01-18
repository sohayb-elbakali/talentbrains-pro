"""
API Dependencies

Common dependencies for API endpoints.
Provides dependency injection for database connections, authentication, etc.
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from supabase import Client

from app.core.database import get_supabase_client
from app.core.security import (
    get_current_user,
    get_current_user_optional,
    get_admin_user,
    require_roles,
    CurrentUser,
    OptionalUser,
    AdminUser,
    TokenPayload
)
from app.repositories.talent_repo import TalentRepository
from app.repositories.job_repo import JobRepository
from app.services.matching_service import MatchingService


def get_db_client() -> Client:
    """
    Dependency that provides a Supabase client.
    
    Returns:
        Supabase Client instance
    """
    return get_supabase_client()


def get_talent_repository(
    client: Client = Depends(get_db_client)
) -> TalentRepository:
    """
    Dependency that provides a TalentRepository instance.
    
    Args:
        client: Supabase client from dependency
        
    Returns:
        TalentRepository instance
    """
    return TalentRepository(client=client)


def get_job_repository(
    client: Client = Depends(get_db_client)
) -> JobRepository:
    """
    Dependency that provides a JobRepository instance.
    
    Args:
        client: Supabase client from dependency
        
    Returns:
        JobRepository instance
    """
    return JobRepository(client=client)


def get_matching_service() -> MatchingService:
    """
    Dependency that provides a MatchingService instance.
    
    Returns:
        MatchingService instance
    """
    return MatchingService()


# Re-export security dependencies for convenient access
__all__ = [
    "get_db_client",
    "get_talent_repository",
    "get_job_repository",
    "get_matching_service",
    "get_current_user",
    "get_current_user_optional",
    "get_admin_user",
    "require_roles",
    "CurrentUser",
    "OptionalUser",
    "AdminUser",
    "TokenPayload"
]
