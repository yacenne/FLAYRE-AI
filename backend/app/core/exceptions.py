"""
Custom Exception Classes

Centralized exception handling for consistent API error responses.
"""

from typing import Any, Optional


class FlayreException(Exception):
    """Base exception for all flayre.ai errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self) -> dict[str, Any]:
        """Convert exception to API response format."""
        return {
            "error": True,
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details
        }


# ===========================================
# Authentication Errors
# ===========================================

class AuthenticationError(FlayreException):
    """User is not authenticated."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_REQUIRED"
        )


class InvalidTokenError(FlayreException):
    """JWT token is invalid or expired."""
    
    def __init__(self, message: str = "Invalid or expired token"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="INVALID_TOKEN"
        )


class InsufficientPermissionsError(FlayreException):
    """User lacks required permissions."""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            status_code=403,
            error_code="INSUFFICIENT_PERMISSIONS"
        )


# ===========================================
# Subscription Errors
# ===========================================

class SubscriptionRequiredError(FlayreException):
    """Feature requires active subscription."""
    
    def __init__(self, message: str = "Pro subscription required"):
        super().__init__(
            message=message,
            status_code=403,
            error_code="SUBSCRIPTION_REQUIRED"
        )


class UsageLimitExceededError(FlayreException):
    """User has exceeded their usage limit."""
    
    def __init__(
        self,
        message: str = "Monthly analysis limit reached",
        used: int = 0,
        limit: int = 10
    ):
        super().__init__(
            message=message,
            status_code=429,
            error_code="USAGE_LIMIT_EXCEEDED",
            details={"used": used, "limit": limit}
        )


# ===========================================
# Resource Errors
# ===========================================

class ResourceNotFoundError(FlayreException):
    """Requested resource does not exist."""
    
    def __init__(
        self,
        resource_type: str = "Resource",
        resource_id: str = ""
    ):
        super().__init__(
            message=f"{resource_type} not found",
            status_code=404,
            error_code="RESOURCE_NOT_FOUND",
            details={"resource_type": resource_type, "resource_id": resource_id}
        )


class ResourceConflictError(FlayreException):
    """Resource already exists or conflicts with existing data."""
    
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(
            message=message,
            status_code=409,
            error_code="RESOURCE_CONFLICT"
        )


# ===========================================
# Validation Errors
# ===========================================

class ValidationError(FlayreException):
    """Input validation failed."""
    
    def __init__(
        self,
        message: str = "Validation error",
        errors: Optional[list[dict[str, Any]]] = None
    ):
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details={"errors": errors or []}
        )


class InvalidImageError(FlayreException):
    """Image data is invalid or corrupted."""
    
    def __init__(self, message: str = "Invalid image data"):
        super().__init__(
            message=message,
            status_code=400,
            error_code="INVALID_IMAGE"
        )


# ===========================================
# External Service Errors
# ===========================================

class AIServiceError(FlayreException):
    """Error from AI/Vision API."""
    
    def __init__(self, message: str = "AI service unavailable"):
        super().__init__(
            message=message,
            status_code=503,
            error_code="AI_SERVICE_ERROR"
        )


class PaymentServiceError(FlayreException):
    """Error from payment provider (Polar.sh)."""
    
    def __init__(self, message: str = "Payment service error"):
        super().__init__(
            message=message,
            status_code=503,
            error_code="PAYMENT_SERVICE_ERROR"
        )


class DatabaseError(FlayreException):
    """Database operation failed."""
    
    def __init__(self, message: str = "Database error"):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR"
        )
