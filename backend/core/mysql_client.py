import os
import json
from typing import Any
import aiomysql

MYSQL_HOST = os.getenv("MYSQL_HOST", "mysql")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "admin")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "admin123")
MYSQL_DB = os.getenv("MYSQL_DB", "admin_reports")

_pool: Any = None


async def get_mysql_pool():
    global _pool
    if _pool is None:
        _pool = await aiomysql.create_pool(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            db=MYSQL_DB,
            autocommit=True,
            minsize=1,
            maxsize=5,
        )
    return _pool


async def log_activity_report(event_type: str, payload: dict) -> None:
    """MySQL arşiv tablosuna JSON rapor yazar."""
    try:
        pool = await get_mysql_pool()
        value = json.dumps({"event": event_type, **payload}, ensure_ascii=False)
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "INSERT INTO activity_reports (value) VALUES (%s)",
                    (value,),
                )
    except Exception:
        pass
