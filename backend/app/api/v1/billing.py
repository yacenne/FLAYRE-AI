"""
Billing endpoints — Razorpay Integration for Flayre.ai
"""

import hmac, hashlib, os
import razorpay
from pydantic import BaseModel, HttpUrl
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user_id, get_subscription_repo
from app.db.repositories import SubscriptionRepository

router = APIRouter()

# Razorpay client — reads from env vars you'll add to Render
rz = razorpay.Client(
    auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET"))
)

PLANS = {
    "pro": 49900,   # ₹499 in paise — change to your price
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

    order = rz.order.create({
        "amount": amount,
        "currency": "INR",
        "receipt": f"flayre_{user_id[:8]}",
        "notes": {"user_id": user_id, "plan": request.plan}
    })

    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": os.getenv("RAZORPAY_KEY_ID"),
    }


# ── POST /billing/verify ──────────────────────────────────
@router.post("/verify")
async def verify_payment(
    request: VerifyRequest,
    user_id: str = Depends(get_current_user_id),
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo),
):
    # Verify Razorpay signature
    body = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
    expected = hmac.new(
        os.getenv("RAZORPAY_KEY_SECRET", "").encode(),
        body.encode(),
        hashlib.sha256
    ).hexdigest()

    if expected != request.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Upgrade user to pro in Supabase via your existing repo
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

    # Return order info instead of redirect
    order = rz.order.create({
        "amount": PLANS["pro"],
        "currency": "INR",
        "receipt": f"flayre_{user_id[:8]}",
        "notes": {"user_id": user_id, "plan": request.plan}
    })

    return {
        "status": "razorpay",
        "order_id": order["id"],
        "amount": order["amount"],
        "key_id": os.getenv("RAZORPAY_KEY_ID"),
    }
