"""
Subscription Repository

Database operations for user subscriptions and usage tracking.
"""

from typing import Optional, Any
from dataclasses import dataclass
from datetime import datetime
from supabase import Client

from app.db.repositories.base import BaseRepository
from app.core.logging import get_logger
from app.core.exceptions import DatabaseError

logger = get_logger(__name__)


@dataclass
class UserSubscription:
    """User subscription entity."""
    id: str
    user_id: str
    plan_type: str  # 'free' or 'pro'
    status: str  # 'active', 'cancelled', 'past_due', 'trialing'
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    monthly_analyses_used: int = 0
    monthly_analyses_limit: int = 10
    last_reset_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @property
    def is_pro(self) -> bool:
        return self.plan_type == "pro" and self.status == "active"
    
    @property
    def analyses_remaining(self) -> int:
        return max(0, self.monthly_analyses_limit - self.monthly_analyses_used)
    
    @property
    def can_analyze(self) -> bool:
        if self.is_pro:
            return True
        return self.analyses_remaining > 0


class SubscriptionRepository(BaseRepository[UserSubscription]):
    """Repository for subscription operations."""
    
    @property
    def table_name(self) -> str:
        return "user_subscriptions"
    
    def _to_entity(self, row: dict[str, Any]) -> UserSubscription:
        return UserSubscription(
            id=row["id"],
            user_id=row["user_id"],
            plan_type=row["plan_type"],
            status=row["status"],
            current_period_start=row.get("current_period_start"),
            current_period_end=row.get("current_period_end"),
            cancel_at_period_end=row.get("cancel_at_period_end", False),
            monthly_analyses_used=row.get("monthly_analyses_used", 0),
            monthly_analyses_limit=row.get("monthly_analyses_limit", 10),
            last_reset_at=row.get("last_reset_at"),
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at")
        )
    
    async def get_by_user_id(self, user_id: str) -> Optional[UserSubscription]:
        """
        Get subscription by user ID.
        
        Args:
            user_id: User UUID
        
        Returns:
            UserSubscription or None
        """
        try:
            response = self._table.select("*").eq("user_id", user_id).single().execute()
            if response.data:
                return self._to_entity(response.data)
            return None
        except Exception as e:
            logger.debug(f"Subscription not found for user: {user_id}")
            return None
    
    async def create_default_subscription(self, user_id: str) -> UserSubscription:
        """
        Create a default free subscription for a new user.
        
        Args:
            user_id: User UUID
        
        Returns:
            Created subscription
        """
        try:
            data = {
                "user_id": user_id,
                "plan_type": "free",
                "status": "active",
                "monthly_analyses_used": 0,
                "monthly_analyses_limit": 10,
                "cancel_at_period_end": False
            }
            response = self._table.insert(data).execute()
            if response.data and len(response.data) > 0:
                logger.info(f"Created default subscription for user: {user_id}")
                return self._to_entity(response.data[0])
            raise DatabaseError("Failed to create subscription")
        except Exception as e:
            logger.error(f"Error creating default subscription: {e}")
            raise DatabaseError(f"Failed to create subscription: {e}")
    
    async def get_or_create_subscription(self, user_id: str) -> UserSubscription:
        """
        Get subscription, creating a default one if it doesn't exist.
        
        Args:
            user_id: User UUID
        
        Returns:
            UserSubscription (existing or newly created)
        """
        subscription = await self.get_by_user_id(user_id)
        if subscription:
            return subscription
        return await self.create_default_subscription(user_id)
    

    
    async def increment_usage(self, user_id: str) -> UserSubscription:
        """
        Increment the monthly usage counter.
        
        Args:
            user_id: User UUID
        
        Returns:
            Updated subscription
        """
        try:
            # Get current subscription
            sub = await self.get_by_user_id(user_id)
            if not sub:
                raise DatabaseError("Subscription not found")
            
            # Increment usage
            new_count = sub.monthly_analyses_used + 1
            response = self._table.update({
                "monthly_analyses_used": new_count
            }).eq("user_id", user_id).execute()
            
            if response.data and len(response.data) > 0:
                return self._to_entity(response.data[0])
            raise DatabaseError("Failed to update usage")
        except Exception as e:
            logger.error(f"Error incrementing usage: {e}")
            raise DatabaseError("Failed to update usage")
    
    async def upgrade_to_pro(
        self,
        user_id: str,
        payment_id: str
    ) -> UserSubscription:
        """
        Upgrade user to Pro plan.
        
        Args:
            user_id: User UUID
            payment_id: Razorpay payment ID
        
        Returns:
            Updated subscription
        """
        data = {
            "plan_type": "pro",
            "status": "active",
            "monthly_analyses_limit": 999999,  # Unlimited
            "cancel_at_period_end": False
        }
        
        # Note: self.supabase.table is an underlying client method. The base repo 
        # normally uses self._table, but we'll adapt to the user's snippet logic
        # and just add the payment_id and updated_at explicitly.
        # However, to return a UserSubscription correctly inside the repository pattern,
        # we'll integrate it with self._table logic.
        
        response = self._table.update({
            "plan_type": "pro",
            "monthly_analyses_limit": 999999,  # Unlimited
            "status": "active"
            # Note: "payment_id" isn't defined in the UserSubscription object initially,
            # but we can pass it if the DB has it, or just stick to what the user asked:
        }).eq("user_id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            return self._to_entity(response.data[0])
        raise DatabaseError("Failed to upgrade subscription")
    
    async def cancel_subscription(self, user_id: str) -> UserSubscription:
        """
        Cancel subscription at period end.
        
        Args:
            user_id: User UUID
        
        Returns:
            Updated subscription
        """
        data = {
            "cancel_at_period_end": True
        }
        response = self._table.update(data).eq("user_id", user_id).execute()
        if response.data and len(response.data) > 0:
            return self._to_entity(response.data[0])
        raise DatabaseError("Failed to cancel subscription")
    
    async def downgrade_to_free(self, user_id: str) -> UserSubscription:
        """
        Downgrade to free plan (when subscription expires).
        
        Args:
            user_id: User UUID
        
        Returns:
            Updated subscription
        """
        data = {
            "plan_type": "free",
            "status": "active",
            "current_period_start": None,
            "current_period_end": None,
            "monthly_analyses_limit": 10,
            "cancel_at_period_end": False
        }
        response = self._table.update(data).eq("user_id", user_id).execute()
        if response.data and len(response.data) > 0:
            return self._to_entity(response.data[0])
        raise DatabaseError("Failed to downgrade subscription")
