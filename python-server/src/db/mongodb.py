"""Async MongoDB connection helper using motor."""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from src.config.settings import settings


class MongoDB:
    _client: AsyncIOMotorClient | None = None
    _db: AsyncIOMotorDatabase | None = None

    @classmethod
    def _ensure_connected(cls) -> None:
        if cls._client is None:
            cls._client = AsyncIOMotorClient(settings.mongodb_uri)
            cls._db = cls._client[settings.mongodb_db_name]

    @classmethod
    def get_collection(cls, name: str) -> AsyncIOMotorCollection:
        cls._ensure_connected()
        assert cls._db is not None
        return cls._db[name]

    @classmethod
    async def close(cls) -> None:
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None
