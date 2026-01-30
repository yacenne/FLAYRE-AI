"""
Billing Endpoints

Subscription management and Polar.sh checkout integration.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime

from app.api.deps import CurrentUser, get_subscription_repo
from app.db.repositories import SubscriptionRepository
from app.models.subscription import (
    SubscriptionResponse,
    UsageResponse,
    CheckoutRequest,
    CheckoutResponse,
    PlanType,
    SubscriptionStatus
)
from app.services.billing import create_checkout_session, cancel_subscription
from app.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    user_id: CurrentUser,
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo)
):
    """
    Get current user subscription details.
    Creates a default free subscription if one doesn't exist.
    """
    # This will create a free subscription if the user doesn't have one
    subscription = await subscription_repo.get_or_create_subscription(user_id)
    
    return SubscriptionResponse(
        id=subscription.id,
        plan_type=PlanType(subscription.plan_type),
        status=SubscriptionStatus(subscription.status),
        is_pro=subscription.is_pro,
        usage=UsageResponse(
            analyses_used=subscription.monthly_analyses_used,
            analyses_limit=subscription.monthly_analyses_limit,
            analyses_remaining=subscription.analyses_remaining,
            reset_date=subscription.current_period_end
        ),
        current_period_start=subscription.current_period_start,
        current_period_end=subscription.current_period_end,
        cancel_at_period_end=subscription.cancel_at_period_end
    )


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    request: CheckoutRequest,
    user_id: CurrentUser,
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo)
):
    """
    Create a Polar.sh checkout session for Pro upgrade.
    """
    try:
        # Check if already Pro
        subscription = await subscription_repo.get_by_user_id(user_id)
        if subscription and subscription.is_pro:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already subscribed to Pro"
            )
        
        # Create checkout session
        checkout_url = await create_checkout_session(
            user_id=user_id,
            success_url=request.success_url or f"{settings.frontend_url}/dashboard?checkout=success",
            cancel_url=request.cancel_url or f"{settings.frontend_url}/pricing?checkout=cancelled"
        )
        
        return CheckoutResponse(checkout_url=checkout_url)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Checkout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )


@router.post("/cancel")
async def cancel_user_subscription(
    user_id: CurrentUser,
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo)
):
    """
    Cancel subscription at end of billing period.
    """
    try:
        subscription = await subscription_repo.get_by_user_id(user_id)
        
        if not subscription or not subscription.is_pro:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active Pro subscription"
            )
        
        # Cancel in Polar.sh
        if subscription.polar_subscription_id:
            await cancel_subscription(subscription.polar_subscription_id)
        
        # Update local record
        await subscription_repo.cancel_subscription(user_id)
        
        return {
            "message": "Subscription will cancel at end of billing period",
            "cancel_at": subscription.current_period_end
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cancel error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )


@router.get("/portal")
async def get_customer_portal(
    user_id: CurrentUser,
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo)
):
    """
    Get Polar.sh customer portal URL for subscription management.
    """
    subscription = await subscription_repo.get_by_user_id(user_id)
    
    if not subscription or not subscription.polar_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No billing history"
        )
    
    # Polar.sh customer portal URL
    portal_url = f"https://polar.sh/purchases/subscriptions"
    
    return {"portal_url": portal_url}
