"""
Direct API tool implementations for each connected provider.
These are exposed to Claude as Anthropic-format tool definitions,
executed here using the stored OAuth tokens.
"""
from typing import Optional
import httpx
import json
from datetime import datetime, timezone, timedelta

TIMEOUT = 15


# ── Tool definitions (Anthropic format) ──────────────────────────────────────

GOOGLE_CALENDAR_TOOLS = [
    {
        "name": "list_calendar_events",
        "description": "List upcoming events from the user's Google Calendar. Use this when the user asks about their schedule, meetings, or calendar.",
        "input_schema": {
            "type": "object",
            "properties": {
                "max_results": {"type": "integer", "description": "Max number of events to return (default 10, max 50)"},
                "days_ahead":  {"type": "integer", "description": "How many days ahead to look (default 7)"},
                "query":       {"type": "string",  "description": "Optional search query to filter events by title"},
            },
        },
    },
    {
        "name": "create_calendar_event",
        "description": "Create a new event in the user's Google Calendar.",
        "input_schema": {
            "type": "object",
            "required": ["title", "start_time", "end_time"],
            "properties": {
                "title":       {"type": "string", "description": "Event title"},
                "start_time":  {"type": "string", "description": "Start time in ISO 8601 format (e.g. 2025-06-20T14:00:00)"},
                "end_time":    {"type": "string", "description": "End time in ISO 8601 format"},
                "description": {"type": "string", "description": "Optional event description"},
                "location":    {"type": "string", "description": "Optional location"},
            },
        },
    },
]

GMAIL_TOOLS = [
    {
        "name": "search_emails",
        "description": "Search the user's Gmail inbox. Use Gmail search syntax (e.g. 'from:alice subject:meeting').",
        "input_schema": {
            "type": "object",
            "required": ["query"],
            "properties": {
                "query":       {"type": "string",  "description": "Gmail search query"},
                "max_results": {"type": "integer", "description": "Max emails to return (default 5)"},
            },
        },
    },
    {
        "name": "get_email",
        "description": "Get the full content of a specific email by message ID.",
        "input_schema": {
            "type": "object",
            "required": ["message_id"],
            "properties": {
                "message_id": {"type": "string", "description": "Gmail message ID"},
            },
        },
    },
    {
        "name": "create_draft_email",
        "description": "Create a draft email in Gmail (does not send — user reviews and sends manually).",
        "input_schema": {
            "type": "object",
            "required": ["to", "subject", "body"],
            "properties": {
                "to":      {"type": "string", "description": "Recipient email address"},
                "subject": {"type": "string", "description": "Email subject"},
                "body":    {"type": "string", "description": "Email body (plain text)"},
            },
        },
    },
]

NOTION_TOOLS = [
    {
        "name": "search_notion",
        "description": "Search across the user's Notion workspace for pages and databases.",
        "input_schema": {
            "type": "object",
            "required": ["query"],
            "properties": {
                "query":       {"type": "string",  "description": "Search query"},
                "max_results": {"type": "integer", "description": "Max results (default 5)"},
            },
        },
    },
    {
        "name": "get_notion_page",
        "description": "Get the content of a specific Notion page by ID.",
        "input_schema": {
            "type": "object",
            "required": ["page_id"],
            "properties": {
                "page_id": {"type": "string", "description": "Notion page ID"},
            },
        },
    },
    {
        "name": "create_notion_page",
        "description": "Create a new page in the user's Notion workspace.",
        "input_schema": {
            "type": "object",
            "required": ["title", "content"],
            "properties": {
                "title":     {"type": "string", "description": "Page title"},
                "content":   {"type": "string", "description": "Page content (plain text or markdown)"},
                "parent_id": {"type": "string", "description": "Optional parent page or database ID to create inside"},
            },
        },
    },
]

