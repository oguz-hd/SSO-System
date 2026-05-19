"""MCP uyumlu basit tool sunucusu — dosya analizi ve RAG sorgusu."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any, Optional
from core.deps import get_current_user
from services.ai_service import process_txt_prompt, rag_query

router = APIRouter(prefix="/mcp", tags=["mcp"])


class ToolCallRequest(BaseModel):
    name: str
    arguments: dict = {}


TOOLS = [
    {
        "name": "analyze_document",
        "description": "Yüklenen metin veya prompt içeriğini analiz eder",
        "inputSchema": {
            "type": "object",
            "properties": {"text": {"type": "string"}},
            "required": ["text"],
        },
    },
    {
        "name": "rag_query",
        "description": "RAG indeksinden bağlamsal yanıt üretir",
        "inputSchema": {
            "type": "object",
            "properties": {
                "doc_id": {"type": "string"},
                "question": {"type": "string"},
            },
            "required": ["question"],
        },
    },
]


@router.get("/tools")
async def list_tools(_: dict = Depends(get_current_user)):
    return {"tools": TOOLS}


@router.post("/tools/call")
async def call_tool(body: ToolCallRequest, _: dict = Depends(get_current_user)):
    if body.name == "analyze_document":
        text = body.arguments.get("text", "")
        result = await process_txt_prompt(text)
        return {"content": [{"type": "text", "text": result.get("llm_output", "")}], "isError": False}
    if body.name == "rag_query":
        result = await rag_query(
            body.arguments.get("doc_id", "default"),
            body.arguments.get("question", ""),
        )
        text = result.get("answer", str(result)) if isinstance(result, dict) else result
        return {"content": [{"type": "text", "text": text}], "isError": False, "meta": result}
    return {"content": [{"type": "text", "text": f"Bilinmeyen tool: {body.name}"}], "isError": True}
