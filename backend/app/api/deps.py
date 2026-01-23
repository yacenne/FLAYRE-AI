"""
API Dependencies

FastAPI dependency injection for authentication, repositories, and services.
"""

from typing import Optional, Annotated
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client

from app.config import settings, get_settings, Settings
from app.db.supabase import get_supabase_client, get_supabase_admin, get_authenticated_client
from app.db.repositories import UserRepository, SubscriptionRepository, ConversationRepository
from app.core.security import decode_access_token
from app.core.exceptions import AuthenticationError, InvalidTokenError
from app.core.logging import get_logger

logger = get_logger(__name__)

# Security scheme
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
    """Get Supabase client (anon key)."""
    return get_supabase_client()


def get_admin_db() -> Client:
    """Get Supabase admin client (service key)."""
    return get_supabase_admin()


# ===========================================
# Repository Dependencies
# ===========================================

def get_user_repo(db: Client = Depends(get_db)) -> UserRepository:
    """Get user repository instance."""
    return UserRepository(db)


def get_subscription_repo(db: Client = Depends(get_db)) -> SubscriptionRepository:
    """Get subscription repository instance."""
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
    Extract and validate user ID from JWT token.
    
    Raises:
        HTTPException: If token is missing or invalid
    
    Returns:
        User ID string
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    return user_id


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    Get user ID if authenticated, None otherwise.
    
    Use for endpoints that work with or without auth.
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        return payload.get("sub") if payload else None
    except Exception:
        return None


async def get_authenticated_db(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Client:
    """
    Get Supabase client authenticated with user's token.
    
    Use for operations that should respect RLS.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    return get_authenticated_client(credentials.credentials)


# ===========================================
# Subscription Check Dependencies
# ===========================================

async def check_usage_limit(
    user_id: str = Depends(get_current_user_id),
    subscription_repo: SubscriptionRepository = Depends(get_subscription_repo)
) -> str:
    """
    Check if user has remaining analysis quota.
    
    Raises:
        HTTPException: If usage limit exceeded
    
    Returns:
        User ID (for chaining dependencies)
    """
    subscription = await subscription_repo.get_by_user_id(user_id)
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Subscription not found"
        )
    
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
# Type Aliases for Cleaner Routes
# ===========================================

CurrentUser = Annotated[str, Depends(get_current_user_id)]
OptionalUser = Annotated[Optional[str], Depends(get_current_user_optional)]
WithUsageCheck = Annotated[str, Depends(check_usage_limit)]
Config = Annotated[Settings, Depends(get_config)]
