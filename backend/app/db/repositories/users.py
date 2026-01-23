"""
User Repository

Database operations for user profiles.
"""

from typing import Optional, Any
from dataclasses import dataclass
from datetime import datetime
from supabase import Client

from app.db.repositories.base import BaseRepository
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class UserProfile:
    """User profile entity."""
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserRepository(BaseRepository[UserProfile]):
    """Repository for user profile operations."""
    
    @property
    def table_name(self) -> str:
        return "profiles"
    
    def _to_entity(self, row: dict[str, Any]) -> UserProfile:
        return UserProfile(
            id=row["id"],
            email=row["email"],
            full_name=row.get("full_name"),
            avatar_url=row.get("avatar_url"),
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at")
        )
    
    async def get_by_email(self, email: str) -> Optional[UserProfile]:
        """
        Find user by email address.
        
        Args:
            email: User's email address
        
        Returns:
            UserProfile or None
        """
        try:
            response = self._table.select("*").eq("email", email).single().execute()
            if response.data:
                return self._to_entity(response.data)
            return None
        except Exception as e:
            logger.debug(f"User not found by email: {email}")
            return None
    
    async def update_profile(
        self,
        user_id: str,
        full_name: Optional[str] = None,
        avatar_url: Optional[str] = None
    ) -> UserProfile:
        """
        Update user profile fields.
        
        Args:
            user_id: User UUID
            full_name: New display name
            avatar_url: New avatar URL
        
        Returns:
            Updated profile
        """
        data = {}
        if full_name is not None:
            data["full_name"] = full_name
        if avatar_url is not None:
            data["avatar_url"] = avatar_url
        
        return await self.update(user_id, data)
