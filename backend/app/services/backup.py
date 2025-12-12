# backend/app/services/backup.py
import os
import json
import datetime
from typing import List
from bson import ObjectId

from app.core import db as core_db

# Async backup function: returns path to backup file
async def backup_collection_async(coll_name: str, out_dir: str = "backups") -> str:
    db = core_db.db
    if db is None:
        raise RuntimeError("Database not initialized")

    coll = db[coll_name]
    docs = []
    async for d in coll.find({}):
        # Serialize ObjectId to string
        d["_id"] = str(d.get("_id"))
        docs.append(d)

    os.makedirs(out_dir, exist_ok=True)
    ts = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    filename = f"{coll_name}_backup_{ts}.json"
    out_path = os.path.join(out_dir, filename)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(docs, f, default=str, indent=2)

    return out_path


async def copy_collection_async(src_coll_name: str, dest_coll_name: str) -> int:
    db = core_db.db
    if db is None:
        raise RuntimeError("Database not initialized")

    src = db[src_coll_name]
    dest = db[dest_coll_name]
    count = 0
    # Insert in batches for efficiency
    batch = []
    BATCH_SIZE = 500
    async for doc in src.find({}):
        doc.pop("_id", None)
        batch.append(doc)
        if len(batch) >= BATCH_SIZE:
            res = await dest.insert_many(batch)
            count += len(res.inserted_ids)
            batch = []
    if batch:
        res = await dest.insert_many(batch)
        count += len(res.inserted_ids)
    return count
