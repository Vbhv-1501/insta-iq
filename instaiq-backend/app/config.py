from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App
    APP_NAME: str = "InstaIQ API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost/instaiq"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # Redis / Upstash
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_MAX_CONNECTIONS: int = 20

    # Auth
    JWT_SECRET_KEY: str = "change-this-to-a-very-long-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Instagram dummy account (for instaloader)
    INSTAGRAM_USERNAME: str = ""
    INSTAGRAM_PASSWORD: str = ""

    # Scraper limits
    SCRAPE_DELAY_MS: int = 1200
    MAX_FOLLOWERS_FREE: int = 200
    MAX_FOLLOWERS_PRO: int = 1000

    # Rate limits
    FREE_ANALYSES_PER_DAY: int = 3
    PRO_ANALYSES_PER_DAY: int = 9999

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://instaiq.vercel.app",
    ]

    # Cloudinary
    CLOUDINARY_URL: str = ""

    # Sentry
    SENTRY_DSN: Optional[str] = None

    @field_validator("DATABASE_URL")
    @classmethod
    def fix_database_url(cls, v: str) -> str:
        """
        Supabase and most providers give postgresql:// or postgres://
        SQLAlchemy async requires postgresql+asyncpg://
        This auto-converts whatever format is provided.
        """
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        # already correct if it starts with postgresql+asyncpg://
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()