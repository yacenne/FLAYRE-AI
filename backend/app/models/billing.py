"""
Billing Models

Pydantic schemas for Razorpay payments and subscription management.
"""

from typing import Optional
from pydantic import BaseModel, ConfigDict, HttpUrl


class CheckoutRequest(BaseModel):
    """Legacy checkout request schema."""
    success_url: HttpUrl
    cancel_url: HttpUrl
    plan: str = "pro"


class CreateOrderRequest(BaseModel):
    """Request schema for creating a Razorpay order."""
    plan: str = "pro"


class CreateOrderResponse(BaseModel):
    """Response schema for created Razorpay order."""
    order_id: str
    amount: int
    currency: str
    key_id: str


class VerifyRequest(BaseModel):
    """Request schema for verifying a completed Razorpay payment."""
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan: str = "pro"


class VerifyResponse(BaseModel):
    """Response schema for payment verification."""
    success: bool
    plan: str
    note: Optional[str] = None


class SubscriptionUsage(BaseModel):
    """Usage statistics embedded within subscription response."""
    analyses_used: int
    analyses_limit: int
    analyses_remaining: int


class SubscriptionStatusResponse(BaseModel):
    """Response schema for user's subscription status."""
    plan_type: str
    is_pro: bool
    usage: SubscriptionUsage

    model_config = ConfigDict(from_attributes=True)
