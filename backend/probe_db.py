# probe_db.py - quick Atlas probe
import asyncio
import motor.motor_asyncio
from app.core.config import settings

async def probe():
    print("Connecting using masked URI prefix:", (settings.mongodb_uri or "")[:60] + "...")
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_uri)
    try:
        db = client[settings.mongodb_name] if getattr(settings, 'mongodb_name', None) else client.get_default_database()
        print("Connected to DB:", db.name)
        cols = await db.list_collection_names()
        print("Collections:", cols)
    finally:
        client.close()

asyncio.run(probe())
