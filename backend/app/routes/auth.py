# backend/app/routes/auth.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.hash import bcrypt_sha256
from fastapi.security import OAuth2PasswordBearer

from app.core.limiter import limiter   # ✅ correct limiter import
from slowapi import Limiter, _rate_limit_exceeded_handler

from app.core import db as core_db
from app.core.auth import create_access_token, decode_access_token

from fastapi import Request

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/login")


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/admin/login", response_model=LoginResponse, tags=["auth"])
@limiter.limit("5/minute") 
async def admin_login(request: Request, payload: LoginIn):
    if core_db.db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    master = core_db.db["master_organizations"]
    master_doc = await master.find_one({"admin_email": payload.email})
    if not master_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    org_coll_name = master_doc.get("collection_name")
    if not org_coll_name:
        raise HTTPException(status_code=500, detail="Organization collection missing")

    org_coll = core_db.db[org_coll_name]
    admin = await org_coll.find_one({"email": payload.email})
    if not admin or "password_hash" not in admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    valid = bcrypt_sha256.verify(payload.password, admin["password_hash"])
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token_data = {
        "admin_id": str(admin["_id"]),
        "organization_name": master_doc["organization_name"],
        "admin_email": payload.email
    }
    access_token = create_access_token(subject=str(admin["_id"]), data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}


# Dependency for protected routes
async def get_current_admin(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    admin_id = payload.get("admin_id")
    org_name = payload.get("organization_name")

    if not admin_id or not org_name:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    master = core_db.db["master_organizations"]
    master_doc = await master.find_one({"organization_name": org_name})
    if not master_doc:
        raise HTTPException(status_code=401, detail="Organization not found")

    org_coll = core_db.db[master_doc["collection_name"]]

    import bson
    try:
        admin = await org_coll.find_one({"_id": bson.ObjectId(admin_id)})
    except Exception:
        admin = None

    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")

    return {"admin": admin, "org": master_doc}
