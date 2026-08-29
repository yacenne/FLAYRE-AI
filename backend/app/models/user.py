"""
User Models

Pydantic schemas for user authentication and profile management.
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Request schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)


class UserLogin(BaseModel):
    """Request schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Response schema for user profile data."""
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    """Request schema for profile updates."""
    full_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None


class AuthResponse(BaseModel):
    """Response schema for authentication operations."""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class TokenPayload(BaseModel):
    """JWT token payload structure."""
    sub: str  # User ID
    email: Optional[str] = None
    exp: Optional[datetime] = None
