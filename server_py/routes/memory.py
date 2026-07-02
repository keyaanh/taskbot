from fastapi import APIRouter
from services.db import get_db

router = APIRouter()


@router.get("/")
def list_memory():
    res = get_db().table("memory_cards").select("*").eq("is_active", True).order("created_at", desc=True).execute()
    return res.data or []


@router.post("/extract")
async def extract_memory(body: dict):
    from services.ai import extract_facts
    chat_id = body.get("chat_id")
    db      = get_db()

    msgs  = db.table("messages").select("role,content").eq("chat_id", chat_id).order("created_at").execute()
    facts = await extract_facts(msgs.data or [])
    if not facts:
        return {"added": 0}

    existing     = db.table("memory_cards").select("fact").eq("is_active", True).execute()
    existing_set = {r["fact"].lower() for r in (existing.data or [])}
    novel        = [f for f in facts if f.lower() not in existing_set]

    if novel:
        db.table("memory_cards").insert(
            [{"fact": f, "source_chat_id": chat_id} for f in novel]
        ).execute()

    return {"added": len(novel)}


@router.delete("/{memory_id}")
def delete_memory(memory_id: str):
    get_db().table("memory_cards").update({"is_active": False}).eq("id", memory_id).execute()
    return {"ok": True}
