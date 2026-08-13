"""
Billing endpoints for Flayre.ai
Razorpay Integration for Upgrade to Pro
"""

import hmac
import hashlib
import time
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
import razorpay

from app.config import settings
from app.api.deps import get_current_user_id, get_subscription_repo
from app.db.repositories import SubscriptionRepository

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Schemas ──────────────────────────────────────────────
class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ── GET /billing/subscription ─────────────────────────────
@router.get("/subscription")
async def get_subscription(
    user_id: str = Depends(get_current_user_id),
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
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


# ── POST /billing/create-order ─────────────────────────────
@router.post("/create-order")
async def create_razorpay_order(
    user_id: str = Depends(get_current_user_id),
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    """
    Create a Razorpay order for upgrading to Pro tier.
    """
    try:
        # Check if already Pro
        subscription = await subscription_repo.get_or_create_subscription(user_id)
        if subscription.is_pro:
            return {
                "already_pro": True,
                "message": "You are already subscribed to the Pro plan!"
            }

        client = razorpay.Client(
            auth=(settings.razorpay_key_id, settings.razorpay_key_secret)
        )

        receipt = f"rec_{user_id[:8]}_{int(time.time())}"
        order_data = {
            "amount": settings.razorpay_pro_plan_amount,  # Amount in paise (49900 = ₹499)
            "currency": settings.razorpay_currency,
            "receipt": receipt,
            "notes": {
                "user_id": user_id,
                "plan": "pro"
            }
        }

        order = client.order.create(data=order_data)
        logger.info(f"Created Razorpay order {order.get('id')} for user {user_id}")

        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": settings.razorpay_key_id,
        }

    except Exception as e:
        logger.error(f"Error creating Razorpay order: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment order: {str(e)}"
        )


# ── POST /billing/verify-payment ───────────────────────────
@router.post("/verify-payment")
async def verify_razorpay_payment(
    payload: VerifyPaymentRequest,
    user_id: str = Depends(get_current_user_id),
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    """
    Verify payment signature and upgrade user subscription to Pro.
    """
    try:
        # Verify Razorpay signature using HMAC-SHA256
        data_to_hash = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
        expected_signature = hmac.new(
            settings.razorpay_key_secret.encode("utf-8"),
            data_to_hash.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, payload.razorpay_signature):
            logger.warning(
                f"Razorpay signature mismatch for order {payload.razorpay_order_id}, user {user_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment signature verification failed."
            )

        # Signature is valid -> Upgrade user to Pro plan
        updated_subscription = await subscription_repo.upgrade_to_pro(
            user_id=user_id,
            payment_id=payload.razorpay_payment_id,
            order_id=payload.razorpay_order_id
        )

        logger.info(
            f"Successfully upgraded user {user_id} to Pro plan via payment {payload.razorpay_payment_id}"
        )

        return {
            "success": True,
            "message": "Payment verified successfully! Welcome to Pro plan.",
            "subscription": {
                "plan_type": updated_subscription.plan_type,
                "is_pro": updated_subscription.is_pro,
                "analyses_limit": updated_subscription.monthly_analyses_limit,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(e)}"
        )


# ── POST /billing/webhook/razorpay ───────────────────────
@router.post("/webhook/razorpay")
async def razorpay_webhook(
    request: Request,
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    """
    Webhook handler for Razorpay payment events.
    """
    try:
        body_bytes = await request.body()
        signature = request.headers.get("X-Razorpay-Signature", "")

        if signature and settings.razorpay_key_secret:
            expected_sig = hmac.new(
                settings.razorpay_key_secret.encode("utf-8"),
                body_bytes,
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(expected_sig, signature):
                raise HTTPException(status_code=400, detail="Invalid webhook signature")

        event_data = await request.json()
        event_type = event_data.get("event")

        if event_type in ["order.paid", "payment.captured"]:
            payment_entity = event_data.get("payload", {}).get("payment", {}).get("entity", {})
            notes = payment_entity.get("notes", {})
            user_id = notes.get("user_id")
            payment_id = payment_entity.get("id")
            order_id = payment_entity.get("order_id")

            if user_id:
                await subscription_repo.upgrade_to_pro(
                    user_id=user_id,
                    payment_id=payment_id,
                    order_id=order_id
                )
                logger.info(f"Upgraded user {user_id} via Razorpay Webhook: {event_type}")

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Error handling Razorpay webhook: {e}", exc_info=True)
        return {"status": "error", "detail": str(e)}
