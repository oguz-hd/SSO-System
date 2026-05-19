import os
import asyncio
import uuid
from docx import Document
from core.redis_client import rag_store, rag_get
from core.logging_config import logger
from services.openai_client import (
    is_openai_configured,
    get_model_name,
    chat_completion,
)

SYSTEM_RAG = (
    "Sen bir üniversite bilgi yönetim portalı yapay zeka asistanısın. "
    "Yanıtlarını yalnızca verilen bağlam metnine dayandır. "
    "Bağlamda olmayan bilgileri uydurma. Türkçe ve net yanıt ver."
)

SYSTEM_PROMPT = (
    "Sen bir üniversite portalı yapay zeka asistanısın. "
    "Kullanıcının TXT dosyasından gelen metni veya prompt komutlarını analiz edip "
    "Türkçe, yapılandırılmış ve yardımcı bir yanıt üret."
)


async def process_txt_prompt(prompt_text: str, doc_id: str | None = None) -> dict:
    """TXT prompt işleme + RAG indeksleme + OpenAI LLM."""
    chunks = _chunk_text(prompt_text)
    did = doc_id or str(uuid.uuid4())
    await rag_store(did, chunks)
    await rag_store("default", chunks)

    if is_openai_configured():
        try:
            result = await chat_completion(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            f"Aşağıdaki metin/prompt dosyasından gelen içeriği işle:\n\n"
                            f"{prompt_text[:12000]}"
                        ),
                    },
                ],
                max_tokens=1000,
            )
            return {
                "original_prompt": prompt_text[:500],
                "llm_output": result["content"],
                "doc_id": did,
                "tokens_used": result["tokens_used"],
                "model": result["model"],
                "source": "openai",
                "rag_chunks": len(chunks),
            }
        except Exception as e:
            logger.exception("OpenAI TXT işleme hatası")
            return {
                "original_prompt": prompt_text[:500],
                "llm_output": f"OpenAI isteği başarısız: {e}",
                "doc_id": did,
                "source": "error",
                "error": str(e),
                "rag_chunks": len(chunks),
            }

    await asyncio.sleep(0.3)
    simulated = (
        f"[Simülasyon modu] OPENAI_API_KEY tanımlı değil. "
        f"İndekslenen parça: {len(chunks)}. doc_id={did}. "
        f"Metin özeti: '{prompt_text[:120]}...'"
    )
    return {
        "original_prompt": prompt_text[:500],
        "llm_output": simulated,
        "doc_id": did,
        "tokens_used": len(prompt_text.split()),
        "source": "simulation",
        "rag_chunks": len(chunks),
    }


async def rag_query(doc_id: str, question: str) -> dict:
    """RAG: Redis chunk + OpenAI bağlamlı yanıt."""
    chunks = await rag_get(doc_id)
    if not chunks:
        chunks = await rag_get("default")

    if not chunks:
        return {
            "answer": (
                f"'{question}' için henüz indekslenmiş belge yok. "
                "Önce bir .txt dosyası yükleyin veya Tasarım/Ödev merkezinden metin gönderin."
            ),
            "source": "local",
            "model": None,
        }

    context = "\n\n---\n\n".join(chunks[:8])

    if is_openai_configured():
        try:
            result = await chat_completion(
                messages=[
                    {"role": "system", "content": SYSTEM_RAG},
                    {
                        "role": "user",
                        "content": f"Bağlam:\n{context[:14000]}\n\nKullanıcı sorusu: {question}",
                    },
                ],
                max_tokens=700,
            )
            return {
                "answer": result["content"],
                "source": "openai",
                "model": result["model"],
                "tokens_used": result["tokens_used"],
                "context_chunks": len(chunks),
            }
        except Exception as e:
            logger.exception("OpenAI RAG hatası")
            return {
                "answer": f"OpenAI RAG hatası: {e}",
                "source": "error",
                "model": get_model_name(),
                "error": str(e),
            }

    relevant = [
        c for c in chunks
        if any(w in c.lower() for w in question.lower().split()[:5] if len(w) > 2)
    ]
    snippet = "\n".join(relevant[:3]) if relevant else chunks[0]
    return {
        "answer": (
            f"[Simülasyon] Soru: {question}\n\n"
            f"Bağlamdan bulunan metin:\n{snippet[:600]}...\n\n"
            f"(Gerçek LLM için .env dosyasına OPENAI_API_KEY ekleyin.)"
        ),
        "source": "simulation",
        "model": None,
        "context_chunks": len(chunks),
    }


def get_ai_status() -> dict:
    return {
        "llm_enabled": is_openai_configured(),
        "provider": "openai" if is_openai_configured() else "simulation",
        "model": get_model_name() if is_openai_configured() else None,
    }


def _chunk_text(text: str, size: int = 400) -> list[str]:
    words = text.split()
    chunks = []
    current = []
    length = 0
    for w in words:
        if length + len(w) > size and current:
            chunks.append(" ".join(current))
            current = [w]
            length = len(w)
        else:
            current.append(w)
            length += len(w) + 1
    if current:
        chunks.append(" ".join(current))
    return chunks or [text[:size]]


async def process_docx_to_grapesjs(file_path: str) -> list:
    doc = await asyncio.to_thread(Document, file_path)
    components = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        if para.style.name.startswith("Heading"):
            level = para.style.name[-1] if para.style.name[-1].isdigit() else "1"
            components.append({
                "type": "text",
                "tagName": f"h{level}",
                "content": text,
                "classes": [f"custom-heading-{level}"],
            })
        else:
            components.append({
                "type": "text",
                "tagName": "p",
                "content": text,
                "classes": ["custom-paragraph"],
            })
    return [{
        "type": "default",
        "tagName": "div",
        "classes": ["docx-converted-container", "p-4"],
        "components": components,
    }]
