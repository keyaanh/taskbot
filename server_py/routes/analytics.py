from fastapi import APIRouter
from services.db import get_db
import pandas as pd
from datetime import datetime, timezone, timedelta

router = APIRouter()


@router.get("/")
def get_analytics():
    db    = get_db()
    msgs  = db.table("messages").select("role,token_count,created_at,chat_id").execute().data or []
    chats = db.table("chats").select("id,title,created_at,updated_at").execute().data or []
    cards = db.table("memory_cards").select("created_at").eq("is_active", True).execute().data or []

    if not msgs:
        return {"messages_per_day": [], "tokens_per_day": [], "role_split": {},
                "top_chats": [], "memory_growth": [], "total": {}, "calendar": []}

    df = pd.DataFrame(msgs)
    df["created_at"]  = pd.to_datetime(df["created_at"], utc=True)
    df["date"]        = df["created_at"].dt.date.astype(str)
    df["token_count"] = pd.to_numeric(df["token_count"], errors="coerce").fillna(0)

    messages_per_day = df.groupby("date").size().reset_index(name="count").to_dict(orient="records")

    tpd = df[df["role"] == "assistant"].groupby("date")["token_count"].sum().reset_index()
    tpd.columns = ["date", "tokens"]
    tokens_per_day = tpd.to_dict(orient="records")

    role_split = df["role"].value_counts().to_dict()

    chat_df = df.groupby("chat_id").size().reset_index(name="msg_count")
    chat_titles = {c["id"]: c["title"] for c in chats}
    chat_df["title"] = chat_df["chat_id"].map(chat_titles).fillna("Untitled")
    top_chats = chat_df.nlargest(5, "msg_count")[["title", "msg_count"]].to_dict(orient="records")

    if cards:
        cdf = pd.DataFrame(cards)
        cdf["created_at"] = pd.to_datetime(cdf["created_at"], utc=True)
        cdf["date"]       = cdf["created_at"].dt.date.astype(str)
        mg = cdf.groupby("date").size().cumsum().reset_index(name="total")
        memory_growth = mg.to_dict(orient="records")
    else:
        memory_growth = []

    total = {
        "messages":     len(df),
        "chats":        len(chats),
        "tokens":       int(df["token_count"].sum()),
        "memory_cards": len(cards),
    }

    today    = datetime.now(timezone.utc).date()
    start    = today - timedelta(days=111)
    all_days = pd.date_range(start=start, end=today, freq="D")
    act_map  = df.groupby("date").size().to_dict()
    calendar = [{"date": str(d.date()), "count": int(act_map.get(str(d.date()), 0))}
                for d in all_days]

    return {
        "messages_per_day": messages_per_day,
        "tokens_per_day":   tokens_per_day,
        "role_split":       role_split,
        "top_chats":        top_chats,
        "memory_growth":    memory_growth,
        "total":            total,
        "calendar":         calendar,
    }
