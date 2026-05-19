from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from core.deps import get_current_user
from core.rabbitmq import rpc_client
from core.logging_config import logger

router = APIRouter(prefix="/business_jobs", tags=["iş ilanları"])

class BusinessJobCreate(BaseModel):
    company: str
    position: str
    duration: Optional[str] = "belirsiz"
    deadline: Optional[str] = "belirsiz"
    type: Optional[str] = "iş"

def _can_write(user: dict, screen: str = "business") -> bool:
    for p in user.get("permissions", []):
        if p.get("screen") == screen and p.get("can_write"):
            return True
    return False

@router.get("")
async def list_business_jobs(user: dict = Depends(get_current_user)):
    response = await rpc_client.call("crud_operations", {
        "action": "LIST_BUSINESS_JOBS",
        "data": {},
    })
    if not response.get("success"):
        raise HTTPException(status_code=500, detail=response.get("payload"))
    return response.get("payload")

@router.post("")
async def create_business_job(
    body: BusinessJobCreate,
    user: dict = Depends(get_current_user),
):
    if not _can_write(user):
        raise HTTPException(status_code=403, detail="yazma yetkiniz yok")
    response = await rpc_client.call("crud_operations", {
        "action": "CREATE_BUSINESS_JOB",
        "data": body.model_dump(),
    })
    if not response.get("success"):
        raise HTTPException(status_code=400, detail=response.get("payload"))
    logger.info("business job created by %s", user.get("username"))
    return response.get("payload")

@router.delete("/{job_id}")
async def delete_business_job(
    job_id: int,
    user: dict = Depends(get_current_user),
):
    can_delete = any(
        p.get("screen") == "business" and p.get("can_delete")
        for p in user.get("permissions", [])
    )
    if not can_delete:
        raise HTTPException(status_code=403, detail="silme yetkiniz yok")
    response = await rpc_client.call("crud_operations", {
        "action": "DELETE_BUSINESS_JOB",
        "data": {"id": job_id},
    })
    if not response.get("success"):
        raise HTTPException(status_code=400, detail=response.get("payload"))
    return response.get("payload")
