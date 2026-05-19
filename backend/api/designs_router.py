from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.deps import get_current_user
from core.rabbitmq import rpc_client
from core.logging_config import logger

router = APIRouter(prefix="/designs", tags=["tasarımlar"])

class DesignCreate(BaseModel):
    name: str
    components: list

def _can_write(user: dict, screen: str = "design_lab") -> bool:
    for p in user.get("permissions", []):
        if p.get("screen") == screen and p.get("can_write"):
            return True
    return False

@router.get("")
async def list_designs(user: dict = Depends(get_current_user)):
    response = await rpc_client.call("crud_operations", {
        "action": "LIST_DESIGNS",
        "data": {},
    })
    if not response.get("success"):
        raise HTTPException(status_code=500, detail=response.get("payload"))
    return response.get("payload")

@router.post("")
async def create_design(
    body: DesignCreate,
    user: dict = Depends(get_current_user),
):
    if not _can_write(user):
        raise HTTPException(status_code=403, detail="kaydetme yetkiniz yok")
    response = await rpc_client.call("crud_operations", {
        "action": "CREATE_DESIGN",
        "data": {"name": body.name, "components": body.components, "author": user.get("username")},
    })
    if not response.get("success"):
        raise HTTPException(status_code=400, detail=response.get("payload"))
    return response.get("payload")
