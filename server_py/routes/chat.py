from typing import Optional
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from services.db import get_db
from services.ai import stream_chat, generate_summary, compress_context
from services.memory_recall import build_system
from datetime import datetime, timezone
import json

router = APIRouter()

SUMMARIZE_THRESHOLD = 10
RECENT_WINDOW       = 6
RESUMMARY_INTERVAL  = 4


def build_messages(history, content, quoted_text, file):
    msgs = [{"role": m["role"], "content": m["content"]}
            for m in history if m.get("content", "").strip()]

    user_text = f"> {quoted_text}\n\n{content}" if quoted_text else (content or "")

    if file and file.get("base64") and file.get("mimetype", "").startswith("image/"):
        msgs.append({"role": "user", "content": [
            {"type": "image", "source": {"type": "base64",
             "media_type": file["mimetype"], "data": file["base64"]}},
            {"type": "text", "text": user_text or "What's in this image?"},
        ]})
    else:
        msgs.append({"role": "user", "content": user_text or "Please analyze this."})
    return msgs


@router.post("/send")
async def send_message(body: dict):
    content     = body.get("content", "")
    chat_id     = body.get("chat_id")
    quoted_text = body.get("quoted_text")
    file        = body.get("file")
    history     = body.get("messages", [])
    mode        = body.get("mode")
    model       = body.get("model")          # forwarded from settings

    if not content.strip() and not file:
        return {"error": "Empty message"}, 400

    db = get_db()

    # ── Document context ──────────────────────────────────────────────────
    doc_context = None
    if file and file.get("extractedText") and chat_id:
        db.table("chats").update({"document_context": file["extractedText"]}).eq("id", chat_id).execute()
        doc_context = file["extractedText"]
    elif chat_id:
        res = db.table("chats").select("document_context").eq("id", chat_id).execute()
        if res.data:
            doc_context = res.data[0].get("document_context")

    # ── Memory — always inject active facts so Claude always knows them ───────
    try:
        res = db.table("memory_cards").select("fact").eq("is_active", True).execute()
        memory_cards = res.data or []
    except Exception:
        memory_cards = []

    # ── Smart context compression ──────────────────────────────────────────
    context_summary = None
    api_history     = history

    if chat_id and len(history) > SUMMARIZE_THRESHOLD:
        older  = history[:-RECENT_WINDOW]
        recent = history[-RECENT_WINDOW:]

        res = db.table("chats").select("context_summary,summary_msg_count").eq("id", chat_id).execute()
        existing_summary  = res.data[0].get("context_summary")    if res.data else None
        summary_msg_count = res.data[0].get("summary_msg_count")  if res.data else 0

        if not existing_summary or (len(older) - (summary_msg_count or 0)) >= RESUMMARY_INTERVAL:
            context_summary = await compress_context(older)
            db.table("chats").update({
                "context_summary": context_summary,
                "summary_msg_count": len(older),
            }).eq("id", chat_id).execute()
        else:
            context_summary = existing_summary

        api_history = recent

    # ── User preferences (name + standing instructions) ────────────────────
    try:
        pref_res   = db.table("user_preferences").select("preferred_name,instructions").limit(1).execute()
        user_prefs = pref_res.data[0] if pref_res.data else {}
    except Exception:
        user_prefs = {}

    # ── Build prompt ───────────────────────────────────────────────────────
    system   = build_system(doc_context=doc_context, memory_cards=memory_cards,
                            mode=mode, context_summary=context_summary, user_prefs=user_prefs)
    messages = build_messages(api_history, content, quoted_text, file)

    # ── Stream ─────────────────────────────────────────────────────────────
    async def event_stream():
        full_content = ""
        token_count  = 0
        sources      = None
        tool_calls   = []

        async for chunk in stream_chat(messages, system, mode=mode, model=model):
            yield chunk
            if chunk.startswith("data: ") and "[DONE]" not in chunk:
                try:
                    data = json.loads(chunk[6:].strip())
                    if data.get("text"):       full_content += data["text"]
                    if data.get("done"):       token_count   = data.get("tokens", 0)
                    if data.get("sources"):    sources       = data["sources"]
                    if data.get("tool_result"): tool_calls.append(data["tool_result"])
                except Exception:
                    pass

        if chat_id and full_content:
            exists = db.table("chats").select("id").eq("id", chat_id).execute()
            if not exists.data:
                db.table("chats").insert({"id": chat_id,
                    "title": content[:45] or "New Chat"}).execute()

            saved = content or f"[File: {file.get('name', 'attachment')}]"
            asst_row = {"chat_id": chat_id, "role": "assistant",
                        "content": full_content, "token_count": token_count}
            if sources:                      # only include once migration adds the column
                asst_row["sources"] = sources
            if tool_calls:                   # only include once migration adds the column
                asst_row["tool_calls"] = tool_calls
            db.table("messages").insert([
                {"chat_id": chat_id, "role": "user", "content": saved, "quoted_text": quoted_text},
                asst_row,
            ]).execute()
            db.table("chats").update(
                {"updated_at": datetime.now(timezone.utc).isoformat()}
            ).eq("id", chat_id).execute()

    return StreamingResponse(event_stream(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no",
    })


@router.get("/list")
def list_chats():
    db    = get_db()
    chats = db.table("chats").select("*").order("updated_at", desc=True).limit(50).execute().data or []
    if not chats:
        return []
    chat_ids   = [c["id"] for c in chats]
    msgs       = db.table("messages").select("chat_id").in_("chat_id", chat_ids).execute().data or []
    active_ids = {m["chat_id"] for m in msgs}
    return [c for c in chats if c["id"] in active_ids][:15]


@router.get("/{chat_id}/messages")
def get_messages(chat_id: str):
    res = get_db().table("messages").select("*").eq("chat_id", chat_id).order("created_at").execute()
    return res.data or []


@router.delete("/{chat_id}")
def delete_chat(chat_id: str):
    db = get_db()
    db.table("messages").delete().eq("chat_id", chat_id).execute()
    db.table("chats").delete().eq("id", chat_id).execute()
    return {"ok": True}


@router.get("/{chat_id}/summary")
async def get_summary(chat_id: str):
    db   = get_db()
    chat = db.table("chats").select("summary").eq("id", chat_id).execute()
    if chat.data and chat.data[0].get("summary"):
        return {"summary": chat.data[0]["summary"]}
    msgs    = db.table("messages").select("role,content").eq("chat_id", chat_id).order("created_at").execute()
    summary = await generate_summary(msgs.data or [])
    db.table("chats").update({"summary": summary}).eq("id", chat_id).execute()
    return {"summary": summary}


@router.patch("/{chat_id}/title")
def update_title(chat_id: str, body: dict):
    get_db().table("chats").update({"title": body.get("title", "")}).eq("id", chat_id).execute()
    return {"ok": True}
