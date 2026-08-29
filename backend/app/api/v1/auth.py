"""
Authentication Endpoints

User registration, authentication, session refresh, and profile management.
"""

from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.api.deps import (
    get_db,
    get_admin_db,
    get_user_repo,
    CurrentUser
)
from app.db.repositories import UserRepository
from app.models.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    AuthResponse,
    ProfileUpdate
)
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


class RefreshTokenRequest(BaseModel):
    """Request schema for token refresh."""
    refresh_token: str


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    db: Client = Depends(get_admin_db)
):
    """
    Register a new user in Supabase Auth.
    """
    try:
        auth_response = db.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name
                }
            }
        })

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )

        user = auth_response.user
        session = auth_response.session

        return AuthResponse(
            access_token=session.access_token if session else "",
            refresh_token=session.refresh_token if session else None,
            token_type="bearer",
            expires_in=session.expires_in if session else 3600,
            user=UserResponse(
                id=user.id,
                email=user.email or user_data.email,
                full_name=user_data.full_name
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: UserLogin,
    db: Client = Depends(get_db)
):
    """
    Authenticate user with email and password, returning an access token.
    """
    try:
        auth_response = db.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })

        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        user = auth_response.user
        session = auth_response.session

        return AuthResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            token_type="bearer",
            expires_in=session.expires_in,
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.user_metadata.get("full_name") if user.user_metadata else None
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(
    body: RefreshTokenRequest,
    db: Client = Depends(get_db)
):
    """
    Refresh an expired access token using a valid refresh token.
    """
    try:
        auth_response = db.auth.refresh_session(body.refresh_token)

        if not auth_response.session or not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        session = auth_response.session
        user = auth_response.user

        return AuthResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            token_type="bearer",
            expires_in=session.expires_in,
            user=UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.user_metadata.get("full_name") if user.user_metadata else None
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh session"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: CurrentUser,
    user_repo: UserRepository = Depends(get_user_repo)
):
    """
    Get the authenticated user's profile details.
    """
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        created_at=user.created_at
    )


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    user_id: CurrentUser,
    user_repo: UserRepository = Depends(get_user_repo)
):
    """
    Update the authenticated user's profile information.
    """
    user = await user_repo.update_profile(
        user_id=user_id,
        full_name=profile_data.full_name,
        avatar_url=profile_data.avatar_url
    )

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        created_at=user.created_at
    )


@router.post("/logout")
async def logout(
    user_id: CurrentUser,
    db: Client = Depends(get_db)
):
    """
    Sign out the authenticated user.
    """
    try:
        db.auth.sign_out()
        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {"message": "Logged out"}
