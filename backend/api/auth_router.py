from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from core.database import get_db
from core.security import verify_password, create_token
from core.redis_client import set_session
from core.mysql_client import log_activity_report
from core.deps import get_current_user
from core.logging_config import logger
from models.domain import User, Role, Permission

router = APIRouter(prefix="/auth", tags=["kimlik doğrulama"])


class LoginRequest(BaseModel):
    username: str
    password: str


SCREEN_LABELS = {
    "supervisor_matrix": "Süpervizör Matrisi",
    "announcements": "Duyuru Panosu",
    "assignments": "Ödev & Materyal",
    "design_lab": "Tasarım Laboratuvarı",
    "business": "İşletme Panosu",
    "student_list": "Öğrenci Listesi",
}


async def load_permissions(db: AsyncSession, role_id: int) -> list:
    result = await db.execute(
        select(Permission).where(Permission.role_id == role_id)
    )
    perms = result.scalars().all()
    return [
        {
            "screen": p.value.get("screen"),
            "label": SCREEN_LABELS.get(p.value.get("screen"), p.value.get("screen")),
            "can_read": p.value.get("can_read", False),
            "can_write": p.value.get("can_write", False),
            "can_delete": p.value.get("can_delete", False),
            "allowed_extensions": p.value.get("allowed_extensions"),
        }
        for p in perms
        if p.value.get("can_read")
    ]


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User, Role).join(Role, User.role_id == Role.id))
    rows = result.all()

    for user, role in rows:
        uval = user.value or {}
        if uval.get("username") != body.username:
            continue
        if not uval.get("is_active", True):
            raise HTTPException(status_code=403, detail="hesap devre dışı")
        if not verify_password(body.password, uval.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="kullanıcı adı veya şifre hatalı")

        role_name = (role.value or {}).get("name", "")
        permissions = await load_permissions(db, role.id)
        token = create_token()

        session = {
            "user_id": user.id,
            "username": body.username,
            "role_id": role.id,
            "role_name": role_name,
            "role_label": (role.value or {}).get("label", role_name),
            "permissions": permissions,
            "token": token,
        }
        await set_session(token, session)
        await log_activity_report("login", {"username": body.username, "role": role_name})
        logger.info("login: %s (%s)", body.username, role_name)

        return {
            "token": token,
            "user_id": user.id,
            "username": body.username,
            "role_name": role_name,
            "role_label": session["role_label"],
            "permissions": permissions,
        }

    raise HTTPException(status_code=401, detail="kullanıcı adı veya şifre hatalı")


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    from core.redis_client import delete_session
    token = user.get("token")
    if token:
        await delete_session(token)
    return {"status": "çıkış yapıldı"}
