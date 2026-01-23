from supabase import Client
from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict
    expires_at: int

class AuthService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    async def sign_up(self, request: SignUpRequest) -> AuthResponse:
        """Register new user with email/password"""
        try:
            # Sign up with Supabase
            response = self.supabase.auth.sign_up({
                "email": request.email,
                "password": request.password,
                "options": {
                    "data": {
                        "full_name": request.full_name or ""
                    }
                }
            })
            
            if not response.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Registration failed"
                )
            
            return AuthResponse(
                access_token=response.session.access_token,
                refresh_token=response.session.refresh_token,
                user={
                    "id": response.user.id,
                    "email": response.user.email,
                    "full_name": request.full_name
                },
                expires_at=response.session.expires_at
            )
            
        except Exception as e:
            logger.error(f"Sign up error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    async def login(self, request: LoginRequest) -> AuthResponse:
        """Login with email/password"""
        try:
            response = self.supabase.auth.sign_in_with_password({
                "email": request.email,
                "password": request.password
            })
            
            if not response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
            
            return AuthResponse(
                access_token=response.session.access_token,
                refresh_token=response.session.refresh_token,
                user={
                    "id": response.user.id,
                    "email": response.user.email,
                    "full_name": response.user.user_metadata.get("full_name")
                },
                expires_at=response.session.expires_at
            )
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
    
    async def magic_link(self, email: str) -> dict:
        """Send magic link for passwordless login"""
        try:
            response = self.supabase.auth.sign_in_with_otp({
                "email": email,
                "options": {
                    "email_redirect_to": "http://localhost:3000/auth/callback"
                }
            })
            
            return {"message": "Magic link sent! Check your email."}
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    async def refresh_token(self, refresh_token: str) -> AuthResponse:
        """Refresh access token"""
        try:
            response = self.supabase.auth.refresh_session(refresh_token)
            
            return AuthResponse(
                access_token=response.session.access_token,
                refresh_token=response.session.refresh_token,
                user={
                    "id": response.user.id,
                    "email": response.user.email
                },
                expires_at=response.session.expires_at
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    
    async def logout(self, access_token: str):
        """Logout user"""
        try:
            self.supabase.auth.sign_out()
            return {"message": "Logged out successfully"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    async def get_user(self, access_token: str):
        """Get current user from token"""
        try:
            response = self.supabase.auth.get_user(access_token)
            
            if not response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            
            return response.user
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e)
            )
