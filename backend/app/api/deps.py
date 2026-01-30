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


def get_subscription_repo(db: Client = Depends(get_admin_db)) -> SubscriptionRepository:
    """
    Get subscription repository instance with admin client.
    
    Uses admin client to bypass RLS for subscription creation/updates,
    which is safe since endpoints are already protected by authentication.
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
    Extract and validate user ID from JWT token using Supabase.
    
    Uses Supabase client to verify the token - this is the recommended approach
    as Supabase handles all JWT validation internally.
    
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
    
    try:
        # Use Supabase service client to verify the token
        admin_client = get_supabase_admin()
        user_response = admin_client.auth.get_user(token)
        
        if not user_response or not user_response.user:
            logger.warning("[AUTH] Token verification failed - no user returned")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        user_id = user_response.user.id
        logger.info(f"[AUTH] User verified: {user_id}")
        return user_id
        
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
    
    Use for endpoints that work with or without auth.
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
    Creates a default subscription if one doesn't exist.
    
    Raises:
        HTTPException: If usage limit exceeded
    
    Returns:
        User ID (for chaining dependencies)
    """
    # This will create a free subscription if the user doesn't have one
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
# Type Aliases for Cleaner Routes
# ===========================================

CurrentUser = Annotated[str, Depends(get_current_user_id)]
OptionalUser = Annotated[Optional[str], Depends(get_current_user_optional)]
WithUsageCheck = Annotated[str, Depends(check_usage_limit)]
Config = Annotated[Settings, Depends(get_config)]
