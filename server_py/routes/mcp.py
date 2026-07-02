"""
MCP server management.
GET    /api/mcp          — list servers
POST   /api/mcp          — add + test + sync tools
PATCH  /api/mcp/{id}     — enable/disable
DELETE /api/mcp/{id}     — remove
POST   /api/mcp/{id}/sync — re-fetch tool list from server
"""
from typing import Optional
import httpx
from fastapi import APIRouter
from services.db import get_db
from datetime import datetime, timezone
import json

router = APIRouter()
TIMEOUT = 8   # seconds for MCP discovery requests
CALL_TIMEOUT = 30  # seconds for MCP tool execution requests
MCP_PROTOCOL_VERSION = "2025-06-18"


# ── Real MCP transport (Streamable HTTP, per spec) ────────────────────────────
#
# A spec-compliant MCP server requires a session handshake before any other
# call: POST "initialize" -> POST "notifications/initialized" -> then the
# server accepts "tools/list" / "tools/call". Responses may come back as
# plain JSON or as a single-event SSE stream ("text/event-stream"), and the
# server may hand back a session id via the "Mcp-Session-Id" response header
# that must be echoed on subsequent requests. The *user-supplied URL is the
# literal endpoint* (e.g. ".../mcp" or ".../sse") — it is not a base path to
# append routes to.

def _parse_mcp_body(resp: httpx.Response) -> dict:
    """Parse a JSON-RPC response that may be plain JSON or one SSE event."""
    ctype = resp.headers.get("content-type", "")
    if "text/event-stream" in ctype:
        for line in resp.text.splitlines():
            line = line.strip()
            if line.startswith("data:"):
                try:
                    return json.loads(line[len("data:"):].strip())
                except Exception:
                    continue
        return {}
    try:
        return resp.json()
    except Exception:
        return {}


async def _mcp_rpc(client: httpx.AsyncClient, url: str, method: str,
                    params: Optional[dict], session_id: Optional[str],
                    notification: bool = False) -> tuple[dict, Optional[str]]:
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if session_id:
        headers["Mcp-Session-Id"] = session_id
    body = {"jsonrpc": "2.0", "method": method}
    if params is not None:
        body["params"] = params
    if not notification:
        body["id"] = 1
    r = await client.post(url, json=body, headers=headers)
    new_session = r.headers.get("Mcp-Session-Id", session_id)
    if notification:
        return {}, new_session
    return _parse_mcp_body(r), new_session


async def _mcp_handshake(client: httpx.AsyncClient, url: str) -> tuple[Optional[str], Optional[str]]:
    """Run initialize -> notifications/initialized. Returns (session_id, error)."""
    data, session_id = await _mcp_rpc(client, url, "initialize", {
        "protocolVersion": MCP_PROTOCOL_VERSION,
        "capabilities": {},
        "clientInfo": {"name": "taskbot", "version": "1.0"},
    }, session_id=None)
    if data.get("error"):
        return None, data["error"].get("message", "initialize failed")
    if not data.get("result"):
        return None, "no response to initialize"
    try:
        await _mcp_rpc(client, url, "notifications/initialized", {}, session_id, notification=True)
    except Exception:
        pass
    return session_id, None


# ── Tool discovery ────────────────────────────────────────────────────────────

async def fetch_tools(url: str) -> list:
    """
    Discover tools from an MCP server. The given URL is treated as the literal
    MCP endpoint and a full protocol handshake is performed first (works with
    any spec-compliant remote MCP server). Falls back to a couple of simpler,
    legacy conventions for lightweight/non-standard test servers.
    """
    url = url.strip()
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        # 1. Real MCP handshake against the URL as given
        try:
            session_id, err = await _mcp_handshake(client, url)
            if err is None:
                data, _ = await _mcp_rpc(client, url, "tools/list", {}, session_id)
                tools = (data.get("result") or {}).get("tools", [])
                if tools:
                    return tools
        except Exception:
            pass

        # 2. Legacy fallback: bare JSON-RPC tools/list, no handshake (some
        #    simple/non-compliant servers skip the session entirely)
        base = url.rstrip("/")
        for endpoint in (url, f"{base}/mcp"):
            try:
                r = await client.post(endpoint, json={
                    "jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}
                }, headers={"Accept": "application/json, text/event-stream"})
                if r.status_code == 200:
                    data = _parse_mcp_body(r)
                    tools = (data.get("result") or {}).get("tools", [])
                    if tools:
                        return tools
            except Exception:
                pass

        # 3. Legacy fallback: simple REST /tools endpoint
        try:
            r = await client.get(f"{base}/tools")
            if r.status_code == 200:
                data = r.json()
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and "tools" in data:
                    return data["tools"]
        except Exception:
            pass

    return []


