"""
API Dependencies

FastAPI dependency injection for database clients, repositories, and authentication.
"""

from typing import Optional, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client

from app.config import settings, get_settings, Settings
from app.db.supabase import get_supabase_client, get_supabase_admin, get_authenticated_client
from app.db.repositories import UserRepository, SubscriptionRepository, ConversationRepository
from app.core.logging import get_logger

logger = get_logger(__name__)

# Security scheme (Bearer token)
security = HTTPBearer(auto_error=False)


# ===========================================
# Settings Dependency
# ===========================================

def get_config() -> Settings:
    """Get application settings."""
    return get_settings()


# ===========================================
# Database Client Dependencies
# ===========================================

def get_db() -> Client:
    """Get Supabase client with anonymous key (respects RLS)."""
    return get_supabase_client()


def get_admin_db() -> Client:
    """Get Supabase admin client with service role key (bypasses RLS)."""
    return get_supabase_admin()


# ===========================================
# Repository Dependencies
# ===========================================

def get_user_repo(db: Client = Depends(get_db)) -> UserRepository:
    """Get user repository instance."""
    return UserRepository(db)


def get_subscription_repo(db: Client = Depends(get_admin_db)) -> SubscriptionRepository:
    """
    Get subscription repository instance with admin client.
    Bypasses RLS for subscription tracking operations.
    """
    return SubscriptionRepository(db)


def get_conversation_repo(db: Client = Depends(get_db)) -> ConversationRepository:
    """Get conversation repository instance."""
    return ConversationRepository(db)


# ===========================================
# Authentication Dependencies
# ===========================================

async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Extract and validate user ID from JWT Bearer token using Supabase Auth.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials

    try:
        admin_client = get_supabase_admin()
        user_response = admin_client.auth.get_user(token)

        if not user_response or not user_response.user:
            logger.warning("[AUTH] Token verification failed - no user returned")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"}
            )

        return user_response.user.id

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AUTH] Token verification error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    Get user ID if authenticated, None otherwise.
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        admin_client = get_supabase_admin()
        user_response = admin_client.auth.get_user(token)
        return user_response.user.id if user_response and user_response.user else None
    except Exception:
        return None


async def get_authenticated_db(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Client:
    """
    Get Supabase client authenticated with user's access token.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

    return get_authenticated_client(credentials.credentials)


# ===========================================
# Subscription Quota Check Dependency
# ===========================================

async def check_usage_limit(
    user_id: str = Depends(get_current_user_id),
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo)
) -> str:
    """
    Check if user has remaining analysis quota.
    Creates default subscription if user doesn't have one yet.
    """
    subscription = await subscription_repo.get_or_create_subscription(user_id)

    if not subscription.can_analyze:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "usage_limit_exceeded",
                "message": "Monthly analysis limit reached",
                "used": subscription.monthly_analyses_used,
                "limit": subscription.monthly_analyses_limit,
                "is_pro": subscription.is_pro
            }
        )

    return user_id


# ===========================================
# Type Aliases for Clean Route Signatures
# ===========================================

CurrentUser = Annotated[str, Depends(get_current_user_id)]
OptionalUser = Annotated[Optional[str], Depends(get_current_user_optional)]
WithUsageCheck = Annotated[str, Depends(check_usage_limit)]
Config = Annotated[Settings, Depends(get_config)]