SLACK_TOOLS = [
    {
        "name": "list_slack_channels",
        "description": "List the user's Slack channels.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "Max channels to return (default 20)"},
            },
        },
    },
    {
        "name": "get_slack_messages",
        "description": "Get recent messages from a Slack channel.",
        "input_schema": {
            "type": "object",
            "required": ["channel_id"],
            "properties": {
                "channel_id": {"type": "string", "description": "Slack channel ID"},
                "limit":      {"type": "integer", "description": "Max messages to return (default 20)"},
            },
        },
    },
    {
        "name": "post_slack_message",
        "description": "Post a message to a Slack channel.",
        "input_schema": {
            "type": "object",
            "required": ["channel_id", "text"],
            "properties": {
                "channel_id": {"type": "string", "description": "Slack channel ID"},
                "text":       {"type": "string", "description": "Message text"},
            },
        },
    },
    {
        "name": "search_slack",
        "description": "Search messages across the user's Slack workspace.",
        "input_schema": {
            "type": "object",
            "required": ["query"],
            "properties": {
                "query": {"type": "string", "description": "Search query"},
                "count": {"type": "integer", "description": "Max results (default 10)"},
            },
        },
    },
]

PROVIDER_TOOLS = {
    "google_calendar": GOOGLE_CALENDAR_TOOLS,
    "gmail":           GMAIL_TOOLS,
    "notion":          NOTION_TOOLS,
    "slack":           SLACK_TOOLS,
}

# Map tool name → provider for fast lookup during execution
TOOL_PROVIDER_MAP = {
    t["name"]: provider
    for provider, tools in PROVIDER_TOOLS.items()
    for t in tools
}


# ── Tool execution ────────────────────────────────────────────────────────────

async def execute_tool(tool_name: str, tool_input: dict, access_token: str) -> str:
    try:
        fn = _TOOL_FNS.get(tool_name)
        if not fn:
            return f"[Unknown tool: {tool_name}]"
        return await fn(tool_input, access_token)
    except Exception as e:
        return f"[Tool error — {tool_name}: {str(e)[:200]}]"


# ── Google Calendar ───────────────────────────────────────────────────────────

async def _list_calendar_events(inp: dict, token: str) -> str:
    now  = datetime.now(timezone.utc)
    end  = now + timedelta(days=inp.get("days_ahead", 7))
    params = {
        "maxResults":   min(inp.get("max_results", 10), 50),
        "orderBy":      "startTime",
        "singleEvents": "true",
        "timeMin":      now.isoformat(),
        "timeMax":      end.isoformat(),
    }
    if inp.get("query"):
        params["q"] = inp["query"]

    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.get(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers={"Authorization": f"Bearer {token}"},
            params=params,
        )
    data = r.json()
    items = data.get("items", [])
    if not items:
        return "No upcoming events found."

    lines = []
    for e in items:
        start = e.get("start", {}).get("dateTime") or e.get("start", {}).get("date", "")
        lines.append(f"• {e.get('summary', '(no title)')} — {start}")
        if e.get("location"):
            lines.append(f"  Location: {e['location']}")
        if e.get("description"):
            lines.append(f"  {e['description'][:100]}")
    return "\n".join(lines)


async def _create_calendar_event(inp: dict, token: str) -> str:
    body = {
        "summary":  inp["title"],
        "start":    {"dateTime": inp["start_time"], "timeZone": "UTC"},
        "end":      {"dateTime": inp["end_time"],   "timeZone": "UTC"},
    }
    if inp.get("description"): body["description"] = inp["description"]
    if inp.get("location"):    body["location"]    = inp["location"]

    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=body,
        )
    data = r.json()
    if "id" in data:
        return f"Event created: {data.get('summary')} on {data.get('start',{}).get('dateTime','')} (ID: {data['id']})"
    return f"Error creating event: {data.get('error',{}).get('message', str(data))}"


# ── Gmail ─────────────────────────────────────────────────────────────────────

