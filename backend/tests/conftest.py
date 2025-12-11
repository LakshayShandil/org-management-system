# backend/tests/conftest.py
import pytest
import mongomock
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient
from app.main import app
from app.core import db as core_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Create a mongomock in-memory client
    mock_client = mongomock.MongoClient()
    mock_db = mock_client["testdb"]

    # Patch the global db reference used by the application
    core_db.db = mock_db

    yield  # Run tests

    # Cleanup after tests
    core_db.db = None


@pytest.fixture
def client():
    """
    FastAPI TestClient instance.
    """
    return TestClient(app)
