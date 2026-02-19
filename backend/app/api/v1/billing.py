"""
Billing endpoints (compatibility layer).

These endpoints preserve the existing frontend contract for subscription lookup
and checkout initiation while billing provider integration is rebuilt.
"""

from pydantic import BaseModel, HttpUrl
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user_id, get_subscription_repo
from app.db.repositories import SubscriptionRepository

router = APIRouter()


class CheckoutRequest(BaseModel):
    """Client-provided URLs for post-checkout redirects."""

    success_url: HttpUrl
    cancel_url: HttpUrl


@router.get("/subscription")
async def get_subscription(
    user_id: str = Depends(get_current_user_id),
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    """Return the current user's subscription details."""
    subscription = await subscription_repo.get_or_create_subscription(user_id)

    return {
        "plan_type": subscription.plan_type,
        "is_pro": subscription.is_pro,
        "usage": {
            "analyses_used": subscription.monthly_analyses_used,
            "analyses_limit": subscription.monthly_analyses_limit,
            "analyses_remaining": subscription.analyses_remaining,
        },
    }


@router.post("/checkout")
async def create_checkout_session(
    request: CheckoutRequest,
    user_id: str = Depends(get_current_user_id),
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    """
    Start checkout flow.

    Billing provider integration is currently unavailable, so this preserves the
    frontend flow by redirecting authenticated users to a deterministic URL.
    """
    subscription = await subscription_repo.get_or_create_subscription(user_id)

    if subscription.is_pro:
        return {"checkout_url": str(request.success_url), "status": "already_pro"}

    return {
        "checkout_url": str(request.cancel_url),
        "status": "billing_unavailable",
        "message": "Billing checkout is temporarily unavailable.",
    }