async def _search_emails(inp: dict, token: str) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers={"Authorization": f"Bearer {token}"},
            params={"q": inp["query"], "maxResults": inp.get("max_results", 5)},
        )
    data = r.json()
    messages = data.get("messages", [])
    if not messages:
        return "No emails found matching that query."

    # Fetch snippet for each
    lines = []
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        for m in messages[:5]:
            mr = await c.get(
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{m['id']}",
                headers={"Authorization": f"Bearer {token}"},
                params={"format": "metadata", "metadataHeaders": ["From", "Subject", "Date"]},
            )
            md = mr.json()
            headers = {h["name"]: h["value"] for h in md.get("payload", {}).get("headers", [])}
            lines.append(
                f"• [{md['id']}] {headers.get('Subject','(no subject)')}\n"
                f"  From: {headers.get('From','')}  Date: {headers.get('Date','')}\n"
                f"  {md.get('snippet','')[:120]}"
            )
    return "\n".join(lines)


async def _get_email(inp: dict, token: str) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.get(
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{inp['message_id']}",
            headers={"Authorization": f"Bearer {token}"},
            params={"format": "full"},
        )
    data = r.json()
    headers = {h["name"]: h["value"] for h in data.get("payload", {}).get("headers", [])}

    def _body(part):
        import base64
        if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
            return base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="ignore")
        for p in part.get("parts", []):
            result = _body(p)
            if result: return result
        return ""

    body = _body(data.get("payload", {}))
    return (
        f"From: {headers.get('From','')}\n"
        f"Subject: {headers.get('Subject','')}\n"
        f"Date: {headers.get('Date','')}\n\n"
        f"{body[:2000]}"
    )


async def _create_draft_email(inp: dict, token: str) -> str:
    import base64, email.mime.text
    msg = email.mime.text.MIMEText(inp["body"])
    msg["To"] = inp["to"]
    msg["Subject"] = inp["subject"]
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"message": {"raw": raw}},
        )
    data = r.json()
    if "id" in data:
        return f"Draft created (ID: {data['id']}) — to: {inp['to']}, subject: {inp['subject']}"
    return f"Error creating draft: {data.get('error',{}).get('message', str(data))}"


# ── Notion ────────────────────────────────────────────────────────────────────

async def _search_notion(inp: dict, token: str) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.post(
            "https://api.notion.com/v1/search",
            headers={"Authorization": f"Bearer {token}", "Notion-Version": "2022-06-28",
                     "Content-Type": "application/json"},
            json={"query": inp["query"], "page_size": inp.get("max_results", 5)},
        )
    data = r.json()
    results = data.get("results", [])
    if not results:
        return "No Notion pages found."
    lines = []
    for p in results:
        title = ""
        props = p.get("properties", {})
        for v in props.values():
            if v.get("type") == "title":
                texts = v.get("title", [])
                title = "".join(t.get("plain_text", "") for t in texts)
                break
        if not title and p.get("object") == "page":
            title = "(Untitled)"
        lines.append(f"• [{p['id']}] {title} — {p.get('url','')}")
    return "\n".join(lines)


async def _get_notion_page(inp: dict, token: str) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.get(
            f"https://api.notion.com/v1/blocks/{inp['page_id']}/children",
            headers={"Authorization": f"Bearer {token}", "Notion-Version": "2022-06-28"},
        )
    data = r.json()
    blocks = data.get("results", [])
    lines = []
    for b in blocks:
        btype = b.get("type", "")
        content = b.get(btype, {})
        rich = content.get("rich_text", [])
        text = "".join(t.get("plain_text", "") for t in rich)
        if text:
            lines.append(text)
    return "\n".join(lines) if lines else "(Page is empty)"


