"""
Base Repository

Abstract base class for all repositories.
"""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Any
from supabase import Client

from app.core.database import get_supabase_client


T = TypeVar('T')


class BaseRepository(ABC, Generic[T]):
    """
    Abstract base repository providing common database operations.
    
    All specific repositories should inherit from this class
    and implement the abstract methods.
    """
    
    def __init__(self, client: Client = None):
        """Initialize repository with Supabase client."""
        self._client = client
    
    @property
    def client(self) -> Client:
        """Get Supabase client, creating if necessary."""
        if self._client is None:
            self._client = get_supabase_client()
        return self._client
    
    @property
    @abstractmethod
    def table_name(self) -> str:
        """Return the table name for this repository."""
        pass
    
    @abstractmethod
    async def get_by_id(self, id: str) -> Optional[T]:
        """Get a single record by ID."""
        pass
    
    @abstractmethod
    async def get_all(self) -> List[T]:
        """Get all records."""
        pass
    
    async def create(self, data: dict) -> Optional[dict]:
        """Create a new record."""
        try:
            response = self.client.table(self.table_name).insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating record in {self.table_name}: {e}")
            return None
    
    async def update(self, id: str, data: dict) -> Optional[dict]:
        """Update an existing record."""
        try:
            response = self.client.table(self.table_name).update(data).eq("id", id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error updating record in {self.table_name}: {e}")
            return None
    
    async def delete(self, id: str) -> bool:
        """Delete a record by ID."""
        try:
            self.client.table(self.table_name).delete().eq("id", id).execute()
            return True
        except Exception as e:
            print(f"Error deleting record in {self.table_name}: {e}")
            return False
