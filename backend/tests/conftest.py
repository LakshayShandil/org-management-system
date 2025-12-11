# backend/tests/conftest.py
import sys, os
import pytest
import mongomock
from fastapi.testclient import TestClient

# Add backend/ to PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.main import app
from app.core import db as core_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """
    Replace the MongoDB client with a mongomock in-memory database.
    """
    mock_client = mongomock.MongoClient()
    mock_db = mock_client["testdb"]

    core_db.db = mock_db
    yield
    core_db.db = None


@pytest.fixture
def client():
    return TestClient(app)
