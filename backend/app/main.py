"""
flayre.ai Backend API

Production-ready FastAPI application with clean, modular architecture.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.v1 import api_router
from app.core.logging import get_logger, setup_logging
from app.core.exceptions import FlayreException

# Initialize logging configuration
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.
    """
    logger.info(f"Starting {settings.app_name} v{settings.app_version} in [{settings.environment}] mode")
    logger.info(f"AI Vision Model: {settings.vision_model} (Ollama: {settings.use_ollama})")
    yield
    logger.info("Shutting down flayre.ai API")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="AI-powered conversation assistant API that analyzes chat screenshots and suggests smart responses.",
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
    allow_origins=settings.allowed_origins,
    allow_origin_regex=r"(https://.*\.vercel\.app|chrome-extension://.*)",
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
    """Handle custom application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unhandled server exceptions."""
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
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
    """Root endpoint returning API status."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs" if settings.debug else None
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring uptime."""
    return {
        "status": "healthy",
        "environment": settings.environment
    }


# ===========================================
# Include API v1 Router
# ===========================================
app.include_router(api_router)
