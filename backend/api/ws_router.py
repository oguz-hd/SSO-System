from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
from core.logging_config import logger

router = APIRouter(prefix="/ws", tags=["websocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message, ensure_ascii=False))
            except Exception as e:
                logger.error(f"WebSocket broadcast hatası: {e}")
                dead_connections.append(connection)
        
        for conn in dead_connections:
            self.disconnect(conn)

manager = ConnectionManager()

@router.websocket("/notifications")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Sadece dinliyoruz
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
