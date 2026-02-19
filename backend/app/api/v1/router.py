"""
API v1 Router

Aggregates all v1 API routes.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.analyze import router as analyze_router
from app.api.v1.conversations import router as conversations_router

api_router = APIRouter(prefix="/api/v1")

# Include all routers
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(analyze_router, prefix="/analyze", tags=["Analysis"])
api_router.include_router(conversations_router, prefix="/conversations", tags=["Conversations"])
