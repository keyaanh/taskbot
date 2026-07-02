"""
OAuth connections for Google Calendar, Gmail, Notion, Slack.

Routes:
  GET  /api/connections                       — list connected providers (no raw tokens)
  GET  /api/connections/oauth/{provider}      — start OAuth popup flow
  GET  /api/connections/callback/{provider}   — receive OAuth code, exchange + save tokens
  POST /api/connections/{provider}/refresh    — force token refresh
  DELETE /api/connections/{provider}          — disconnect
"""
from typing import Optional
from fastapi import APIRouter
from fastapi.responses import HTMLResponse, RedirectResponse
from cryptography.fernet import Fernet
from datetime import datetime, timezone, timedelta
from services.db import get_db
from dotenv import load_dotenv
import httpx, os, urllib.parse

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'), override=True)

router   = APIRouter()
BASE_URL = os.getenv("OAUTH_REDIRECT_BASE", "http://localhost:3001")
FRONT_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


# ── Encryption (reuses same ENCRYPTION_KEY as api_keys) ──────────────────────

def _fernet() -> Fernet:
    k = os.getenv("ENCRYPTION_KEY", "")
    if not k:
        raise RuntimeError("ENCRYPTION_KEY not set")
    return Fernet(k.encode() if isinstance(k, str) else k)

def enc(s: str) -> str:  return _fernet().encrypt(s.encode()).decode()
def dec(s: str) -> str:  return _fernet().decrypt(s.encode()).decode()


# ── Provider configuration ────────────────────────────────────────────────────

