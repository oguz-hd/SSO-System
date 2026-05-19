import os
import json
from typing import Any, Optional
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
SESSION_TTL = int(os.getenv("SESSION_TTL", "86400"))

_pool: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    global _pool
    if _pool is None:
        _pool = redis.from_url(REDIS_URL, decode_responses=True)
    return _pool


async def set_session(token: str, data: dict) -> None:
    r = await get_redis()
    await r.setex(f"session:{token}", SESSION_TTL, json.dumps(data))


async def get_session(token: str) -> Optional[dict]:
    r = await get_redis()
    raw = await r.get(f"session:{token}")
    if not raw:
        return None
    return json.loads(raw)


async def delete_session(token: str) -> None:
    r = await get_redis()
    await r.delete(f"session:{token}")


async def cache_permissions(role_id: int, permissions: list) -> None:
    r = await get_redis()
    await r.setex(f"permissions:{role_id}", SESSION_TTL, json.dumps(permissions))


async def get_cached_permissions(role_id: int) -> Optional[list]:
    r = await get_redis()
    raw = await r.get(f"permissions:{role_id}")
    if not raw:
        return None
    return json.loads(raw)


async def invalidate_permissions(role_id: int) -> None:
    r = await get_redis()
    await r.delete(f"permissions:{role_id}")


async def rag_store(doc_id: str, chunks: list[str]) -> None:
    r = await get_redis()
    await r.setex(f"rag:{doc_id}", 3600, json.dumps(chunks))


async def rag_get(doc_id: str) -> list[str]:
    r = await get_redis()
    raw = await r.get(f"rag:{doc_id}")
    return json.loads(raw) if raw else []
