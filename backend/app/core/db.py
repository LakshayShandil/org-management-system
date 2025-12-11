# backend/app/core/db.py
import motor.motor_asyncio
from app.core.config import settings

client: motor.motor_asyncio.AsyncIOMotorClient | None = None
db = None

async def connect_to_mongo():
    global client, db
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_uri)

    # prefer explicit DB name from settings, otherwise try get_default_database()
    if settings.mongodb_name:
        db = client[settings.mongodb_name]
    else:
        # fallback: try get_default_database (works if DB name is in URI)
        try:
            db = client.get_default_database()
        except Exception as e:
            # close client and re-raise a clearer error
            client.close()
            raise RuntimeError(
                "No default database detected. Please set MONGODB_NAME in your .env "
                "or include the DB name in your MONGODB_URI."
            ) from e

    print("Connected to MongoDB (db):", getattr(db, "name", str(db)))

async def close_mongo():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")
