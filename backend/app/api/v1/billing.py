"""
Billing endpoints for Flayre.ai
Razorpay Integration for Upgrade to Pro
"""

import hmac
import hashlib
import time
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel
import razorpay

from app.config import settings
from app.api.deps import get_current_user_id, get_subscription_repo
from app.db.repositories import SubscriptionRepository

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Razorpay Client Accessor ─────────────────────────────
def get_razorpay_client() -> razorpay.Client:
    """
    Get configured Razorpay client instance.
    """
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay API credentials are not configured on server."
        )
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


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
    Uses threadpool execution for blocking SDK calls.
    """
    try:
        # Check if already Pro
        subscription = await subscription_repo.get_or_create_subscription(user_id)
        if subscription.is_pro:
            return {
                "already_pro": True,
                "message": "You are already subscribed to the Pro plan!"
            }

        client = get_razorpay_client()
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

        # Run blocking Razorpay SDK order creation in threadpool
        order = await run_in_threadpool(client.order.create, data=order_data)
        logger.info(f"Created Razorpay order {order.get('id')} for user {user_id}")

        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": settings.razorpay_key_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating Razorpay order: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment order"
        ) from e


# ── POST /billing/verify-payment ───────────────────────────
@router.post("/verify-payment")
async def verify_razorpay_payment(
    payload: VerifyPaymentRequest,
    user_id: str = Depends(get_current_user_id),
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    """
    Verify payment signature, fetch order & payment details, check idempotency,
    and upgrade user subscription to Pro.
    """
    try:
        # 1. Idempotency Check: Reject already-recorded payments
        existing_sub = await subscription_repo.get_by_payment_id(payload.razorpay_payment_id)
        if existing_sub and existing_sub.is_pro:
            logger.info(f"Payment {payload.razorpay_payment_id} already processed for user {existing_sub.user_id}")
            return {
                "success": True,
                "message": "Payment was already verified and processed.",
                "subscription": {
                    "plan_type": existing_sub.plan_type,
                    "is_pro": existing_sub.is_pro,
                    "analyses_limit": existing_sub.monthly_analyses_limit,
                }
            }

        # 2. Verify Razorpay HMAC-SHA256 signature
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

        # 3. Fetch Order & Payment from Razorpay API via threadpool
        client = get_razorpay_client()
        order = await run_in_threadpool(client.order.fetch, payload.razorpay_order_id)
        payment = await run_in_threadpool(client.payment.fetch, payload.razorpay_payment_id)

        # 4. Validate Order & Payment metadata
        order_notes = order.get("notes", {})
        order_user_id = order_notes.get("user_id") if isinstance(order_notes, dict) else None

        if not order_user_id or order_user_id != user_id:
            logger.error(f"User ID mismatch: order notes user_id {order_user_id} != auth user_id {user_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment validation failed: user identity mismatch."
            )

        order_amount = order.get("amount")
        if order_amount != settings.razorpay_pro_plan_amount:
            logger.error(f"Order amount mismatch: {order_amount} != {settings.razorpay_pro_plan_amount}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment validation failed: order amount mismatch."
            )

        payment_order_id = payment.get("order_id")
        if payment_order_id != payload.razorpay_order_id:
            logger.error(f"Order ID mismatch: payment order_id {payment_order_id} != {payload.razorpay_order_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment validation failed: order association mismatch."
            )

        payment_status = payment.get("status")
        if payment_status not in ["captured", "authorized"]:
            logger.error(f"Payment status invalid: {payment_status}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment status is {payment_status}, not captured."
            )

        payment_amount = payment.get("amount")
        if payment_amount != settings.razorpay_pro_plan_amount:
            logger.error(f"Payment amount mismatch: {payment_amount} != {settings.razorpay_pro_plan_amount}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment validation failed: amount mismatch."
            )

        customer_id = payment.get("customer_id")

        # 5. Execute upgrade in database
        updated_subscription = await subscription_repo.upgrade_to_pro(
            user_id=user_id,
            payment_id=payload.razorpay_payment_id,
            order_id=payload.razorpay_order_id,
            customer_id=customer_id,
        )

        logger.info(
            f"Successfully verified and upgraded user {user_id} to Pro via payment {payload.razorpay_payment_id}"
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
            detail="Payment verification failed"
        ) from e


# ── POST /billing/webhook/razorpay ───────────────────────
@router.post("/webhook/razorpay")
async def razorpay_webhook(
    request: Request,
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    """
    Webhook handler for Razorpay payment events.
    Verifies X-Razorpay-Signature and processes payment events reliably.
    """
    try:
        signature = request.headers.get("X-Razorpay-Signature")
        if not signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing X-Razorpay-Signature header."
            )

        body_bytes = await request.body()
        webhook_secret = settings.razorpay_webhook_secret or settings.razorpay_key_secret

        if not webhook_secret:
            logger.error("Razorpay webhook secret is not configured.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server webhook configuration missing."
            )

        expected_sig = hmac.new(
            webhook_secret.encode("utf-8"),
            body_bytes,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, signature):
            logger.warning("Invalid Razorpay webhook signature received.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature."
            )

        event_data = await request.json()
        event_type = event_data.get("event")

        if event_type in ["order.paid", "payment.captured"]:
            payment_entity = event_data.get("payload", {}).get("payment", {}).get("entity", {})
            notes = payment_entity.get("notes", {})
            user_id = notes.get("user_id") if isinstance(notes, dict) else None
            payment_id = payment_entity.get("id")
            order_id = payment_entity.get("order_id")
            customer_id = payment_entity.get("customer_id")

            if user_id:
                await subscription_repo.upgrade_to_pro(
                    user_id=user_id,
                    payment_id=payment_id,
                    order_id=order_id,
                    customer_id=customer_id,
                )
                logger.info(f"Upgraded user {user_id} via Razorpay Webhook: {event_type}")

        return {"status": "ok"}

    except HTTPException:
        # Re-raise HTTP exceptions unchanged (e.g. 400 for bad signature)
        raise
    except Exception as e:
        logger.error(f"Error handling Razorpay webhook: {e}", exc_info=True)
        # Return HTTP 500 so Razorpay retries delivery for unexpected errors
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Webhook event processing failed"}
        )
