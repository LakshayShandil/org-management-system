# backend/app/routes/auth.py
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from passlib.hash import bcrypt_sha256
from fastapi.security import OAuth2PasswordBearer

from app.core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler  # keep import if your app registers handler centrally

from app.core import db as core_db
from app.core.auth import create_access_token, decode_access_token
from app.core.config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/login")


# -------------------------
# Schemas
# -------------------------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SuperLoginIn(BaseModel):
    username: str
    password: str


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
        "admin_email": payload.email,
        "role": "org_admin",
    }
    access_token = create_access_token(subject=str(admin["_id"]), data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/super/login", response_model=LoginResponse, tags=["auth"])
async def super_login(payload: SuperLoginIn):
    """
    Simple superadmin login that reads credentials from environment (.env -> settings).
    For demo only. In production use a proper user store with hashed passwords.
    """
    # Ensure settings provide superadmin credentials
    if not getattr(settings, "superadmin_username", None) or not getattr(settings, "superadmin_password", None):
        raise HTTPException(status_code=500, detail="Superadmin credentials not configured on server")

    # Basic comparison (in demo we compare plaintext from env)
    if payload.username != settings.superadmin_username or payload.password != settings.superadmin_password:
        raise HTTPException(status_code=401, detail="Invalid superadmin credentials")

    token_data = {
        "role": "superadmin",
        "username": payload.username,
    }
    access_token = create_access_token(subject=payload.username, data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}


async def get_current_admin(token: str = Depends(oauth2_scheme)):
    """
    Validate JWT and return {"admin": <admin_doc>, "org": <master_doc>}
    This implementation is tolerant: it tries organization_name first, then admin_email, then admin_id fallback.
    """
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    admin_id = payload.get("admin_id")
    org_name = payload.get("organization_name")
    admin_email = payload.get("admin_email")

    if not admin_id and not admin_email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    if core_db.db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    master = core_db.db["master_organizations"]
    master_doc = None

    # 1) Primary: try exact organization_name
    if org_name:
        master_doc = await master.find_one({"organization_name": org_name})

    # 2) Fallback: try admin_email
    if not master_doc and admin_email:
        master_doc = await master.find_one({"admin_email": admin_email})

    # 3) Extra fallback: try admin_id stored in master (ObjectId or string)
    if not master_doc and admin_id:
        import bson
        try:
            master_doc = await master.find_one({"admin_id": bson.ObjectId(admin_id)})
        except Exception:
            master_doc = await master.find_one({"admin_id": admin_id})

    if not master_doc:
        raise HTTPException(status_code=401, detail="Organization not found")

    # Now resolve admin inside the resolved org collection
    org_coll = core_db.db[master_doc["collection_name"]]
    admin = None
    import bson

    # Preferred: lookup by ObjectId if we have admin_id
    if admin_id:
        try:
            admin = await org_coll.find_one({"_id": bson.ObjectId(admin_id)})
        except Exception:
            admin = None

    # Fallback: lookup by email
    if not admin and admin_email:
        admin = await org_coll.find_one({"email": admin_email})

    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")

    return {"admin": admin, "org": master_doc}


async def get_current_superadmin(token: str = Depends(oauth2_scheme)):
    """
    Validates the token and ensures the role claim == 'superadmin'.
    Use this dependency for routes that should be accessible only by superadmins.
    """
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    role = payload.get("role")
    if role != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin privileges required")

    # return payload so handlers can read username/role if needed
    return payload


@router.get("/admin/master-list", tags=["admin"])
async def get_master_list(current_superadmin = Depends(get_current_superadmin)):
    """
    Superadmin endpoint to fetch all organizations in the master list.
    """
    if core_db.db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    master = core_db.db["master_organizations"]
    organizations = await master.find({}).to_list(None)
    
    # Convert ObjectId to string for JSON serialization
    import bson
    for org in organizations:
        if "_id" in org:
            org["_id"] = str(org["_id"])
        if "admin_id" in org:
            org["admin_id"] = str(org["admin_id"])
    
    return {"data": organizations}


class SuperadminOrgUpdate(BaseModel):
    new_organization_name: str | None = None
    new_admin_email: EmailStr | None = None


@router.put("/admin/update-org/{org_name}", tags=["admin"])
async def superadmin_update_org(
    org_name: str,
    payload: SuperadminOrgUpdate,
    current_superadmin = Depends(get_current_superadmin)
):
    """
    Superadmin endpoint to update organization details.
    Requires organization_name in URL path.
    """
    if core_db.db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    import bson
    from app.services.backup import backup_collection_async, copy_collection_async
    
    master = core_db.db["master_organizations"]
    org = await master.find_one({"organization_name": org_name})
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    old_coll = org["collection_name"]
    update_fields = {}

    # Handle rename
    if payload.new_organization_name:
        new_raw = payload.new_organization_name.strip()
        if not new_raw:
            raise HTTPException(status_code=400, detail="new_organization_name cannot be empty")
        
        from app.routes.orgs import sanitize_name
        new_name = sanitize_name(new_raw)

        if await master.find_one({"organization_name": new_name}):
            raise HTTPException(status_code=400, detail="New organization name already exists")

        new_coll_name = f"org_{new_name}"

        # Backup old collection
        backup_path = await backup_collection_async(old_coll)

        # Copy to new collection
        copied = await copy_collection_async(old_coll, new_coll_name)

        # Verify counts
        src_count = await core_db.db[old_coll].count_documents({})
        dest_count = await core_db.db[new_coll_name].count_documents({})
        if src_count != dest_count:
            await core_db.db[new_coll_name].drop()
            raise HTTPException(status_code=500, detail="Failed to migrate collection (count mismatch)")

        # Drop old and update master
        await core_db.db[old_coll].drop()
        update_fields["collection_name"] = new_coll_name
        update_fields["organization_name"] = new_name

    # Handle admin email change
    if payload.new_admin_email:
        if await master.find_one({"admin_email": payload.new_admin_email, "organization_name": {"$ne": org_name}}):
            raise HTTPException(status_code=400, detail="Email already used by another org")

        target_coll_name = update_fields.get("collection_name", old_coll)
        org_coll = core_db.db[target_coll_name]
        await org_coll.update_many({"email": org.get("admin_email")}, {"$set": {"email": payload.new_admin_email}})
        update_fields["admin_email"] = payload.new_admin_email

    if update_fields:
        await master.update_one({"organization_name": org_name}, {"$set": update_fields})
        updated = await master.find_one({"organization_name": update_fields.get("organization_name", org_name)})
        if "_id" in updated:
            updated["_id"] = str(updated["_id"])
        if "admin_id" in updated:
            updated["admin_id"] = str(updated["admin_id"])
        return {"updated": True, "organization": updated}

    return {"updated": False, "reason": "no changes provided"}


@router.delete("/admin/delete-org/{org_name}", tags=["admin"])
async def superadmin_delete_org(
    org_name: str,
    current_superadmin = Depends(get_current_superadmin)
):
    """
    Superadmin endpoint to delete an organization.
    Creates a backup before deletion.
    """
    if core_db.db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    from app.services.backup import backup_collection_async
    import logging
    logger = logging.getLogger(__name__)
    
    master = core_db.db["master_organizations"]
    org = await master.find_one({"organization_name": org_name})
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    coll_name = org["collection_name"]

    # Backup first
    backup_path = await backup_collection_async(coll_name)
    logger.info("Backup created before superadmin delete: %s", backup_path)

    # Drop collection
    await core_db.db[coll_name].drop()

    # Remove master record
    await master.delete_one({"organization_name": org_name})

    return {"deleted": True, "organization": org_name, "backup": backup_path}
