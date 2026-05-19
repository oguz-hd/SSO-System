"""OpenAI Chat Completions istemcisi."""
import os
import httpx
from core.logging_config import logger

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")


def is_openai_configured() -> bool:
    return bool(OPENAI_API_KEY)


def get_model_name() -> str:
    return OPENAI_MODEL


async def chat_completion(
    messages: list[dict],
    max_tokens: int = 800,
    temperature: float = 0.7,
) -> dict:
    """
    OpenAI chat/completions çağrısı.
    Dönüş: {content, tokens_used, model}
    """
    if not is_openai_configured():
        raise ValueError("OPENAI_API_KEY ortam değişkeni tanımlı değil")

    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(
            f"{OPENAI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": OPENAI_MODEL,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
        )

    if response.status_code != 200:
        detail = response.text[:800]
        logger.error("OpenAI API %s: %s", response.status_code, detail)
        raise RuntimeError(f"OpenAI API hatası ({response.status_code}): {detail}")

    data = response.json()
    choice = data["choices"][0]["message"]["content"]
    logger.info("OpenAI yanıt: model=%s tokens=%s", data.get("model"), data.get("usage"))

    return {
        "content": choice,
        "tokens_used": data.get("usage", {}).get("total_tokens", 0),
        "model": data.get("model", OPENAI_MODEL),
    }
