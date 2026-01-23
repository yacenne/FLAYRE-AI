"""
Polar.sh Integration

Subscription payments and checkout sessions.
"""

import httpx
from typing import Optional

from app.config import settings
from app.core.logging import get_logger
from app.core.exceptions import PaymentServiceError

logger = get_logger(__name__)

POLAR_API_URL = "https://api.polar.sh/v1"


async def create_checkout_session(
    user_id: str,
    success_url: str,
    cancel_url: str
) -> str:
    """
    Create a Polar.sh checkout session for Pro subscription.
    
    Args:
        user_id: User UUID (for tracking)
        success_url: Redirect URL after successful payment
        cancel_url: Redirect URL if checkout cancelled
    
    Returns:
        Checkout URL to redirect user to
    
    Raises:
        PaymentServiceError: If checkout creation fails
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{POLAR_API_URL}/checkouts/custom",
                headers={
                    "Authorization": f"Bearer {settings.polar_access_token}",
                    "Content-Type": "application/json"
                },
                json={
                    "product_id": settings.polar_product_id,
                    "success_url": success_url,
                    "metadata": {
                        "user_id": user_id
                    }
                }
            )
            
            if response.status_code not in (200, 201):
                logger.error(f"Polar checkout error: {response.status_code} - {response.text}")
                raise PaymentServiceError("Failed to create checkout session")
            
            data = response.json()
            checkout_url = data.get("url")
            
            if not checkout_url:
                raise PaymentServiceError("No checkout URL returned")
            
            logger.info(f"Created checkout session for user {user_id}")
            return checkout_url
            
    except PaymentServiceError:
        raise
    except Exception as e:
        logger.error(f"Polar checkout error: {e}")
        raise PaymentServiceError(f"Payment service error: {str(e)}")


async def cancel_subscription(subscription_id: str) -> bool:
    """
    Cancel a Polar.sh subscription.
    
    Args:
        subscription_id: Polar subscription ID
    
    Returns:
        True if cancelled successfully
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.delete(
                f"{POLAR_API_URL}/subscriptions/{subscription_id}",
                headers={
                    "Authorization": f"Bearer {settings.polar_access_token}"
                }
            )
            
            if response.status_code not in (200, 204):
                logger.error(f"Polar cancel error: {response.status_code}")
                return False
            
            logger.info(f"Cancelled subscription {subscription_id}")
            return True
            
    except Exception as e:
        logger.error(f"Polar cancel error: {e}")
        return False


async def get_subscription_status(subscription_id: str) -> Optional[dict]:
    """
    Get subscription status from Polar.sh.
    
    Args:
        subscription_id: Polar subscription ID
    
    Returns:
        Subscription data dict or None
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{POLAR_API_URL}/subscriptions/{subscription_id}",
                headers={
                    "Authorization": f"Bearer {settings.polar_access_token}"
                }
            )
            
            if response.status_code != 200:
                return None
            
            return response.json()
            
    except Exception as e:
        logger.error(f"Polar status error: {e}")
        return None
