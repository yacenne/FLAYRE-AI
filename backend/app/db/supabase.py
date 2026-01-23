"""
Supabase Client Module

Provides singleton Supabase clients for database and auth operations.
"""

from functools import lru_cache
from supabase import create_client, Client

from app.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


@lru_cache
def get_supabase_client() -> Client:
    """
    Get the Supabase client with anon key.
    
    Used for operations that respect RLS policies.
    Cached as singleton.
    
    Returns:
        Supabase client instance
    """
    logger.debug("Creating Supabase client (anon key)")
    return create_client(
        settings.supabase_url,
        settings.supabase_key
    )


@lru_cache
def get_supabase_admin() -> Client:
    """
    Get the Supabase client with service role key.
    
    Used for admin operations that bypass RLS.
    Use with caution - only for webhooks and system operations.
    
    Returns:
        Supabase admin client instance
    """
    logger.debug("Creating Supabase admin client (service key)")
    return create_client(
        settings.supabase_url,
        settings.supabase_service_key
    )


def get_authenticated_client(access_token: str) -> Client:
    """
    Get a Supabase client authenticated with user's access token.
    
    Used for operations that should run as the authenticated user,
    respecting RLS policies.
    
    Args:
        access_token: User's JWT access token
    
    Returns:
        Authenticated Supabase client
    """
    client = create_client(
        settings.supabase_url,
        settings.supabase_key
    )
    # Set the auth header for RLS
    client.postgrest.auth(access_token)
    return client
