"""
Application configuration
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl


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

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
