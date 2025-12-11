# backend/app/core/auth.py
from datetime import datetime, timedelta
from typing import Any, Optional
from jose import jwt
from app.core.config import settings

ALGORITHM = settings.jwt_algorithm
SECRET = settings.jwt_secret
ACCESS_EXPIRE_MINUTES = settings.access_token_expire_minutes

def create_access_token(subject: str, data: Optional[dict] = None, expires_delta: Optional[timedelta] = None) -> str:
    to_encode: dict[str, Any] = {}
    if data:
        to_encode.update(data)
    to_encode.update({"sub": str(subject)})

    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
    return payload