PROVIDERS = {
    "google_calendar": {
        "label":      "Google Calendar",
        "auth_url":   "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url":  "https://oauth2.googleapis.com/token",
        "client_id":  lambda: os.getenv("GOOGLE_CLIENT_ID", ""),
        "client_secret": lambda: os.getenv("GOOGLE_CLIENT_SECRET", ""),
        "scope": "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
        "uses_refresh": True,
    },
    "gmail": {
        "label":     "Gmail",
        "auth_url":  "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "client_id":     lambda: os.getenv("GOOGLE_CLIENT_ID", ""),
        "client_secret": lambda: os.getenv("GOOGLE_CLIENT_SECRET", ""),
        "scope": "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose",
        "uses_refresh": True,
    },
    "notion": {
        "label":     "Notion",
        "auth_url":  "https://api.notion.com/v1/oauth/authorize",
        "token_url": "https://api.notion.com/v1/oauth/token",
        "client_id":     lambda: os.getenv("NOTION_CLIENT_ID", ""),
        "client_secret": lambda: os.getenv("NOTION_CLIENT_SECRET", ""),
        "scope":         "",     # Notion uses no scope param
        "uses_refresh":  False,
    },
    "slack": {
        "label":     "Slack",
        "auth_url":  "https://slack.com/oauth/v2/authorize",
        "token_url": "https://slack.com/api/oauth.v2.access",
        "client_id":     lambda: os.getenv("SLACK_CLIENT_ID", ""),
        "client_secret": lambda: os.getenv("SLACK_CLIENT_SECRET", ""),
        "scope": "channels:read,channels:history,chat:write,search:read",
        "uses_refresh": False,
    },
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _callback_url(provider: str) -> str:
    return f"{BASE_URL}/api/connections/callback/{provider}"

def _popup_close(provider: str, success: bool, error: str = "") -> HTMLResponse:
    """Returns an HTML page that posts a message to the opener then closes itself."""
    if success:
        msg = f"{{type:'oauth_success',provider:'{provider}'}}"
        body_html = "<p style='font-family:sans-serif;color:#10b981;text-align:center;margin-top:40px'>✓ Connected! Closing…</p>"
    else:
        msg = f"{{type:'oauth_error',provider:'{provider}',error:{repr(error)}}}"
        body_html = f"<p style='font-family:sans-serif;color:#ef4444;text-align:center;margin-top:40px'>Error: {error}<br><small>You can close this window.</small></p>"
    html = f"""<!DOCTYPE html><html><body>{body_html}<script>
(function(){{
  try{{window.opener.postMessage({msg},'*');}}catch(e){{}}
  setTimeout(function(){{
    try{{window.close();}}catch(e){{}}
  }}, 800);
}})();
</script></body></html>"""
    return HTMLResponse(html)

def _save_tokens(provider: str, access: str, refresh: Optional[str],
                 expires_in: Optional[int], scope: Optional[str]):
    db  = get_db()
    now = datetime.now(timezone.utc)
    exp = (now + timedelta(seconds=expires_in)).isoformat() if expires_in else None
    row = {
        "provider":      provider,
        "access_token":  enc(access),
        "refresh_token": enc(refresh) if refresh else None,
        "expires_at":    exp,
        "scope":         scope,
        "connected_at":  now.isoformat(),
        "status":        "connected",
    }
    existing = db.table("mcp_connections").select("id").eq("provider", provider).execute()
    if existing.data:
        db.table("mcp_connections").update(row).eq("provider", provider).execute()
    else:
        db.table("mcp_connections").insert(row).execute()


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
def list_connections():
    """Return connected providers — no raw tokens."""
    try:
        res = get_db().table("mcp_connections").select(
            "provider,scope,connected_at,expires_at,status"
        ).execute()
        return res.data or []
    except Exception:
        return []


@router.get("/oauth/{provider}")
def start_oauth(provider: str):
    """Redirect to provider's OAuth consent screen."""
    cfg = PROVIDERS.get(provider)
    if not cfg:
        return HTMLResponse(f"Unknown provider: {provider}", status_code=400)

    cid = cfg["client_id"]()
    if not cid:
        return HTMLResponse(
            f"<h3>{cfg['label']} OAuth not configured</h3>"
            f"<p>Add {provider.upper().replace('_','')} client credentials to .env first.</p>",
            status_code=503)

    params = {
        "client_id":     cid,
        "redirect_uri":  _callback_url(provider),
        "response_type": "code",
        "access_type":   "offline" if cfg["uses_refresh"] else "online",
        "prompt":        "consent" if cfg["uses_refresh"] else "select_account",
    }
    if cfg["scope"]:
        params["scope"] = cfg["scope"]

    # Notion uses owner=user
    if provider == "notion":
        params["owner"] = "user"
        params.pop("access_type", None)
        params.pop("prompt", None)

    url = cfg["auth_url"] + "?" + urllib.parse.urlencode(params)
    return RedirectResponse(url)


@router.get("/callback/{provider}")
async def oauth_callback(provider: str, code: str = "", error: str = ""):
    cfg = PROVIDERS.get(provider)
    if not cfg:
        return _popup_close(provider, False, "Unknown provider")
    if error:
        return _popup_close(provider, False, error)
    if not code:
        return _popup_close(provider, False, "No authorization code received")

    # Exchange code for tokens
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            if provider == "notion":
                # Notion uses HTTP Basic auth
                import base64
                cred = base64.b64encode(
                    f"{cfg['client_id']()}:{cfg['client_secret']()}".encode()
                ).decode()
                r = await client.post(cfg["token_url"],
                    headers={"Authorization": f"Basic {cred}",
                             "Content-Type": "application/json"},
                    json={"grant_type": "authorization_code",
                          "code": code,
                          "redirect_uri": _callback_url(provider)})
            elif provider == "slack":
                r = await client.post(cfg["token_url"], data={
                    "client_id":     cfg["client_id"](),
                    "client_secret": cfg["client_secret"](),
                    "code":          code,
                    "redirect_uri":  _callback_url(provider),
                })
            else:
                r = await client.post(cfg["token_url"], data={
                    "code":          code,
                    "client_id":     cfg["client_id"](),
                    "client_secret": cfg["client_secret"](),
                    "redirect_uri":  _callback_url(provider),
                    "grant_type":    "authorization_code",
                })

        data = r.json()

        # Extract tokens (Slack nests under authed_user for user tokens)
        if provider == "slack":
            user_data   = data.get("authed_user", {})
            access_token = user_data.get("access_token") or data.get("access_token")
            refresh_token = None
            expires_in   = None
            scope        = user_data.get("scope") or data.get("scope")
        else:
            access_token  = data.get("access_token")
            refresh_token = data.get("refresh_token")
            expires_in    = data.get("expires_in")
            scope         = data.get("scope")

        if not access_token:
            err = data.get("error_description") or data.get("error") or "No access token returned"
            return _popup_close(provider, False, err)

        try:
            _save_tokens(provider, access_token, refresh_token, expires_in, scope)
        except Exception as save_err:
            return _popup_close(provider, False, f"Token save failed: {str(save_err)[:100]}")
        return _popup_close(provider, True)

    except Exception as e:
        return _popup_close(provider, False, str(e)[:120])


@router.post("/{provider}/refresh")
async def refresh_token(provider: str):
    cfg = PROVIDERS.get(provider)
    if not cfg or not cfg["uses_refresh"]:
        return {"ok": False, "error": "Provider does not support refresh"}
    try:
        db  = get_db()
        row = db.table("mcp_connections").select("refresh_token").eq("provider", provider).execute()
        if not row.data or not row.data[0].get("refresh_token"):
            return {"ok": False, "error": "No refresh token stored"}

        rt = dec(row.data[0]["refresh_token"])
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(cfg["token_url"], data={
                "client_id":     cfg["client_id"](),
                "client_secret": cfg["client_secret"](),
                "refresh_token": rt,
                "grant_type":    "refresh_token",
            })
        data = r.json()
        new_access = data.get("access_token")
        if not new_access:
            db.table("mcp_connections").update({"status": "expired"}).eq("provider", provider).execute()
            return {"ok": False, "error": "Refresh failed — please reconnect"}

        _save_tokens(provider, new_access,
                     data.get("refresh_token") or rt,
                     data.get("expires_in"), data.get("scope"))
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)[:120]}


