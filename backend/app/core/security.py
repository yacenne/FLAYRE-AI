"""
Core Security Module

JWT token management, password hashing, and authentication utilities.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Union
import hashlib
import base64

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def get_jwt_secret() -> Union[str, bytes]:
    """
    Get the JWT secret key.
    
    If the secret is base64-encoded (standard Supabase JWT secret format),
    it is decoded to raw bytes for HMAC verification.
    """
    secret = settings.supabase_jwt_secret or settings.supabase_service_key
    if not secret:
        return ""

    # Check if the secret is base64-encoded
    if "==" in secret or secret.endswith("="):
        try:
            return base64.b64decode(secret)
        except Exception:
            return secret

    return secret


SECRET_KEY = get_jwt_secret()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password for secure storage."""
    return pwd_context.hash(password)


def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a signed JWT access token.
    
    Args:
        data: Payload dict to encode
        expires_delta: Optional expiration duration
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode and validate a JWT access token.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded payload dict or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={
                "verify_aud": False,  # Skip audience verification for Supabase tokens
                "verify_iss": False,  # Skip issuer verification
            }
        )
        return payload
    except JWTError as e:
        logger.debug(f"JWT decode error: {type(e).__name__}: {e}")
        return None


def hash_ip(ip_address: str) -> str:
    """
    Hash an IP address for privacy-preserving rate limiting or logging.
    """
    return hashlib.sha256(ip_address.encode("utf-8")).hexdigest()[:16]


def extract_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID (sub claim) from a Supabase JWT token.
    
    Args:
        token: Supabase access token
    
    Returns:
        User ID string or None if invalid
    """
    payload = decode_access_token(token)
    if payload:
        return payload.get("sub")
    return None
