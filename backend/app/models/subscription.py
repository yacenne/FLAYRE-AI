"""
Subscription Models

Pydantic schemas for subscription and billing.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from enum import Enum


class PlanType(str, Enum):
    """Subscription plan types."""
    FREE = "free"
    PRO = "pro"


class SubscriptionStatus(str, Enum):
    """Subscription status values."""
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"


class UsageResponse(BaseModel):
    """Current usage statistics."""
    analyses_used: int
    analyses_limit: int
    analyses_remaining: int
    reset_date: Optional[datetime] = None
    
    @property
    def usage_percentage(self) -> float:
        if self.analyses_limit == 0:
            return 0.0
        return (self.analyses_used / self.analyses_limit) * 100


class SubscriptionResponse(BaseModel):
    """User subscription details."""
    id: str
    plan_type: PlanType
    status: SubscriptionStatus
    is_pro: bool
    usage: UsageResponse
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    
    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    """Request to create checkout session."""
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class CheckoutResponse(BaseModel):
    """Checkout session response."""
    checkout_url: str
    session_id: Optional[str] = None


class WebhookEvent(BaseModel):
    """Polar.sh webhook event structure."""
    type: str
    data: dict


class SubscriptionCreatedPayload(BaseModel):
    """Payload for subscription.created webhook."""
    id: str
    customer_id: str
    product_id: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    customer_email: str


class SubscriptionCancelledPayload(BaseModel):
    """Payload for subscription.cancelled webhook."""
    id: str
    customer_id: str
    cancel_at_period_end: bool