@router.delete("/{provider}")
def disconnect(provider: str):
    try:
        get_db().table("mcp_connections").delete().eq("provider", provider).execute()
    except Exception:
        pass
    return {"ok": True}


# ── Used by ai.py ─────────────────────────────────────────────────────────────

def get_live_token(provider: str) -> Optional[str]:
    """
    Return a valid (possibly refreshed) decrypted access token.
    Returns None if not connected or refresh failed.
    """
    try:
        db  = get_db()
        row = db.table("mcp_connections").select(
            "access_token,refresh_token,expires_at,status"
        ).eq("provider", provider).execute()
        if not row.data:
            return None
        rec = row.data[0]
        if rec["status"] != "connected":
            return None

        # Check expiry — refresh 60 s early
        if rec.get("expires_at"):
            exp = datetime.fromisoformat(rec["expires_at"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) >= exp - timedelta(seconds=60):
                # Synchronous refresh attempt
                import asyncio
                cfg = PROVIDERS.get(provider, {})
                if cfg.get("uses_refresh") and rec.get("refresh_token"):
                    rt = dec(rec["refresh_token"])
                    try:
                        resp = httpx.post(cfg["token_url"], data={
                            "client_id":     cfg["client_id"](),
                            "client_secret": cfg["client_secret"](),
                            "refresh_token": rt,
                            "grant_type":    "refresh_token",
                        }, timeout=8)
                        d = resp.json()
                        if d.get("access_token"):
                            _save_tokens(provider, d["access_token"],
                                         d.get("refresh_token") or rt,
                                         d.get("expires_in"), d.get("scope"))
                            return d["access_token"]
                    except Exception:
                        pass
                    db.table("mcp_connections").update({"status": "expired"}).eq("provider", provider).execute()
                    return None

        return dec(rec["access_token"])
    except Exception:
        return None
