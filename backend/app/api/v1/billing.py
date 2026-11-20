"""
Billing Endpoints

Razorpay integration for subscription checkouts, order creation, and payment verification.
"""

import hmac
import hashlib
from typing import Optional

import razorpay
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from app.config import settings
from app.api.deps import CurrentUser, get_subscription_repo
from app.db.repositories import SubscriptionRepository
from app.models.billing import (
    CheckoutRequest,
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyRequest,
    VerifyResponse,
    SubscriptionStatusResponse,
    SubscriptionUsage,
)
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()

# Global Razorpay client (lazy-loaded)
_razorpay_client: Optional[razorpay.Client] = None


def get_razorpay_client() -> razorpay.Client:
    """
    Get or initialize the Razorpay client singleton.
    Raises HTTPException if API credentials are not configured.
    """
    global _razorpay_client
    if _razorpay_client is None:
        key_id = settings.razorpay_key_id
        key_secret = settings.razorpay_key_secret
        if not key_id or not key_secret:
            logger.warning("Razorpay credentials not configured - billing endpoints will return 503")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment gateway not configured"
            )
        _razorpay_client = razorpay.Client(auth=(key_id, key_secret))
    return _razorpay_client


PLANS = {
    "pro": 49900,  # ₹499 in paise (₹499.00)
}


# ===========================================
# Endpoints
# ===========================================

@router.get("/subscription", response_model=SubscriptionStatusResponse)
async def get_subscription(
    user_id: CurrentUser,
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    """
    Get user's current subscription status and usage limit.
    """
    subscription = await subscription_repo.get_or_create_subscription(user_id)
    return SubscriptionStatusResponse(
        plan_type=subscription.plan_type,
        is_pro=subscription.is_pro,
        usage=SubscriptionUsage(
            analyses_used=subscription.monthly_analyses_used,
            analyses_limit=subscription.monthly_analyses_limit,
            analyses_remaining=subscription.analyses_remaining,
        ),
    )


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(
    user_id: CurrentUser,
    request: Optional[CreateOrderRequest] = None,
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    """
    Create a new Razorpay order for subscription upgrade.
    """
    subscription = await subscription_repo.get_or_create_subscription(user_id)
    if subscription.is_pro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already on Pro plan"
        )

    plan = request.plan if request else "pro"
    amount = PLANS.get(plan)
    if not amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan selected"
        )

    client = get_razorpay_client()
    try:
        order = await run_in_threadpool(
            lambda: client.order.create({
                "amount": amount,
                "currency": "INR",
                "receipt": f"flayre_{user_id[:8]}",
                "payment_capture": 1,
                "notes": {"user_id": user_id, "plan": plan}
            })
        )
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Payment gateway error: {str(e)}"
        )

    return CreateOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        key_id=settings.razorpay_key_id,
    )


@router.post("/verify", response_model=VerifyResponse)
async def verify_payment(
    request: VerifyRequest,
    user_id: CurrentUser,
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    """
    Verify signature and status of a completed Razorpay payment, then upgrade user.
    """
    # Idempotency check
    existing_sub = await subscription_repo.get_by_payment_id(request.razorpay_payment_id)
    if existing_sub:
        if existing_sub.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Payment already registered to another account"
            )
        return VerifyResponse(
            success=True,
            plan=existing_sub.plan_type,
            note="Payment already processed"
        )

    client = get_razorpay_client()

    # Verify signature
    body = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
    expected = hmac.new(
        settings.razorpay_key_secret.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, request.razorpay_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature"
        )

    # Fetch payment from gateway to confirm status
    try:
        payment = await run_in_threadpool(
            lambda: client.payment.fetch(request.razorpay_payment_id)
        )
    except Exception as e:
        logger.error(f"Razorpay fetch payment failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Payment gateway error: {str(e)}"
        )

    expected_amount = PLANS.get(request.plan)

    # Auto-capture if authorized
    if payment.get("status") == "authorized":
        try:
            payment = await run_in_threadpool(
                lambda: client.payment.capture(request.razorpay_payment_id, expected_amount)
            )
        except Exception as e:
            logger.error(f"Razorpay auto-capture failed: {e}")

    if payment.get("status") != "captured":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment has not been captured"
        )

    if payment.get("amount") != expected_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount mismatch"
        )

    notes = payment.get("notes") or {}
    payment_user_id = notes.get("user_id")
    if not payment_user_id:
        try:
            order_data = await run_in_threadpool(
                lambda: client.order.fetch(request.razorpay_order_id)
            )
            payment_user_id = (order_data.get("notes") or {}).get("user_id")
        except Exception:
            pass

    if payment_user_id and payment_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payment belongs to another user"
        )

    # Upgrade user to Pro
    await subscription_repo.upgrade_to_pro(user_id, request.razorpay_payment_id)
    return VerifyResponse(success=True, plan=request.plan)


@router.post("/checkout")
async def create_checkout_session(
    request: CheckoutRequest,
    user_id: CurrentUser,
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    """
    Legacy checkout endpoint for backward compatibility.
    """
    subscription = await subscription_repo.get_or_create_subscription(user_id)
    if subscription.is_pro:
        return {"checkout_url": str(request.success_url), "status": "already_pro"}

    amount = PLANS.get(request.plan, PLANS["pro"])
    client = get_razorpay_client()
    try:
        order = await run_in_threadpool(
            lambda: client.order.create({
                "amount": amount,
                "currency": "INR",
                "receipt": f"flayre_{user_id[:8]}",
                "notes": {"user_id": user_id, "plan": request.plan}
            })
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Payment gateway error: {str(e)}"
        )

    return {
        "status": "razorpay",
        "order_id": order["id"],
        "amount": order["amount"],
        "key_id": settings.razorpay_key_id,
    }
