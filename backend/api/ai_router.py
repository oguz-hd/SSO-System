from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header
from typing import Optional
import os
import uuid
from services.ai_service import process_txt_prompt, process_docx_to_grapesjs, get_ai_status, rag_query
from core.deps import get_current_user
from core.rabbitmq import rpc_client
from core.logging_config import logger

router = APIRouter(prefix="/ai", tags=["yapay zeka entegrasyonu & dosyalar"])

DEFAULT_EXTENSIONS = {"txt", "png", "jpg", "jpeg", "pdf", "docx", "word", "excel", "xlsx"}


def validate_file_extension(filename: str, allowed: set):
    ext = filename.split(".")[-1].lower()
    if ext == "doc":
        ext = "docx"
    if ext == "xls":
        ext = "xlsx"
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"dosya uzantısına '{ext}' izin verilmiyor. izinli: {', '.join(sorted(allowed))}",
        )
    return ext


def get_allowed_extensions(user: dict) -> set:
    merged = set(DEFAULT_EXTENSIONS)
    for p in user.get("permissions", []):
        exts = p.get("allowed_extensions")
        if exts:
            return set(exts)
    return merged


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    allowed = get_allowed_extensions(user)
    ext = validate_file_extension(file.filename, allowed)
    content = await file.read()
    max_mb = int(os.getenv("MAX_UPLOAD_MB", "10"))
    if len(content) > max_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"dosya boyutu {max_mb}MB sınırını aşıyor")

    logger.info("upload: %s by %s", file.filename, user.get("username"))

    if ext == "txt":
        try:
            text_content = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="geçersiz metin kodlaması")
        result = await process_txt_prompt(text_content)
        return {"status": "başarılı", "type": "prompt_çalıştırma", "data": result}

    if ext == "docx":
        temp_filename = f"temp_{uuid.uuid4()}.docx"
        with open(temp_filename, "wb") as f:
            f.write(content)
        try:
            result = await process_docx_to_grapesjs(temp_filename)
        finally:
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
        return {"status": "başarılı", "type": "grapesjs_bileşenleri", "data": result}

    return {
        "status": "başarılı",
        "message": f"dosya '{file.filename}' yüklendi.",
        "note": f"'{ext}' için genel depolama kaydı yapıldı.",
    }


@router.get("/status")
async def ai_status():
    """LLM yapılandırması (anahtar var mı, hangi model)."""
    return get_ai_status()


@router.post("/rag/query")
async def rag_query_endpoint(
    body: dict,
    user: dict = Depends(get_current_user),
):
    result = await rag_query(body.get("doc_id", "default"), body.get("question", ""))
    return {**result, "user": user.get("username")}
