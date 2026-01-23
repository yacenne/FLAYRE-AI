"""
Repository Pattern - Base Repository

Abstract base class for all repositories providing common CRUD operations.
"""

from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar, Optional
from supabase import Client

from app.core.logging import get_logger
from app.core.exceptions import DatabaseError, ResourceNotFoundError

logger = get_logger(__name__)

# Generic type for entities
T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """
    Abstract base repository with common CRUD operations.
    
    Subclasses must define:
        - table_name: Name of the Supabase table
        - _to_entity: Convert DB row to entity
    """
    
    def __init__(self, client: Client):
        self.client = client
        self._table = client.table(self.table_name)
    
    @property
    @abstractmethod
    def table_name(self) -> str:
        """Name of the database table."""
        pass
    
    @abstractmethod
    def _to_entity(self, row: dict[str, Any]) -> T:
        """Convert database row to domain entity."""
        pass
    
    async def get_by_id(self, id: str) -> Optional[T]:
        """
        Get a single record by ID.
        
        Args:
            id: Record UUID
        
        Returns:
            Entity or None if not found
        """
        try:
            response = self._table.select("*").eq("id", id).single().execute()
            if response.data:
                return self._to_entity(response.data)
            return None
        except Exception as e:
            logger.error(f"Error fetching {self.table_name} by id: {e}")
            raise DatabaseError(f"Failed to fetch {self.table_name}")
    
    async def get_all(
        self,
        limit: int = 100,
        offset: int = 0,
        order_by: str = "created_at",
        ascending: bool = False
    ) -> list[T]:
        """
        Get all records with pagination.
        
        Args:
            limit: Maximum records to return
            offset: Number of records to skip
            order_by: Column to sort by
            ascending: Sort direction
        
        Returns:
            List of entities
        """
        try:
            query = self._table.select("*")
            query = query.order(order_by, desc=not ascending)
            query = query.range(offset, offset + limit - 1)
            response = query.execute()
            return [self._to_entity(row) for row in response.data]
        except Exception as e:
            logger.error(f"Error fetching all {self.table_name}: {e}")
            raise DatabaseError(f"Failed to fetch {self.table_name}")
    
    async def create(self, data: dict[str, Any]) -> T:
        """
        Create a new record.
        
        Args:
            data: Record data
        
        Returns:
            Created entity
        """
        try:
            response = self._table.insert(data).execute()
            if response.data and len(response.data) > 0:
                return self._to_entity(response.data[0])
            raise DatabaseError(f"Failed to create {self.table_name}")
        except Exception as e:
            logger.error(f"Error creating {self.table_name}: {e}")
            raise DatabaseError(f"Failed to create {self.table_name}")
    
    async def update(self, id: str, data: dict[str, Any]) -> T:
        """
        Update an existing record.
        
        Args:
            id: Record UUID
            data: Fields to update
        
        Returns:
            Updated entity
        """
        try:
            response = self._table.update(data).eq("id", id).execute()
            if response.data and len(response.data) > 0:
                return self._to_entity(response.data[0])
            raise ResourceNotFoundError(self.table_name, id)
        except ResourceNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error updating {self.table_name}: {e}")
            raise DatabaseError(f"Failed to update {self.table_name}")
    
    async def delete(self, id: str) -> bool:
        """
        Delete a record by ID.
        
        Args:
            id: Record UUID
        
        Returns:
            True if deleted
        """
        try:
            response = self._table.delete().eq("id", id).execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            logger.error(f"Error deleting {self.table_name}: {e}")
            raise DatabaseError(f"Failed to delete {self.table_name}")
