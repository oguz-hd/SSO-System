from fastapi import Depends, HTTPException, Header
from typing import Optional
from core.redis_client import get_session


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="oturum gerekli")
    token = authorization.replace("Bearer ", "").strip()
    session = await get_session(token)
    if not session:
        raise HTTPException(status_code=401, detail="oturum süresi dolmuş")
    return session


async def require_supervisor(user: dict = Depends(get_current_user)) -> dict:
    role_name = user.get("role_name", "")
    if role_name not in ("supervisor", "admin"):
        raise HTTPException(status_code=403, detail="süpervizör yetkisi gerekli")
    return user