async def _create_notion_page(inp: dict, token: str) -> str:
    # Build a simple page with paragraph blocks from content
    paragraphs = [
        {"object": "block", "type": "paragraph",
         "paragraph": {"rich_text": [{"type": "text", "text": {"content": line}}]}}
        for line in inp["content"].split("\n") if line.strip()
    ]
    body: dict = {
        "properties": {"title": {"title": [{"type": "text", "text": {"content": inp["title"]}}]}},
        "children":   paragraphs,
    }
    if inp.get("parent_id"):
        body["parent"] = {"type": "page_id", "page_id": inp["parent_id"]}
    else:
        body["parent"] = {"type": "workspace", "workspace": True}

    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.post(
            "https://api.notion.com/v1/pages",
            headers={"Authorization": f"Bearer {token}", "Notion-Version": "2022-06-28",
                     "Content-Type": "application/json"},
            json=body,
        )
    data = r.json()
    if "id" in data:
        return f"Notion page created: {inp['title']} — {data.get('url','')}"
    return f"Error: {data.get('message', str(data))}"


# ── Slack ─────────────────────────────────────────────────────────────────────

async def _list_slack_channels(inp: dict, token: str) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.get(
            "https://slack.com/api/conversations.list",
            headers={"Authorization": f"Bearer {token}"},
            params={"limit": inp.get("limit", 20), "exclude_archived": "true"},
        )
    data = r.json()
    if not data.get("ok"):
        return f"Error: {data.get('error', 'unknown')}"
    channels = data.get("channels", [])
    lines = [f"• [{c['id']}] #{c['name']} ({c.get('num_members',0)} members)" for c in channels]
    return "\n".join(lines) if lines else "No channels found."


async def _get_slack_messages(inp: dict, token: str) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.get(
            "https://slack.com/api/conversations.history",
            headers={"Authorization": f"Bearer {token}"},
            params={"channel": inp["channel_id"], "limit": inp.get("limit", 20)},
        )
    data = r.json()
    if not data.get("ok"):
        return f"Error: {data.get('error','unknown')}"
    msgs = data.get("messages", [])
    lines = []
    for m in msgs:
        ts = datetime.fromtimestamp(float(m.get("ts", 0)), tz=timezone.utc).strftime("%H:%M")
        lines.append(f"[{ts}] {m.get('user','?')}: {m.get('text','')[:200]}")
    return "\n".join(lines) if lines else "No messages."


async def _post_slack_message(inp: dict, token: str) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.post(
            "https://slack.com/api/chat.postMessage",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"channel": inp["channel_id"], "text": inp["text"]},
        )
    data = r.json()
    if data.get("ok"):
        return f"Message posted to channel {inp['channel_id']}"
    return f"Error: {data.get('error','unknown')}"


async def _search_slack(inp: dict, token: str) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.get(
            "https://slack.com/api/search.messages",
            headers={"Authorization": f"Bearer {token}"},
            params={"query": inp["query"], "count": inp.get("count", 10)},
        )
    data = r.json()
    if not data.get("ok"):
        return f"Error: {data.get('error','unknown')}"
    matches = data.get("messages", {}).get("matches", [])
    lines = [f"• #{m.get('channel',{}).get('name','?')}: {m.get('text','')[:150]}" for m in matches]
    return "\n".join(lines) if lines else "No results."


# ── Dispatch table ────────────────────────────────────────────────────────────

_TOOL_FNS = {
    "list_calendar_events":  _list_calendar_events,
    "create_calendar_event": _create_calendar_event,
    "search_emails":         _search_emails,
    "get_email":             _get_email,
    "create_draft_email":    _create_draft_email,
    "search_notion":         _search_notion,
    "get_notion_page":       _get_notion_page,
    "create_notion_page":    _create_notion_page,
    "list_slack_channels":   _list_slack_channels,
    "get_slack_messages":    _get_slack_messages,
    "post_slack_message":    _post_slack_message,
    "search_slack":          _search_slack,
}


def get_connected_tools() -> list[dict]:
    """
    Return Anthropic tool definitions for all connected providers,
    tagged with _provider for routing during execution.
    """
    try:
        from routes.connections import get_live_token
        out = []
        for provider, tools in PROVIDER_TOOLS.items():
            token = get_live_token(provider)
            if token:
                for t in tools:
                    out.append({**t, "_provider": provider})
        return out
    except Exception:
        return []
