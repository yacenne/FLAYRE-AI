"""
Billing endpoints — Razorpay Integration for Flayre.ai
"""

import hmac, hashlib, os
import razorpay
from pydantic import BaseModel, HttpUrl
from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool

from app.api.deps import get_current_user_id, get_subscription_repo
from app.db.repositories import SubscriptionRepository

router = APIRouter()

RZP_KEY = os.getenv("RAZORPAY_KEY_ID", "")
RZP_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

if not RZP_KEY or not RZP_SECRET:
    raise RuntimeError("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables must be set")

# Razorpay client
rz = razorpay.Client(auth=(RZP_KEY, RZP_SECRET))

PLANS = {
    "pro": 49900,   # ₹499 in paise
}


# ── Models ────────────────────────────────────────────────
class CheckoutRequest(BaseModel):
    success_url: HttpUrl
    cancel_url: HttpUrl
    plan: str = "pro"

class CreateOrderRequest(BaseModel):
    plan: str = "pro"

class VerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan: str = "pro"


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


# ── POST /billing/create-order ────────────────────────────
@router.post("/create-order")
async def create_order(
    request: CreateOrderRequest,
    user_id: str = Depends(get_current_user_id),
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    subscription = await subscription_repo.get_or_create_subscription(user_id)

    if subscription.is_pro:
        raise HTTPException(status_code=400, detail="User already on Pro plan")

    amount = PLANS.get(request.plan)
    if not amount:
        raise HTTPException(status_code=400, detail="Invalid plan")

    try:
        order = await run_in_threadpool(
            lambda: rz.order.create({
                "amount": amount,
                "currency": "INR",
                "receipt": f"flayre_{user_id[:8]}",
                "notes": {"user_id": user_id, "plan": request.plan}
            })
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Payment gateway error: {str(e)}")

    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": RZP_KEY,
    }


# ── POST /billing/verify ──────────────────────────────────
@router.post("/verify")
async def verify_payment(
    request: VerifyRequest,
    user_id: str = Depends(get_current_user_id),
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    # Idempotency check
    existing_sub = await subscription_repo.get_by_payment_id(request.razorpay_payment_id)
    if existing_sub:
        # Already processed
        return {"success": True, "plan": existing_sub.plan_type, "note": "Already processed"}

    # Verify Razorpay signature
    body = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
    expected = hmac.new(
        RZP_SECRET.encode(),
        body.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, request.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Fetch payment from gateway to verify status and amount
    try:
        payment = await run_in_threadpool(lambda: rz.payment.fetch(request.razorpay_payment_id))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Payment gateway error: {str(e)}")

    if payment.get("status") != "captured":
        raise HTTPException(status_code=400, detail="Payment not captured")

    expected_amount = PLANS.get(request.plan)
    if payment.get("amount") != expected_amount:
        raise HTTPException(status_code=400, detail="Payment amount mismatch")

    # Ensure it's for the right user (from notes set in create_order)
    notes = payment.get("notes", {})
    if notes.get("user_id") and notes.get("user_id") != user_id:
         raise HTTPException(status_code=403, detail="Payment belongs to another user")

    # Upgrade user to pro
    await subscription_repo.upgrade_to_pro(user_id, request.razorpay_payment_id)

    return {"success": True, "plan": request.plan}


# ── POST /billing/checkout (legacy frontend compat) ───────
@router.post("/checkout")
async def create_checkout_session(
    request: CheckoutRequest,
    user_id: str = Depends(get_current_user_id),
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    subscription = await subscription_repo.get_or_create_subscription(user_id)
    if subscription.is_pro:
        return {"checkout_url": str(request.success_url), "status": "already_pro"}

    amount = PLANS.get(request.plan, PLANS["pro"])
    
    try:
        order = await run_in_threadpool(
            lambda: rz.order.create({
                "amount": amount,
                "currency": "INR",
                "receipt": f"flayre_{user_id[:8]}",
                "notes": {"user_id": user_id, "plan": request.plan}
            })
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Payment gateway error: {str(e)}")

    return {
        "status": "razorpay",
        "order_id": order["id"],
        "amount": order["amount"],
        "key_id": RZP_KEY,
    }
