"""
Core Module

Central exports for exceptions, logging, and security utilities.
"""

from app.core.exceptions import (
    FlayreException,
    AuthenticationError,
    InvalidTokenError,
    InsufficientPermissionsError,
    SubscriptionRequiredError,
    UsageLimitExceededError,
    ResourceNotFoundError,
    ResourceConflictError,
    ValidationError,
    InvalidImageError,
    AIServiceError,
    PaymentServiceError,
    DatabaseError,
)
from app.core.logging import get_logger, setup_logging
from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    decode_access_token,
    extract_user_id_from_token,
    hash_ip,
)

__all__ = [
    # Exceptions
    "FlayreException",
    "AuthenticationError",
    "InvalidTokenError",
    "InsufficientPermissionsError",
    "SubscriptionRequiredError",
    "UsageLimitExceededError",
    "ResourceNotFoundError",
    "ResourceConflictError",
    "ValidationError",
    "InvalidImageError",
    "AIServiceError",
    "PaymentServiceError",
    "DatabaseError",
    # Logging
    "get_logger",
    "setup_logging",
    # Security
    "verify_password",
    "hash_password",
    "create_access_token",
    "decode_access_token",
    "extract_user_id_from_token",
    "hash_ip",
]
