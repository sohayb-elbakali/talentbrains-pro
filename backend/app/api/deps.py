"""
API Dependencies

Common dependencies for API endpoints.
Provides dependency injection for database connections, authentication, etc.
"""
from typing import Generator
from fastapi import Depends, HTTPException, status
from supabase import Client

from app.core.database import get_supabase_client
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


# Placeholder for future authentication dependency
# async def get_current_user(
#     token: str = Depends(oauth2_scheme),
#     client: Client = Depends(get_db_client)
# ) -> dict:
#     """Get current authenticated user from JWT token."""
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
#     # Implement JWT verification here
#     pass
