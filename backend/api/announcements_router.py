from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.deps import get_current_user
from core.rabbitmq import rpc_client
from core.logging_config import logger
from api.ws_router import manager

router = APIRouter(prefix="/announcements", tags=["duyurular"])


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: Optional[str] = "normal"


def _can_write(user: dict, screen: str = "announcements") -> bool:
    for p in user.get("permissions", []):
        if p.get("screen") == screen and p.get("can_write"):
            return True
    return False


@router.get("")
async def list_announcements(user: dict = Depends(get_current_user)):
    response = await rpc_client.call("crud_operations", {
        "action": "LIST_ANNOUNCEMENTS",
        "data": {},
    })
    if not response.get("success"):
        raise HTTPException(status_code=500, detail=response.get("payload"))
    return response.get("payload")


@router.post("")
async def create_announcement(
    body: AnnouncementCreate,
    user: dict = Depends(get_current_user),
):
    if not _can_write(user):
        raise HTTPException(status_code=403, detail="duyuru yazma yetkiniz yok")
    response = await rpc_client.call("crud_operations", {
        "action": "CREATE_ANNOUNCEMENT",
        "data": {
            **body.model_dump(),
            "author": user.get("username"),
            "author_id": user.get("user_id"),
        },
    })
    if not response.get("success"):
        raise HTTPException(status_code=400, detail=response.get("payload"))
    logger.info("announcement created by %s", user.get("username"))
    
    await manager.broadcast({
        "type": "NEW_ANNOUNCEMENT",
        "message": f"Yeni bir duyuru yayınlandı: {body.title}"
    })
    
    return response.get("payload")


@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: int,
    user: dict = Depends(get_current_user),
):
    can_delete = any(
        p.get("screen") == "announcements" and p.get("can_delete")
        for p in user.get("permissions", [])
    )
    if not can_delete:
        raise HTTPException(status_code=403, detail="silme yetkiniz yok")
    response = await rpc_client.call("crud_operations", {
        "action": "DELETE_ANNOUNCEMENT",
        "data": {"id": announcement_id},
    })
    if not response.get("success"):
        raise HTTPException(status_code=400, detail=response.get("payload"))
    return response.get("payload")
