# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import orgs, auth
from app.core.db import connect_to_mongo, close_mongo

app = FastAPI(title="Org Management Backend")

# 🔥 REMOVE CORS COMPLETELY — ALLOW EVERYTHING 🔥
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          
    allow_credentials=False,      
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
