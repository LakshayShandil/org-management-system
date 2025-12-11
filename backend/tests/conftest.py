# backend/tests/conftest.py
import sys, os
import pytest
import mongomock
from fastapi.testclient import TestClient
from app.main import app
from app.core import db as core_db

# Ensure backend/ is added to PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(__file__)))


class AsyncMockCollection:
    def __init__(self, collection):
        self.collection = collection

    async def find_one(self, *args, **kwargs):
        return self.collection.find_one(*args, **kwargs)

    async def insert_one(self, doc):
        return self.collection.insert_one(doc)

    async def delete_one(self, query):
        return self.collection.delete_one(query)

    async def update_one(self, query, update):
        return self.collection.update_one(query, update)


class AsyncMockDB:
    def __init__(self, db):
        self.db = db

    def __getitem__(self, name):
        return AsyncMockCollection(self.db[name])



@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    
    mock_client = mongomock.MongoClient()
    mock_db = mock_client["testdb"]

    core_db.db = AsyncMockDB(mock_db)

    yield

    core_db.db = None


@pytest.fixture
def client():
    return TestClient(app)