from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import Optional, List
from core.database import get_db
from core.deps import get_current_user, require_supervisor
from core.rabbitmq import rpc_client
from core.redis_client import invalidate_permissions
from core.logging_config import logger
from models.domain import Permission, Role

router = APIRouter(prefix="/permissions", tags=["yetkilendirme"])

SCREEN_LABELS = {
    "supervisor_matrix": "Süpervizör Matrisi",
    "announcements": "Duyuru Panosu",
    "assignments": "Ödev & Materyal",
    "design_lab": "Tasarım Laboratuvarı",
    "business": "İşletme Panosu",
    "student_list": "Öğrenci Listesi",
}

ROLE_LABELS = {
    "supervisor": "Süpervizör",
    "akademisyen": "Akademisyen",
    "ogrenci": "Öğrenci",
    "isletme": "İşletme",
    "okul": "Okul",
}


class PermissionUpdate(BaseModel):
    role_id: int
    screen: str
    can_read: bool
    can_write: bool
    can_delete: bool
    allowed_extensions: Optional[List[str]] = None


@router.get("/me")
async def my_permissions(user: dict = Depends(get_current_user)):
    return {"permissions": user.get("permissions", [])}


@router.get("")
async def list_all_permissions(
    _: dict = Depends(require_supervisor),
    db: AsyncSession = Depends(get_db),
):
    roles_result = await db.execute(select(Role))
    roles = {r.id: r for r in roles_result.scalars().all()}

    perms_result = await db.execute(select(Permission))
    matrix = []
    for p in perms_result.scalars().all():
        role = roles.get(p.role_id)
        role_name = (role.value or {}).get("name", "") if role else ""
        val = p.value or {}
        matrix.append({
            "id": p.id,
            "role_id": p.role_id,
            "role": role_name,
            "role_label": ROLE_LABELS.get(role_name, role_name),
            "screen": val.get("screen"),
            "screen_label": SCREEN_LABELS.get(val.get("screen"), val.get("screen")),
            "read": val.get("can_read", False),
            "write": val.get("can_write", False),
            "canDelete": val.get("can_delete", False),
            "allowed_extensions": val.get("allowed_extensions"),
        })
    return {"matrix": matrix, "roles": [
        {"id": r.id, "name": (r.value or {}).get("name"), "label": ROLE_LABELS.get((r.value or {}).get("name", ""), "")}
        for r in roles.values()
    ]}


@router.put("")
async def update_permission(
    body: PermissionUpdate,
    _: dict = Depends(require_supervisor),
):
    response = await rpc_client.call("crud_operations", {
        "action": "UPDATE_PERMISSION",
        "data": body.model_dump(),
    })
    if not response.get("success"):
        raise HTTPException(status_code=400, detail=response.get("payload"))
    await invalidate_permissions(body.role_id)
    logger.info("permission updated: role=%s screen=%s", body.role_id, body.screen)
    return response.get("payload")


class CopyPermissions(BaseModel):
    source_role_id: int
    target_role_id: int


@router.post("/copy")
async def copy_permissions(
    body: CopyPermissions,
    _: dict = Depends(require_supervisor),
):
    response = await rpc_client.call("crud_operations", {
        "action": "COPY_PERMISSIONS",
        "data": body.model_dump(),
    })
    if not response.get("success"):
        raise HTTPException(status_code=400, detail=response.get("payload"))
    await invalidate_permissions(body.target_role_id)
    logger.info("permissions copied: from=%s to=%s", body.source_role_id, body.target_role_id)
    return response.get("payload")
