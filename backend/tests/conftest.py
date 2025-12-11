import os
import sys
import mongomock
import pytest

# add backend folder to path
BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core import db as core_db
from tests.mongo_async_mock import AsyncMockCollection


@pytest.fixture(autouse=True)
def mock_mongo():
    """
    Replace MongoDB with mongomock wrapped in async wrappers.
    """
    mock_client = mongomock.MongoClient()

    # wrap database
    class AsyncMockDB:
        def __init__(self, db):
            self._db = db

        def __getitem__(self, name):
            return AsyncMockCollection(self._db[name])

    core_db.client = mock_client
    core_db.db = AsyncMockDB(mock_client["testdb"])

    yield

    core_db.client = None
    core_db.db = None
