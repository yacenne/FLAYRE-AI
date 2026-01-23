"""
Webhook Endpoints

Polar.sh webhook handlers for subscription events.
"""

import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException, status, Header, Depends
from datetime import datetime

from app.api.deps import get_admin_db
from app.db.supabase import get_supabase_admin
from app.db.repositories import SubscriptionRepository, UserRepository
from app.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


def verify_polar_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verify Polar.sh webhook signature.
    """
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected}", signature)


@router.post("/polar")
async def polar_webhook(
    request: Request,
    x_polar_signature: str = Header(None, alias="X-Polar-Signature")
):
    """
    Handle Polar.sh subscription webhooks.
    
    Events handled:
    - subscription.created: User subscribed to Pro
    - subscription.updated: Subscription updated
    - subscription.cancelled: User cancelled subscription
    - subscription.revoked: Subscription immediately cancelled
    """
    # Get raw body
    body = await request.body()
    
    # Verify signature
    if settings.polar_webhook_secret and x_polar_signature:
        if not verify_polar_signature(body, x_polar_signature, settings.polar_webhook_secret):
            logger.warning("Invalid webhook signature")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature"
            )
    
    # Parse event
    try:
        event = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON"
        )
    
    event_type = event.get("type")
    data = event.get("data", {})
    
    logger.info(f"Received Polar webhook: {event_type}")
    
    # Get admin client for bypassing RLS
    admin_client = get_supabase_admin()
    subscription_repo = SubscriptionRepository(admin_client)
    user_repo = UserRepository(admin_client)
    
    try:
        if event_type == "subscription.created":
            await handle_subscription_created(data, subscription_repo, user_repo)
        
        elif event_type == "subscription.updated":
            await handle_subscription_updated(data, subscription_repo)
        
        elif event_type == "subscription.cancelled":
            await handle_subscription_cancelled(data, subscription_repo)
        
        elif event_type == "subscription.revoked":
            await handle_subscription_revoked(data, subscription_repo)
        
        else:
            logger.info(f"Unhandled event type: {event_type}")
    
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        # Return 200 to prevent retries, but log the error
    
    return {"received": True}


async def handle_subscription_created(
    data: dict,
    subscription_repo: SubscriptionRepository,
    user_repo: UserRepository
):
    """
    Handle new subscription created.
    """
    customer_email = data.get("customer", {}).get("email")
    subscription_id = data.get("id")
    customer_id = data.get("customer_id")
    
    if not customer_email:
        logger.error("No customer email in subscription.created")
        return
    
    # Find user by email
    user = await user_repo.get_by_email(customer_email)
    if not user:
        logger.error(f"User not found for email: {customer_email}")
        return
    
    # Parse period dates
    period_start = datetime.fromisoformat(
        data.get("current_period_start", "").replace("Z", "+00:00")
    )
    period_end = datetime.fromisoformat(
        data.get("current_period_end", "").replace("Z", "+00:00")
    )
    
    # Upgrade to Pro
    await subscription_repo.upgrade_to_pro(
        user_id=user.id,
        polar_subscription_id=subscription_id,
        polar_customer_id=customer_id,
        period_start=period_start,
        period_end=period_end
    )
    
    logger.info(f"Upgraded user {user.id} to Pro")


async def handle_subscription_updated(
    data: dict,
    subscription_repo: SubscriptionRepository
):
    """
    Handle subscription update (renewal, plan change).
    """
    subscription_id = data.get("id")
    
    subscription = await subscription_repo.get_by_polar_subscription(subscription_id)
    if not subscription:
        logger.warning(f"Subscription not found: {subscription_id}")
        return
    
    # Update period dates
    period_start = datetime.fromisoformat(
        data.get("current_period_start", "").replace("Z", "+00:00")
    )
    period_end = datetime.fromisoformat(
        data.get("current_period_end", "").replace("Z", "+00:00")
    )
    
    await subscription_repo.update(subscription.id, {
        "current_period_start": period_start.isoformat(),
        "current_period_end": period_end.isoformat(),
        "status": "active"
    })
    
    logger.info(f"Updated subscription {subscription_id}")


async def handle_subscription_cancelled(
    data: dict,
    subscription_repo: SubscriptionRepository
):
    """
    Handle subscription cancellation (at period end).
    """
    subscription_id = data.get("id")
    
    subscription = await subscription_repo.get_by_polar_subscription(subscription_id)
    if not subscription:
        return
    
    await subscription_repo.cancel_subscription(subscription.user_id)
    
    logger.info(f"Cancelled subscription {subscription_id}")


async def handle_subscription_revoked(
    data: dict,
    subscription_repo: SubscriptionRepository
):
    """
    Handle immediate subscription revocation.
    """
    subscription_id = data.get("id")
    
    subscription = await subscription_repo.get_by_polar_subscription(subscription_id)
    if not subscription:
        return
    
    # Immediately downgrade to free
    await subscription_repo.downgrade_to_free(subscription.user_id)
    
    logger.info(f"Revoked subscription {subscription_id}")
