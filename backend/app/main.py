# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routes import orgs, auth
from app.core.db import connect_to_mongo, close_mongo
from app.core.config import settings

app = FastAPI(title="Org Management Backend")

# Detect if running inside CI testing environment
TESTING = os.getenv("TESTING", "0") == "1"


if not TESTING:
    # conditional import to avoid importing slowapi in CI/test if not installed
    try:
        from slowapi import Limiter, _rate_limit_exceeded_handler
        from slowapi.util import get_remote_address

        limiter = Limiter(key_func=get_remote_address)
        app.state.limiter = limiter
        app.add_exception_handler(429, _rate_limit_exceeded_handler)
    except Exception:
        # If slowapi not installed, continue without rate limiting
        limiter = None
else:
    limiter = None  # no rate limiter in CI/test mode


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://org-management-system.vercel.app",
        "https://org-management-system-b9nlj798c-lakshays-projects-6a94f8e4.vercel.app",
        "http://localhost:5174",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo()

app.include_router(orgs.router, prefix="/org", tags=["org"])
app.include_router(auth.router)

@app.get("/health")
def health():
    return {"status": "ok"}