async def call_tool(server_url: str, tool_name: str, tool_input: dict) -> str:
    """
    Execute a tool on an MCP server and return the result as a string.
    Performs a full handshake against spec-compliant servers, with the same
    legacy fallbacks as fetch_tools() for non-standard test servers.
    """
    url = server_url.strip()
    async with httpx.AsyncClient(timeout=CALL_TIMEOUT) as client:
        # 1. Real MCP handshake + tools/call
        try:
            session_id, err = await _mcp_handshake(client, url)
            if err is None:
                data, _ = await _mcp_rpc(client, url, "tools/call", {
                    "name": tool_name, "arguments": tool_input,
                }, session_id)
                if data.get("error"):
                    return f"[Tool {tool_name} error: {data['error'].get('message', 'unknown')}]"
                result = data.get("result")
                if result is not None:
                    content = result.get("content", [])
                    if isinstance(content, list) and content:
                        return "\n".join(c.get("text", str(c)) for c in content)
                    return str(result)
        except Exception:
            pass

        # 2. Legacy fallback: bare JSON-RPC tools/call, no handshake
        base = url.rstrip("/")
        for endpoint in (url, f"{base}/mcp"):
            try:
                r = await client.post(endpoint, json={
                    "jsonrpc": "2.0", "id": 1, "method": "tools/call",
                    "params": {"name": tool_name, "arguments": tool_input}
                }, headers={"Accept": "application/json, text/event-stream"})
                if r.status_code == 200:
                    data = _parse_mcp_body(r)
                    result = data.get("result", {})
                    content = result.get("content", [])
                    if isinstance(content, list) and content:
                        return "\n".join(c.get("text", str(c)) for c in content)
                    if result:
                        return str(result)
            except Exception:
                pass

        # 3. Legacy fallback: simple REST POST /tools/{name}
        try:
            r = await client.post(f"{base}/tools/{tool_name}", json=tool_input)
            if r.status_code == 200:
                data = r.json()
                return data.get("result", str(data))
        except Exception:
            pass

    return f"[Tool {tool_name} call failed]"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
def list_servers():
    try:
        db  = get_db()
        res = db.table("mcp_servers").select("*").order("created_at").execute()
        return res.data or []
    except Exception:
        return []


@router.post("/")
async def add_server(body: dict):
    name = (body.get("name") or "").strip()
    url  = (body.get("url")  or "").strip()
    if not name or not url:
        return {"error": "Name and URL are required"}

    # Discover tools
    tools = await fetch_tools(url)

    try:
        db  = get_db()
        now = datetime.now(timezone.utc).isoformat()
        res = db.table("mcp_servers").insert({
            "name":        name,
            "url":         url,
            "tools":       tools or None,
            "last_synced": now,
        }).execute()
        return res.data[0]
    except Exception as e:
        msg = str(e)
        if "unique" in msg.lower():
            return {"error": "A server with this URL is already connected"}
        return {"error": f"Could not save server: {msg[:100]}"}


@router.patch("/{server_id}")
def update_server(server_id: str, body: dict):
    db = get_db()
    db.table("mcp_servers").update({"is_enabled": body.get("is_enabled")}).eq("id", server_id).execute()
    return {"ok": True}


@router.delete("/{server_id}")
def delete_server(server_id: str):
    get_db().table("mcp_servers").delete().eq("id", server_id).execute()
    return {"ok": True}


@router.post("/{server_id}/sync")
async def sync_server(server_id: str):
    db  = get_db()
    res = db.table("mcp_servers").select("url").eq("id", server_id).execute()
    if not res.data:
        return {"error": "Server not found"}
    url   = res.data[0]["url"]
    tools = await fetch_tools(url)
    now   = datetime.now(timezone.utc).isoformat()
    db.table("mcp_servers").update({"tools": tools or None, "last_synced": now}).eq("id", server_id).execute()
    return {"tools": tools}


# ── Used by ai.py to get all active tools ─────────────────────────────────────

def get_active_mcp_tools() -> list[dict]:
    """Return Anthropic-format tool definitions from all enabled MCP servers."""
    try:
        db  = get_db()
        res = db.table("mcp_servers").select("url,tools").eq("is_enabled", True).execute()
        out = []
        for row in (res.data or []):
            for t in (row.get("tools") or []):
                name = t.get("name", "")
                if not name:
                    continue
                out.append({
                    "name":        name,
                    "description": t.get("description", ""),
                    "input_schema": t.get("inputSchema") or t.get("input_schema") or {"type": "object", "properties": {}},
                    "_server_url": row["url"],   # internal routing field (stripped before API call)
                })
        return out
    except Exception:
        return []


def get_server_url_for_tool(tool_name: str) -> Optional[str]:
    """Find which MCP server owns a given tool."""
    try:
        db  = get_db()
        res = db.table("mcp_servers").select("url,tools").eq("is_enabled", True).execute()
        for row in (res.data or []):
            for t in (row.get("tools") or []):
                if t.get("name") == tool_name:
                    return row["url"]
    except Exception:
        pass
    return None
