from fastapi import APIRouter, Depends, HTTPException
from core.deps import get_current_user
from core.rabbitmq import rpc_client

router = APIRouter(prefix="/students", tags=["öğrenci listesi"])


@router.get("")
async def list_students(user: dict = Depends(get_current_user)):
    can_read = any(
        p.get("screen") == "student_list" and p.get("can_read")
        for p in user.get("permissions", [])
    )
    if not can_read:
        raise HTTPException(status_code=403, detail="öğrenci listesi yetkiniz yok")
    response = await rpc_client.call("crud_operations", {
        "action": "LIST_STUDENTS",
        "data": {},
    })
    if not response.get("success"):
        raise HTTPException(status_code=500, detail=response.get("payload"))
    return response.get("payload")
