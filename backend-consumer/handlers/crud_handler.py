import json
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, text
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://admin:admin123@postgres:5432/admin_db",
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def handle_crud(payload: dict) -> dict:
    action = payload.get("action")
    data = payload.get("data") or {}

    async with AsyncSessionLocal() as db:
        if action == "CREATE_USER":
            val = json.dumps(data.get("value", data))
            result = await db.execute(
                text(
                    "INSERT INTO users (role_id, value) VALUES (:role_id, CAST(:value AS jsonb)) RETURNING id"
                ),
                {"role_id": data.get("role_id"), "value": val},
            )
            row = result.fetchone()
            await db.commit()
            return {"id": row[0], "status": "Oluşturuldu"}

        if action == "UPDATE_PERMISSION":
            await db.execute(
                text(
                    "SELECT update_role_screen_assignment(:role_id, :screen, :can_read, :can_write, :can_delete)"
                ),
                {
                    "role_id": data["role_id"],
                    "screen": data["screen"],
                    "can_read": data["can_read"],
                    "can_write": data["can_write"],
                    "can_delete": data["can_delete"],
                },
            )
            if data.get("allowed_extensions") is not None:
                await db.execute(
                    text("""
                        UPDATE permissions SET value = jsonb_set(
                            value, '{allowed_extensions}', CAST(:ext AS jsonb)
                        )
                        WHERE role_id = :role_id AND value->>'screen' = :screen
                    """),
                    {
                        "role_id": data["role_id"],
                        "screen": data["screen"],
                        "ext": json.dumps(data["allowed_extensions"]),
                    },
                )
            await db.commit()
            return {"status": "Güncellendi", "screen": data["screen"]}

        if action == "COPY_PERMISSIONS":
            await db.execute(
                text("CALL copy_role_permissions(:source_role_id, :target_role_id)"),
                {
                    "source_role_id": data["source_role_id"],
                    "target_role_id": data["target_role_id"]
                }
            )
            await db.commit()
            return {"status": "Kopyalandı"}

        if action == "LIST_ANNOUNCEMENTS":
            result = await db.execute(
                text("SELECT id, value FROM announcements ORDER BY id DESC")
            )
            rows = result.fetchall()
            items = []
            for r in rows:
                v = r[1] if isinstance(r[1], dict) else json.loads(r[1])
                items.append({"id": r[0], **v})
            return {"announcements": items}

        if action == "CREATE_ANNOUNCEMENT":
            val = {
                "title": data["title"],
                "content": data["content"],
                "author": data.get("author", "sistem"),
                "date": datetime.now().strftime("%d %B %Y").lower(),
                "priority": data.get("priority", "normal"),
            }
            result = await db.execute(
                text(
                    "INSERT INTO announcements (value) VALUES (CAST(:value AS jsonb)) RETURNING id"
                ),
                {"value": json.dumps(val, ensure_ascii=False)},
            )
            row = result.fetchone()
            await db.commit()
            return {"id": row[0], **val}

        if action == "DELETE_ANNOUNCEMENT":
            await db.execute(
                text("DELETE FROM announcements WHERE id = :id"),
                {"id": data["id"]},
            )
            await db.commit()
            return {"status": "Silindi", "id": data["id"]}

        if action == "LIST_STUDENTS":
            result = await db.execute(
                text("""
                    SELECT u.id, u.value FROM users u
                    JOIN roles r ON u.role_id = r.id
                    WHERE r.value->>'name' = 'ogrenci'
                """)
            )
            students = []
            for row in result.fetchall():
                v = row[1] if isinstance(row[1], dict) else json.loads(row[1])
                students.append({"id": row[0], **v})
            return {"students": students}

        if action == "LIST_LOGS":
            result = await db.execute(
                text("SELECT id, date, value FROM logs ORDER BY id DESC LIMIT 100")
            )
            rows = result.fetchall()
            logs = []
            for r in rows:
                v = r[2] if isinstance(r[2], dict) else json.loads(r[2])
                date_str = r[1].strftime("%Y-%m-%d %H:%M:%S") if r[1] else ""
                logs.append({"id": r[0], "date": date_str, **v})
            return {"logs": logs}

        if action == "LIST_DESIGNS":
            result = await db.execute(
                text("SELECT id, value FROM designs ORDER BY id DESC")
            )
            rows = result.fetchall()
            designs = []
            for r in rows:
                v = r[1] if isinstance(r[1], dict) else json.loads(r[1])
                designs.append({"id": r[0], **v})
            return {"designs": designs}

        if action == "LIST_ASSIGNMENTS":
            result = await db.execute(
                text("SELECT id, value FROM assignments ORDER BY id DESC")
            )
            rows = result.fetchall()
            items = []
            for r in rows:
                v = r[1] if isinstance(r[1], dict) else json.loads(r[1])
                items.append({"id": r[0], **v})
            return {"assignments": items}

        if action == "CREATE_ASSIGNMENT":
            val = {
                "title": data.get("title"),
                "course": data.get("course"),
                "deadline": data.get("deadline", "belirsiz"),
                "date": datetime.now().strftime("%d %B %Y").lower(),
            }
            result = await db.execute(
                text("INSERT INTO assignments (value) VALUES (CAST(:value AS jsonb)) RETURNING id"),
                {"value": json.dumps(val, ensure_ascii=False)},
            )
            row = result.fetchone()
            await db.commit()
            return {"id": row[0], **val}

        if action == "DELETE_ASSIGNMENT":
            await db.execute(
                text("DELETE FROM assignments WHERE id = :id"),
                {"id": data["id"]},
            )
            await db.commit()
            return {"status": "Silindi", "id": data["id"]}

        if action == "LIST_BUSINESS_JOBS":
            result = await db.execute(
                text("SELECT id, value FROM business_jobs ORDER BY id DESC")
            )
            rows = result.fetchall()
            items = []
            for r in rows:
                v = r[1] if isinstance(r[1], dict) else json.loads(r[1])
                items.append({"id": r[0], **v})
            return {"business_jobs": items}

        if action == "CREATE_BUSINESS_JOB":
            val = {
                "company": data.get("company"),
                "position": data.get("position"),
                "duration": data.get("duration", "belirsiz"),
                "deadline": data.get("deadline", "belirsiz"),
                "type": data.get("type", "iş"),
            }
            result = await db.execute(
                text("INSERT INTO business_jobs (value) VALUES (CAST(:value AS jsonb)) RETURNING id"),
                {"value": json.dumps(val, ensure_ascii=False)},
            )
            row = result.fetchone()
            await db.commit()
            return {"id": row[0], **val}

        if action == "DELETE_BUSINESS_JOB":
            await db.execute(
                text("DELETE FROM business_jobs WHERE id = :id"),
                {"id": data["id"]},
            )
            await db.commit()
            return {"status": "Silindi", "id": data["id"]}

        if action == "CREATE_DESIGN":
            val = {
                "name": data.get("name"),
                "components": data.get("components", []),
                "author": data.get("author", "sistem"),
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
            result = await db.execute(
                text("INSERT INTO designs (value) VALUES (CAST(:value AS jsonb)) RETURNING id"),
                {"value": json.dumps(val, ensure_ascii=False)},
            )
            row = result.fetchone()
            await db.commit()
            return {"id": row[0], **val}

    raise ValueError(f"bilinmeyen işlem: {action}")
