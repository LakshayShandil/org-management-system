# backend/app/main.py

import os
import json
from typing import List, Callable

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response

from app.routes import orgs, auth
from app.core.db import connect_to_mongo, close_mongo

app = FastAPI(title="Org Management Backend")

# Detect if running inside CI testing environment
TESTING = os.getenv("TESTING", "0") == "1"

# Rate limiter (optional import)
if not TESTING:
    try:
        from slowapi import Limiter, _rate_limit_exceeded_handler
        from slowapi.util import get_remote_address

        limiter = Limiter(key_func=get_remote_address)
        app.state.limiter = limiter
        app.add_exception_handler(429, _rate_limit_exceeded_handler)
    except Exception:
        limiter = None
else:
    limiter = None


def _parse_allowed_origins(env_value: str) -> List[str]:
    if not env_value:
        return []

    env_value = env_value.strip()
    # direct wildcard
    if env_value == "*" or env_value == '["*"]':
        return ["*"]

    # try parse json
    try:
        parsed = json.loads(env_value)
        if isinstance(parsed, list):
            return [p.strip() for p in parsed if isinstance(p, str) and p.strip()]
    except Exception:
        pass

    # fallback to comma-separated
    parts = [p.strip() for p in env_value.split(",") if p.strip()]
    return parts


# Read allowed origins from env
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = _parse_allowed_origins(ALLOWED_ORIGINS_ENV)


use_wildcard = ("*" in allowed_origins)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=(not use_wildcard),  # if wildcard, disallow credentials
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- DB connect / disconnect ----
@app.on_event("startup")
async def startup_event():
    # Connect to mongodb (existing utility)
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo()

# ---- Routers ----
app.include_router(orgs.router, prefix="/org", tags=["org"])
app.include_router(auth.router)

@app.get("/health")
def health():
    return {"status": "ok"}
