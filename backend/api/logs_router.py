from fastapi import APIRouter, Depends, HTTPException
from core.deps import get_current_user
from core.rabbitmq import rpc_client
from core.logging_config import logger

router = APIRouter(prefix="/logs", tags=["sistem logları"])

def _is_supervisor(user: dict) -> bool:
    return user.get("role_name") == "supervisor"

@router.get("")
async def list_logs(user: dict = Depends(get_current_user)):
    if not _is_supervisor(user):
        raise HTTPException(status_code=403, detail="bu ekranı görme yetkiniz yok")
        
    response = await rpc_client.call("crud_operations", {
        "action": "LIST_LOGS",
        "data": {},
    })
    if not response.get("success"):
        raise HTTPException(status_code=500, detail=response.get("payload"))
    return response.get("payload")
