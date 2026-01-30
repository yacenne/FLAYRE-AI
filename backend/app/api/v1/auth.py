"""
Authentication Endpoints

User registration, login, and profile management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.api.deps import (
    get_db,
    get_admin_db,
    get_user_repo,
    get_subscription_repo,
    CurrentUser
)
from app.db.repositories import UserRepository, SubscriptionRepository
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


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    db: Client = Depends(get_admin_db)
):
    """
    Register a new user.
    
    Creates user in Supabase Auth and initializes profile + subscription.
    """
    try:
        # Create user in Supabase Auth
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
                detail="Failed to create user"
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
                email=user.email,
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


@router.post("/test-token")
async def test_token(
    token: str,
    db: Client = Depends(get_admin_db)
):
    """
    Debug endpoint to test token verification.
    """
    result = {"token_preview": token[:50] + "..." if len(token) > 50 else token}
    
    # Test 1: Try Supabase auth.get_user()
    try:
        user_response = db.auth.get_user(token)
        if user_response and user_response.user:
            result["supabase_get_user"] = {
                "success": True,
                "user_id": user_response.user.id,
                "email": user_response.user.email
            }
        else:
            result["supabase_get_user"] = {"success": False, "error": "No user returned"}
    except Exception as e:
        result["supabase_get_user"] = {"success": False, "error": str(e)}
    
    # Test 2: Try manual JWT decode
    from app.core.security import decode_access_token
    try:
        payload = decode_access_token(token)
        if payload:
            result["jwt_decode"] = {
                "success": True,
                "sub": payload.get("sub"),
                "exp": payload.get("exp"),
                "iss": payload.get("iss")
            }
        else:
            result["jwt_decode"] = {"success": False, "error": "Decode returned None"}
    except Exception as e:
        result["jwt_decode"] = {"success": False, "error": str(e)}
    
    return result

@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: UserLogin,
    db: Client = Depends(get_db)
):
    """
    Authenticate user and return access token.
    """
    try:
        auth_response = db.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
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
                full_name=user.user_metadata.get("full_name")
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )


@router.post("/refresh")
async def refresh_token(
    request: dict,
    db: Client = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    
    Expected request body: {"refresh_token": "..."}
    """
    try:
        refresh_token_value = request.get("refresh_token")
        
        if not refresh_token_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="refresh_token is required"
            )
        
        auth_response = db.auth.refresh_session(refresh_token_value)
        
        if not auth_response.session or not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        session = auth_response.session
        user = auth_response.user
        
        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "token_type": "bearer",
            "expires_in": session.expires_in,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.user_metadata.get("full_name")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh token"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: CurrentUser,
    user_repo: UserRepository = Depends(get_user_repo)
):
    """
    Get current user profile.
    """
    user = await user_repo.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
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
    Update current user profile.
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
    Sign out user (invalidate session).
    """
    try:
        db.auth.sign_out()
        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {"message": "Logged out"}
