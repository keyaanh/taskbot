"""
API key management — POST /api/keys/validate, GET /api/keys, DELETE /api/keys/{provider}

Keys are Fernet-encrypted at rest. Raw key values are NEVER returned after saving.
"""
from typing import Optional
from fastapi import APIRouter
from services.db import get_db
from cryptography.fernet import Fernet
from datetime import datetime, timezone
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'), override=True)

router = APIRouter()

# ── Encryption helpers ────────────────────────────────────────────────────────

def _fernet():
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        raise RuntimeError("ENCRYPTION_KEY not set in .env")
    return Fernet(key.encode() if isinstance(key, str) else key)

def encrypt(raw: str) -> str:
    return _fernet().encrypt(raw.encode()).decode()

def decrypt(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()


# ── Friendly error parser ─────────────────────────────────────────────────────

def _friendly(e: Exception) -> str:
    m = str(e).lower()
    if any(w in m for w in ("invalid", "incorrect", "unauthori", "401", "api_key", "authentication_error", "auth")):
        return "Incorrect API key — double-check and try again"
    if any(w in m for w in ("rate limit", "429", "quota")):
        return "Rate limit hit — key looks valid, try again shortly"
    if any(w in m for w in ("permission", "403", "forbidden")):
        return "Permission denied — this key may not have the required access"
    if any(w in m for w in ("not found", "404", "no such model")):
        return "Model not found — key may not have access to this model tier"
    if any(w in m for w in ("connect", "timeout", "network", "resolve", "unreachable")):
        return "Could not reach the provider — check your internet connection"
    # Fallback: show first sentence only, no stack traces
    first = str(e).split("\n")[0].split(".")[0].strip()
    return first[:120] if first else "Validation failed — unknown error"


# ── Provider test calls ───────────────────────────────────────────────────────

async def _test_anthropic(key: str) -> tuple[bool, str]:
    import anthropic, asyncio
    try:
        client = anthropic.Anthropic(api_key=key)
        await asyncio.to_thread(
            client.messages.create,
            model="claude-haiku-4-5-20251001",
            max_tokens=1,
            messages=[{"role": "user", "content": "hi"}],
        )
        return True, ""
    except Exception as e:
        return False, _friendly(e)

async def _test_openai(key: str) -> tuple[bool, str]:
    try:
        import openai, asyncio
        client = openai.OpenAI(api_key=key)
        await asyncio.to_thread(
            client.chat.completions.create,
            model="gpt-4o-mini",
            max_tokens=1,
            messages=[{"role": "user", "content": "hi"}],
        )
        return True, ""
    except ImportError:
        return False, "OpenAI SDK not installed on this server"
    except Exception as e:
        return False, _friendly(e)

async def _test_google(key: str) -> tuple[bool, str]:
    try:
        import google.generativeai as genai, asyncio
        genai.configure(api_key=key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        await asyncio.to_thread(model.generate_content, "hi", generation_config={"max_output_tokens": 1})
        return True, ""
    except ImportError:
        return False, "Google Generative AI SDK not installed on this server"
    except Exception as e:
        return False, _friendly(e)

TESTERS = {
    "anthropic": _test_anthropic,
    "openai":    _test_openai,
    "google":    _test_google,
}


# ── Routes ────────────────────────────────────────────────────────────────────

PROVIDER_MODELS = {
    "anthropic": [
        {"id": "claude-sonnet-4-6",          "label": "Claude Sonnet 4.6",   "provider": "anthropic"},
        {"id": "claude-opus-4-5",            "label": "Claude Opus 4.5",     "provider": "anthropic"},
        {"id": "claude-haiku-4-5-20251001",  "label": "Claude Haiku 4.5",    "provider": "anthropic"},
    ],
    "openai": [
        {"id": "gpt-4o",       "label": "GPT-4o",       "provider": "openai"},
        {"id": "gpt-4o-mini",  "label": "GPT-4o mini",  "provider": "openai"},
    ],
    "google": [
        {"id": "gemini-1.5-pro",    "label": "Gemini 1.5 Pro",    "provider": "google"},
        {"id": "gemini-2.0-flash",  "label": "Gemini 2.0 Flash",  "provider": "google"},
    ],
}

@router.get("/models")
def list_available_models():
    """Return models for Anthropic (always) + any connected providers."""
    available = list(PROVIDER_MODELS["anthropic"])   # always available
    try:
        db  = get_db()
        res = db.table("api_keys").select("provider").eq("is_valid", True).execute()
        for row in (res.data or []):
            p = row["provider"]
            if p != "anthropic" and p in PROVIDER_MODELS:
                available.extend(PROVIDER_MODELS[p])
    except Exception:
        pass
    return available


@router.get("/")
def list_keys():
    """Return connected providers without raw keys."""
    try:
        db  = get_db()
        res = db.table("api_keys").select("provider,key_preview,is_valid,last_validated_at,created_at").eq("is_valid", True).execute()
        return res.data or []
    except Exception:
        return []   # graceful if table doesn't exist yet


@router.post("/validate")
async def validate_key(body: dict):
    provider = (body.get("provider") or "").lower()
    api_key  = (body.get("api_key")  or "").strip()

    if not provider or not api_key:
        return {"valid": False, "error": "provider and api_key are required"}
    if provider not in TESTERS:
        return {"valid": False, "error": f"Unsupported provider: {provider}"}

    valid, error = await TESTERS[provider](api_key)
    if not valid:
        return {"valid": False, "error": error}

    # Save encrypted
    try:
        db          = get_db()
        preview     = api_key[-6:]
        enc         = encrypt(api_key)
        now         = datetime.now(timezone.utc).isoformat()

        existing = db.table("api_keys").select("id").eq("provider", provider).execute()
        if existing.data:
            db.table("api_keys").update({
                "encrypted_key": enc, "key_preview": preview,
                "is_valid": True, "last_validated_at": now,
            }).eq("provider", provider).execute()
        else:
            db.table("api_keys").insert({
                "provider": provider, "encrypted_key": enc,
                "key_preview": preview, "is_valid": True, "last_validated_at": now,
            }).execute()

        return {"valid": True, "provider": provider, "key_preview": preview, "last_validated_at": now}
    except Exception as e:
        return {"valid": False, "error": f"DB error: {e}"}


@router.delete("/{provider}")
def delete_key(provider: str):
    try:
        get_db().table("api_keys").delete().eq("provider", provider).execute()
    except Exception:
        pass
    return {"ok": True}


# ── Helper used by ai.py to retrieve decrypted key ───────────────────────────

def get_decrypted_key(provider: str) -> Optional[str]:
    try:
        db  = get_db()
        res = db.table("api_keys").select("encrypted_key").eq("provider", provider).eq("is_valid", True).execute()
        if res.data:
            return decrypt(res.data[0]["encrypted_key"])
    except Exception:
        pass
    return None
