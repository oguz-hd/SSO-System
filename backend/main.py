from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import asyncio

from core.database import get_db
from core.rabbitmq import rpc_client
from core.logging_config import logger
from models.domain import User
from api.ai_router import router as ai_router
from api.auth_router import router as auth_router
from api.permissions_router import router as permissions_router
from api.announcements_router import router as announcements_router
from api.mcp_router import router as mcp_router
from api.students_router import router as students_router
from api.assignments_router import router as assignments_router
from api.business_router import router as business_router
from api.ws_router import router as ws_router
from api.logs_router import router as logs_router
from api.designs_router import router as designs_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="yönetici paneli - api gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(permissions_router)
app.include_router(announcements_router)
app.include_router(mcp_router)
app.include_router(students_router)
app.include_router(ai_router)
app.include_router(assignments_router)
app.include_router(business_router)
app.include_router(ws_router)
app.include_router(logs_router)
app.include_router(designs_router)


@app.on_event("startup")
async def startup_event():
    await rpc_client.connect()
    logger.info("API gateway başlatıldı — RabbitMQ RPC istemcisi hazır")


@app.get("/health")
async def health_check():
    return {"status": "sağlıklı", "service": "api-gateway"}


@app.get("/users")
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return {
        "users": [
            {"id": u.id, "role_id": u.role_id, "value": u.value}
            for u in users
        ]
    }


@app.post("/users/rpc-create")
async def create_user_rpc(user_data: dict):
    response = await rpc_client.call("crud_operations", {
        "action": "CREATE_USER",
        "data": user_data,
    })
    if not response.get("success"):
        raise HTTPException(status_code=400, detail=response.get("payload"))
    return response
