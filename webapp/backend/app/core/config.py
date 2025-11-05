"""
Application configuration
"""

from typing import List
import os
import logging
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # Application
    PROJECT_NAME: str = "Paint by Numbers Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/paintbynumbers"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # CORS
    CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    # File Storage
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "paintbynumbers"
    AWS_REGION: str = "us-east-1"
    USE_S3: bool = False  # Set to True for production
    UPLOAD_DIR: str = "/tmp/uploads"

    # Stripe
    STRIPE_API_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@paintbynumbers.com"
    EMAILS_FROM_NAME: str = "Paint by Numbers"

    # Pricing
    FREE_TEMPLATES_PER_MONTH: int = 3
    BASIC_PLAN_PRICE: float = 9.99
    PRO_PLAN_PRICE: float = 19.99

    # Generation Settings
    MAX_IMAGE_SIZE: int = 4000
    DEFAULT_PALETTE: str = "classic_18"

    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate that SECRET_KEY is not the default value in production"""
        if v == "your-secret-key-change-in-production":
            # Check if we're in production (not in development/testing)
            env = os.getenv('ENVIRONMENT', 'development').lower()
            if env in ['production', 'prod']:
                raise ValueError(
                    "SECRET_KEY must be changed from default value in production! "
                    "Set it in your .env file or environment variables."
                )
            else:
                logger.warning(
                    "Using default SECRET_KEY. This is OK for development but "
                    "MUST be changed for production!"
                )

        # Validate minimum length
        if len(v) < 32:
            logger.warning(
                f"SECRET_KEY is only {len(v)} characters. "
                "Recommended minimum is 32 characters for security."
            )

        return v

    @field_validator('DATABASE_URL')
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate database URL doesn't use default insecure credentials in production"""
        env = os.getenv('ENVIRONMENT', 'development').lower()
        if env in ['production', 'prod'] and 'postgres:postgres@' in v:
            logger.warning(
                "Database appears to use default credentials (postgres:postgres). "
                "This is INSECURE for production!"
            )
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
