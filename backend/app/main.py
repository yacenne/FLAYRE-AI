"""
flayre.ai Backend API

Production-ready FastAPI application with enterprise-grade architecture.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.v1 import api_router
from app.core.logging import get_logger, setup_logging
from app.core.exceptions import FlayreException

# Initialize logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.
    
    Startup: Initialize resources, log configuration
    Shutdown: Cleanup resources
    """
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"Vision Model: {settings.vision_model}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down flayre.ai API")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="AI-powered conversation assistant that analyzes chat screenshots and suggests smart responses.",
    version=settings.app_version,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)


# ===========================================
# CORS Middleware
# ===========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)


# ===========================================
# Exception Handlers
# ===========================================
@app.exception_handler(FlayreException)
async def flayre_exception_handler(request: Request, exc: FlayreException):
    """Handle custom flayre exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "error_code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred"
        }
    )


# ===========================================
# Health & Root Endpoints
# ===========================================
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint with API info."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs" if settings.debug else None
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "environment": settings.environment
    }


# ===========================================
# Include API Router
# ===========================================
app.include_router(api_router)


# ===========================================
# Legacy Routes (for backwards compatibility)
# ===========================================
# These redirect to the new v1 API structure

@app.get("/api/health", tags=["Legacy"], include_in_schema=False)
async def legacy_health():
    return {"status": "healthy"}
