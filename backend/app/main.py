# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from slowapi import Limiter
from slowapi.util import get_remote_address


from app.core.limiter import limiter
from app.routes import orgs, auth
from app.core.db import connect_to_mongo, close_mongo

app = FastAPI(title="Org Management Backend")

import os
TESTING = os.getenv("TESTING", "0") == "1"
if not TESTING:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(429, _rate_limit_exceeded_handler)


# attach limiter globally
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten for production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo()

# Routers
app.include_router(orgs.router, prefix="/org", tags=["org"])
app.include_router(auth.router)

@app.get("/health")
def health():
    return {"status": "ok"}
