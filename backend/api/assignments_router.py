from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.deps import get_current_user
from core.rabbitmq import rpc_client
from core.logging_config import logger
from api.ws_router import manager

router = APIRouter(prefix="/assignments", tags=["ödevler"])

class AssignmentCreate(BaseModel):
    title: str
    course: str
    deadline: Optional[str] = "belirsiz"

def _can_write(user: dict, screen: str = "assignments") -> bool:
    for p in user.get("permissions", []):
        if p.get("screen") == screen and p.get("can_write"):
            return True
    return False

@router.get("")
async def list_assignments(user: dict = Depends(get_current_user)):
    response = await rpc_client.call("crud_operations", {
        "action": "LIST_ASSIGNMENTS",
        "data": {},
    })
    if not response.get("success"):
        raise HTTPException(status_code=500, detail=response.get("payload"))
    return response.get("payload")

@router.post("")
async def create_assignment(
    body: AssignmentCreate,
    user: dict = Depends(get_current_user),
):
    if not _can_write(user):
        raise HTTPException(status_code=403, detail="yazma yetkiniz yok")
    response = await rpc_client.call("crud_operations", {
        "action": "CREATE_ASSIGNMENT",
        "data": body.model_dump(),
    })
    if not response.get("success"):
        raise HTTPException(status_code=400, detail=response.get("payload"))
    logger.info("assignment created by %s", user.get("username"))
    
    await manager.broadcast({
        "type": "NEW_ASSIGNMENT",
        "message": f"Yeni bir ödev eklendi: {body.title}"
    })
    
    return response.get("payload")

@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: int,
    user: dict = Depends(get_current_user),
):
    can_delete = any(
        p.get("screen") == "assignments" and p.get("can_delete")
        for p in user.get("permissions", [])
    )
    if not can_delete:
        raise HTTPException(status_code=403, detail="silme yetkiniz yok")
    response = await rpc_client.call("crud_operations", {
        "action": "DELETE_ASSIGNMENT",
        "data": {"id": assignment_id},
    })
    if not response.get("success"):
        raise HTTPException(status_code=400, detail=response.get("payload"))
    return response.get("payload")
