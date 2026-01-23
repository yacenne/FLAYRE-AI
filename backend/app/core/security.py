"""
Core Security Module

JWT token management, password hashing, and authentication utilities.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import hashlib

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = settings.supabase_service_key  # Use service key as secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password for storage."""
    return pwd_context.hash(password)


def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload to encode in the token
        expires_delta: Custom expiration time
    
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
        Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def hash_ip(ip_address: str) -> str:
    """
    Hash an IP address for privacy-preserving storage.
    
    Used for usage tracking without storing actual IPs.
    """
    return hashlib.sha256(ip_address.encode()).hexdigest()[:16]


def extract_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from a Supabase JWT token.
    
    Args:
        token: Supabase access token
    
    Returns:
        User ID string or None if invalid
    """
    payload = decode_access_token(token)
    if payload:
        return payload.get("sub")
    return None
