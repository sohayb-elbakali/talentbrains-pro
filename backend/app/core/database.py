"""
Database Configuration

Supabase client initialization and database utilities.
"""
from supabase import create_client, Client
from functools import lru_cache
from typing import Generator

from app.core.config import settings


class SupabaseClient:
    """Singleton wrapper for Supabase client."""
    
    _instance: Client = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client instance."""
        if cls._instance is None:
            if not settings.supabase_url or not settings.supabase_key:
                raise ValueError(
                    "SUPABASE_URL and SUPABASE_KEY must be set in environment variables"
                )
            cls._instance = create_client(
                settings.supabase_url,
                settings.supabase_key
            )
        return cls._instance
    
    @classmethod
    def reset_client(cls) -> None:
        """Reset client instance (useful for testing)."""
        cls._instance = None


def get_supabase_client() -> Client:
    """
    Get Supabase client instance.
    
    This is used as a dependency injection for FastAPI routes.
    """
    return SupabaseClient.get_client()


# Convenience alias
get_db = get_supabase_client
