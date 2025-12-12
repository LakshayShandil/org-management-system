# backend/app/core/config.py
from pydantic_settings import BaseSettings

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

    class Config:
        env_file = ".env"
        
settings = Settings()
