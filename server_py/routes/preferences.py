"""
User preferences — display name, standing instructions, font, notifications.
Stored as a single row in the `user_preferences` table.
"""
from fastapi import APIRouter
from services.db import get_db

router = APIRouter()

DEFAULTS = {
    "full_name":            "",
    "preferred_name":       "",
    "instructions":         "",
    "chat_font":            "sans",
    "notify_on_complete":   False,
}


@router.get("")
def get_prefs():
    try:
        res = get_db().table("user_preferences").select("*").limit(1).execute()
        return res.data[0] if res.data else DEFAULTS
    except Exception:
        return DEFAULTS


@router.patch("")
def save_prefs(body: dict):
    allowed = {"full_name", "preferred_name", "instructions", "chat_font", "notify_on_complete"}
    update  = {k: v for k, v in body.items() if k in allowed}
    if not update:
        return {"ok": True}
    try:
        db  = get_db()
        res = db.table("user_preferences").select("id").limit(1).execute()
        if res.data:
            db.table("user_preferences").update(update).eq("id", res.data[0]["id"]).execute()
        else:
            db.table("user_preferences").insert(update).execute()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)[:120]}
