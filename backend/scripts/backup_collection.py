# backup_collection.py
import os, json, asyncio
import datetime
import motor.motor_asyncio
from app.core.config import settings

async def backup_collection(coll_name, out_dir="backups"):
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_name]
    coll = db[coll_name]
    docs = []
    async for d in coll.find({}):
        d["_id"] = str(d["_id"])
        docs.append(d)
    client.close()

    os.makedirs(out_dir, exist_ok=True)
    ts = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    out_file = os.path.join(out_dir, f"{coll_name}_backup_{ts}.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(docs, f, default=str, indent=2)
    print("Backed up", coll_name, "->", out_file)

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python backup_collection.py <collection_name>")
        sys.exit(1)
    asyncio.run(backup_collection(sys.argv[1]))
