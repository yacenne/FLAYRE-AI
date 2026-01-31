"""
flayre.ai Backend Configuration

Centralized settings management using Pydantic.
All configuration is loaded from environment variables.
"""

from functools import lru_cache
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # ===========================================
    # App Configuration
    # ===========================================
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    app_name: str = "flayre.ai API"
    app_version: str = "2.0.0"
    frontend_url: str = "http://localhost:3000"
    
    # ===========================================
    # OpenRouter AI
    # ===========================================
    openrouter_api_key: str
    primary_model: str = "moonshotai/kimi-k2:free"
    fast_model: str = "tngtech/deepseek-r1t2-chimera:free"
    vision_model: str = "bytedance-seed/seed-1.6-flash"
    
    # ===========================================
    # Supabase
    # ===========================================
    supabase_url: str
    supabase_key: str  # anon key
    supabase_service_key: str  # service role key
    supabase_jwt_secret: str = ""  # JWT secret from Supabase dashboard (Settings > API)
    
    # ===========================================
    # Polar.sh Payments
    # ===========================================
    polar_access_token: str = ""
    polar_organization_id: str = ""
    polar_product_id: str = ""
    polar_webhook_secret: str = ""
    
    # ===========================================
    # Error Tracking
    # ===========================================
    sentry_dsn: str = ""
    
    # ===========================================
    # Feature Flags
    # ===========================================
    enable_visual_suggestions: bool = True
    
    # ===========================================
    # Rate Limiting
    # ===========================================
    free_tier_monthly_limit: int = 10
    pro_tier_monthly_limit: int = 999999  # Effectively unlimited
    
    # ===========================================
    # Computed Properties
    # ===========================================
    @property
    def is_production(self) -> bool:
        return self.environment == "production"
    
    @property
    def allowed_origins(self) -> list[str]:
        """CORS allowed origins based on environment."""
        origins = [
            self.frontend_url,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        if not self.is_production:
            origins.extend([
                "http://localhost:3001",
                "http://localhost:5173",
            ])
        return origins


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings instance.
    
    Use dependency injection to access settings:
        settings = Depends(get_settings)
    """
    return Settings()


# Global settings instance for convenience
settings = get_settings()
