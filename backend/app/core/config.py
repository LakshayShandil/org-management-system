# backend/app/core/config.py
import os
from typing import List
from pydantic_settings import BaseSettings

def _parse_origins(value: str | None) -> List[str]:

    if not value:
        return []
    # split on comma and strip whitespace, ignore empty items
    parts = [p.strip() for p in value.split(",")]
    return [p for p in parts if p]

class Settings(BaseSettings):
    # Mongo
    mongodb_uri: str
    mongodb_name: str

    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Superadmin demo credentials (optional; set in .env for local demo)
    superadmin_username: str | None = None
    superadmin_password: str | None = None

    # Raw allowed origins string from env (comma-separated)
    allowed_origins_raw: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def allowed_origins(self) -> List[str]:
        parsed = _parse_origins(self.allowed_origins_raw or os.getenv("ALLOWED_ORIGINS"))
        # If none provided, default to wildcard for dev; override in production
        return parsed if parsed else ["*"]

settings = Settings()
