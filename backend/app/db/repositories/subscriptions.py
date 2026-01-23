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
    polar_subscription_id: Optional[str] = None
    polar_customer_id: Optional[str] = None
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
            polar_subscription_id=row.get("polar_subscription_id"),
            polar_customer_id=row.get("polar_customer_id"),
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
    
    async def get_by_polar_subscription(self, polar_id: str) -> Optional[UserSubscription]:
        """
        Get subscription by Polar.sh subscription ID.
        
        Used for webhook processing.
        
        Args:
            polar_id: Polar subscription ID
        
        Returns:
            UserSubscription or None
        """
        try:
            response = self._table.select("*").eq(
                "polar_subscription_id", polar_id
            ).single().execute()
            if response.data:
                return self._to_entity(response.data)
            return None
        except Exception:
            return None
    
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
        polar_subscription_id: str,
        polar_customer_id: str,
        period_start: datetime,
        period_end: datetime
    ) -> UserSubscription:
        """
        Upgrade user to Pro plan.
        
        Args:
            user_id: User UUID
            polar_subscription_id: Polar subscription ID
            polar_customer_id: Polar customer ID
            period_start: Billing period start
            period_end: Billing period end
        
        Returns:
            Updated subscription
        """
        data = {
            "plan_type": "pro",
            "status": "active",
            "polar_subscription_id": polar_subscription_id,
            "polar_customer_id": polar_customer_id,
            "current_period_start": period_start.isoformat(),
            "current_period_end": period_end.isoformat(),
            "monthly_analyses_limit": 999999,  # Unlimited
            "cancel_at_period_end": False
        }
        
        response = self._table.update(data).eq("user_id", user_id).execute()
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
            "polar_subscription_id": None,
            "current_period_start": None,
            "current_period_end": None,
            "monthly_analyses_limit": 10,
            "cancel_at_period_end": False
        }
        response = self._table.update(data).eq("user_id", user_id).execute()
        if response.data and len(response.data) > 0:
            return self._to_entity(response.data[0])
        raise DatabaseError("Failed to downgrade subscription")
