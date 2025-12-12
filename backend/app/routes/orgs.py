# backend/app/routes/orgs.py
import re
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.hash import bcrypt_sha256

from app.core import db as core_db
from app.routes.auth import get_current_admin
from app.services.backup import backup_collection_async, copy_collection_async

logger = logging.getLogger(__name__)
router = APIRouter()

# Input schemas
class OrgCreate(BaseModel):
    organization_name: str
    admin_email: EmailStr
    admin_password: str

class OrgUpdateIn(BaseModel):
    # Provide fields that admin wants to change
    new_organization_name: str | None = None
    new_admin_email: EmailStr | None = None

def sanitize_name(name: str) -> str:
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    return name.lower()

@router.post("/create", tags=["org"])
async def create_org(payload: OrgCreate):
    if core_db.db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    org_name_raw = payload.organization_name.strip()
    if not org_name_raw:
        raise HTTPException(status_code=400, detail="organization_name is required")

    org_name = sanitize_name(org_name_raw)
    master = core_db.db["master_organizations"]

    # check exists
    exists = await master.find_one({"organization_name": org_name})
    if exists:
        raise HTTPException(status_code=400, detail="Organization already exists")

    # ensure admin email not used across master
    existing_admin = await master.find_one({"admin_email": payload.admin_email})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin email already used for another org")

    coll_name = f"org_{org_name}"

    # hash with bcrypt_sha256 for length-safety
    password_hash = bcrypt_sha256.hash(payload.admin_password)

    org_coll = core_db.db[coll_name]
    admin_doc = {
        "email": payload.admin_email,
        "password_hash": password_hash,
        "created_at": datetime.utcnow()
    }

    insert_res = await org_coll.insert_one(admin_doc)
    admin_id = insert_res.inserted_id

    master_doc = {
        "organization_name": org_name,
        "collection_name": coll_name,
        "admin_id": admin_id,
        "admin_email": payload.admin_email,
        "created_at": datetime.utcnow()
    }
    await master.insert_one(master_doc)

    return {"ok": True, "organization": org_name, "collection": coll_name, "admin_id": str(admin_id)}

# GET org details (protected)
@router.get("/get", tags=["org"])
async def get_org(current = Depends(get_current_admin)):
    admin = current["admin"]
    org = current["org"]
    return {
        "organization_name": org["organization_name"],
        "admin_email": admin.get("email"),
        "created_at": org.get("created_at")
    }

# PUT /org/update - rename org collection and/or update admin email
@router.put("/update", tags=["org"])
async def update_org(payload: OrgUpdateIn, current = Depends(get_current_admin)):
    if core_db.db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    master = core_db.db["master_organizations"]
    org = current["org"]
    old_org_name = org["organization_name"]
    old_coll = org["collection_name"]

    update_fields = {}

    # 1) handle rename
    if payload.new_organization_name:
        new_raw = payload.new_organization_name.strip()
        if not new_raw:
            raise HTTPException(status_code=400, detail="new_organization_name cannot be empty")
        new_name = sanitize_name(new_raw)

        # ensure not taken already
        if await master.find_one({"organization_name": new_name}):
            raise HTTPException(status_code=400, detail="New organization name already exists")

        new_coll_name = f"org_{new_name}"

        # Backup old collection first
        backup_path = await backup_collection_async(old_coll)
        logger.info("Backup created before rename: %s", backup_path)

        # Copy docs to new collection
        copied = await copy_collection_async(old_coll, new_coll_name)

        # verify counts: compare counts in src vs dest
        src_count = await core_db.db[old_coll].count_documents({})
        dest_count = await core_db.db[new_coll_name].count_documents({})
        if src_count != dest_count:
            # attempt cleanup: drop new coll and abort with error
            logger.error("Copy count mismatch (src=%s dest=%s). Rolling back.", src_count, dest_count)
            await core_db.db[new_coll_name].drop()
            raise HTTPException(status_code=500, detail="Failed to migrate collection (count mismatch). Backup created.")

        # drop old collection only after successful verification
        await core_db.db[old_coll].drop()
        # update master fields
        update_fields["collection_name"] = new_coll_name
        update_fields["organization_name"] = new_name

    # 2) handle admin email change
    if payload.new_admin_email:
        # check email not used by another org
        if await master.find_one({"admin_email": payload.new_admin_email, "organization_name": {"$ne": old_org_name}}):
            raise HTTPException(status_code=400, detail="Provided new_admin_email already used by another org")

        # update admin in org collection (old or new coll name)
        target_coll_name = update_fields.get("collection_name", old_coll)
        org_coll = core_db.db[target_coll_name]
        # update all admin docs matching previous admin_email
        await org_coll.update_many({"email": org.get("admin_email")}, {"$set": {"email": payload.new_admin_email}})
        update_fields["admin_email"] = payload.new_admin_email

    # apply updates to master document
    if update_fields:
        await master.update_one({"organization_name": old_org_name}, {"$set": update_fields})
        updated = await master.find_one({"organization_name": update_fields.get("organization_name", old_org_name)})
        return {"updated": True, "organization": updated["organization_name"]}

    return {"updated": False, "reason": "no changes provided"}

# DELETE /org/delete - drop org collection and remove master doc (protected)
@router.delete("/delete", tags=["org"])
async def delete_org(current = Depends(get_current_admin)):
    if core_db.db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    org = current["org"]
    master = core_db.db["master_organizations"]
    coll_name = org["collection_name"]

    # Backup first
    backup_path = await backup_collection_async(coll_name)
    logger.info("Backup created before delete: %s", backup_path)

    # Drop collection
    await core_db.db[coll_name].drop()

    # Remove master record
    await master.delete_one({"organization_name": org["organization_name"]})

    return {"deleted": True, "organization": org["organization_name"], "backup": backup_path}
