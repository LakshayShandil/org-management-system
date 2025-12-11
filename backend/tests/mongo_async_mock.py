# backend/tests/mongo_async_mock.py

class AsyncMockCollection:
    """Wraps a mongomock collection to behave async like Motor."""
    def __init__(self, coll):
        self._coll = coll

    async def find_one(self, *args, **kwargs):
        return self._coll.find_one(*args, **kwargs)

    async def insert_one(self, doc):
        result = self._coll.insert_one(doc)
        class InsertResult:
            inserted_id = result.inserted_id
        return InsertResult()

    async def update_one(self, *args, **kwargs):
        result = self._coll.update_one(*args, **kwargs)
        class UpdateResult:
            modified_count = result.modified_count
        return UpdateResult()

    async def delete_one(self, *args, **kwargs):
        result = self._coll.delete_one(*args, **kwargs)
        class DeleteResult:
            deleted_count = result.deleted_count
        return DeleteResult()

    def __getitem__(self, item):
        return AsyncMockCollection(self._coll[item])
