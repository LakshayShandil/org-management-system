# backend/app/routes/orgs.py
import re
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.hash import bcrypt_sha256

from app.core import db as core_db
from app.routes.auth import get_current_admin

logger = logging.getLogger(__name__)
router = APIRouter()

class OrgCreate(BaseModel):
    organization_name: str
    admin_email: EmailStr
    admin_password: str

class OrgUpdateIn(BaseModel):
    new_organization_name: str | None = None
    new_admin_email: EmailStr | None = None
    # (we don't accept password change here for simplicity; add if needed)

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

# Protected: get org details (admin only)
@router.get("/get", tags=["org"])
async def get_org(current = Depends(get_current_admin)):
    admin = current["admin"]
    org = current["org"]
    return {
        "organization_name": org["organization_name"],
        "admin_email": admin.get("email"),
        "created_at": org.get("created_at")
    }

# Protected: update org metadata (rename or update admin email)
@router.put("/update", tags=["org"])
async def update_org(payload: OrgUpdateIn, current = Depends(get_current_admin)):
    master = core_db.db["master_organizations"]
    org = current["org"]
    old_name = org["organization_name"]
    update_payload = {}

    if payload.new_organization_name:
        new_name = sanitize_name(payload.new_organization_name.strip())
        # ensure not taken
        if await master.find_one({"organization_name": new_name}):
            raise HTTPException(status_code=400, detail="New organization name already exists")
        # rename collection: copy docs then drop old (simple approach)
        old_coll = core_db.db[f"org_{old_name}"]
        new_coll_name = f"org_{new_name}"
        new_coll = core_db.db[new_coll_name]

        # copy docs
        async for doc in old_coll.find({}):
            doc.pop("_id", None)
            await new_coll.insert_one(doc)
        # drop old
        await old_coll.drop()
        update_payload["collection_name"] = new_coll_name
        update_payload["organization_name"] = new_name

    if payload.new_admin_email:
        # update admin email in master and org collection
        update_payload["admin_email"] = payload.new_admin_email
        org_coll = core_db.db[update_payload.get("collection_name", org["collection_name"])]
        # update admin record(s)
        await org_coll.update_many({"email": org.get("admin_email")}, {"$set": {"email": payload.new_admin_email}})

    if update_payload:
        await master.update_one({"organization_name": old_name}, {"$set": update_payload})
        # return updated doc
        updated = await master.find_one({"organization_name": update_payload.get("organization_name", old_name)})
        return {"updated": True, "organization": updated["organization_name"]}

    return {"updated": False, "reason": "no changes provided"}

# Protected: delete org (admin only)
@router.delete("/delete", tags=["org"])
async def delete_org(current = Depends(get_current_admin)):
    org = current["org"]
    master = core_db.db["master_organizations"]
    coll_name = org["collection_name"]

    # drop org collection
    await core_db.db[coll_name].drop()
    # remove master record
    await master.delete_one({"organization_name": org["organization_name"]})

    return {"deleted": True, "organization": org["organization_name"]}
