from typing import List, Optional
import anthropic
import asyncio
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'), override=True)

_client = None

def get_client(api_key: str = None):
    global _client
    if api_key:
        return anthropic.Anthropic(api_key=api_key)
    if not _client:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    return _client


# ── Provider routing ──────────────────────────────────────────────────────────

def _provider_of(model: str) -> str:
    if model and model.startswith("gpt-"):    return "openai"
    if model and model.startswith("gemini-"): return "google"
    return "anthropic"

def _get_user_key(provider: str) -> Optional[str]:
    """Fetch the decrypted user key for a provider (non-blocking, best-effort)."""
    try:
        from routes.keys import get_decrypted_key
        return get_decrypted_key(provider)
    except Exception:
        return None


DEFAULT_MODEL = "claude-sonnet-4-6"

async def stream_chat(messages: list, system: str, mode: str = None, model: str = None):
    """Async generator yielding SSE lines."""
    queue = asyncio.Queue()

    _provider = _provider_of(model)
    _user_key = _get_user_key(_provider)
    _model    = model or DEFAULT_MODEL

    # ── Non-Anthropic providers ───────────────────────────────────────────────
    def run_openai():
        try:
            import openai as _oai
            client = _oai.OpenAI(api_key=_user_key)
            stream = client.chat.completions.create(
                model=_model, max_tokens=1024, stream=True,
                messages=[{"role": "system", "content": system}] + messages[-20:],
            )
            total = 0
            for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices else None
                if delta:
                    total += len(delta)
                    queue.put_nowait(json.dumps({"text": delta}))
            queue.put_nowait(json.dumps({"done": True, "tokens": total // 4}))
        except Exception as e:
            queue.put_nowait(json.dumps({"error": str(e)}))
            queue.put_nowait(json.dumps({"done": True, "tokens": 0}))
        finally:
            queue.put_nowait(None)

    def run_google():
        try:
            import google.generativeai as genai
            genai.configure(api_key=_user_key)
            mdl = genai.GenerativeModel(_model, system_instruction=system)
            conv = [{"role": ("user" if m["role"] == "user" else "model"), "parts": [m["content"]]}
                    for m in messages[-20:] if isinstance(m.get("content"), str)]
            total = 0
            for chunk in mdl.generate_content(conv, stream=True):
                t = chunk.text or ""
                if t:
                    total += len(t)
                    queue.put_nowait(json.dumps({"text": t}))
            queue.put_nowait(json.dumps({"done": True, "tokens": total // 4}))
        except Exception as e:
            queue.put_nowait(json.dumps({"error": str(e)}))
            queue.put_nowait(json.dumps({"done": True, "tokens": 0}))
        finally:
            queue.put_nowait(None)

    def run_search():
        """Streaming web search — SDK handles tool loop, we emit text deltas + sources."""
        try:
            with get_client(_user_key if _provider == "anthropic" else None).messages.stream(
                model=_model,
                max_tokens=2048,
                system=system,
                messages=messages[-20:],
                tools=[{"type": "web_search_20250305", "name": "web_search"}],
            ) as stream:
                for event in stream:
                    if event.type == "content_block_delta" and hasattr(event.delta, "text"):
                        queue.put_nowait(json.dumps({"text": event.delta.text}))

                final = stream.get_final_message()
                tokens = final.usage.output_tokens if final.usage else 0

                # Extract sources from web_search_tool_result blocks
                sources = []
                for block in final.content:
                    if getattr(block, "type", "") == "web_search_tool_result":
                        for result in (getattr(block, "content", []) or []):
                            url = getattr(result, "url", None)
                            if url:
                                sources.append({
                                    "title": getattr(result, "title", "") or url,
                                    "url": url,
                                    # Anthropic's web_search_tool_result doesn't expose a
                                    # human-readable snippet — only an opaque encrypted
                                    # blob used for citation verification. Left null
                                    # rather than faked, per the "honest sources" spec.
                                    "snippet": getattr(result, "snippet", None),
                                    "page_age": getattr(result, "page_age", None),
                                    "retrieved_at": datetime.now(timezone.utc).isoformat(),
                                })
                if sources:
                    queue.put_nowait(json.dumps({"sources": sources}))

                queue.put_nowait(json.dumps({"done": True, "tokens": tokens}))
        except Exception as e:
            queue.put_nowait(json.dumps({"error": str(e)}))
            queue.put_nowait(json.dumps({"done": True, "tokens": 0}))
        finally:
            queue.put_nowait(None)

    def run_stream():
        import asyncio as _asyncio
        try:
            # Gather MCP tools + OAuth integration tools (Anthropic only)
            mcp_tools = []
            if _provider == "anthropic":
                try:
                    from routes.mcp import get_active_mcp_tools
                    raw = get_active_mcp_tools()
                    mcp_tools += [{k: v for k, v in t.items() if k != "_server_url"} for t in raw]
                except Exception:
                    pass
                try:
                    from services.integrations import get_connected_tools
                    integration_raw = get_connected_tools()
                    mcp_tools += [{k: v for k, v in t.items() if k != "_provider"} for t in integration_raw]
                except Exception:
                    pass

            client_inst = get_client(_user_key if _provider == "anthropic" else None)
            conv = list(messages[-20:])  # mutable copy for agentic loop
            total_tokens = 0

            while True:
                kwargs = dict(
                    model=_model,
                    max_tokens=8000 if mode == "think" else 1024,
                    system=system,
                    messages=conv,
                )
                if mode == "think":
                    kwargs["thinking"] = {"type": "enabled", "budget_tokens": 6000}
                if mcp_tools:
                    kwargs["tools"] = mcp_tools

                with client_inst.messages.stream(**kwargs) as stream:
                    for event in stream:
                        if event.type == "content_block_delta":
                            if hasattr(event.delta, "text"):
                                queue.put_nowait(json.dumps({"text": event.delta.text}))
                            elif hasattr(event.delta, "thinking"):
                                queue.put_nowait(json.dumps({"thinking": event.delta.thinking}))

                    final = stream.get_final_message()
                    total_tokens += final.usage.output_tokens if final.usage else 0

                    # If no tool calls, we're done
                    tool_uses = [b for b in final.content if getattr(b, "type", "") == "tool_use"]
                    if not tool_uses or not mcp_tools:
                        break

                    # Execute each tool call and build tool_result blocks
                    conv.append({"role": "assistant", "content": [
                        {"type": "tool_use", "id": t.id, "name": t.name, "input": t.input}
                        for t in tool_uses
                    ]})

                    def _run_async(coro):
                        """Run a coroutine from a non-async thread (executor context)."""
                        try:
                            loop = _asyncio.new_event_loop()
                            return loop.run_until_complete(coro)
                        finally:
                            loop.close()

                    tool_results = []
                    for t in tool_uses:
                        queue.put_nowait(json.dumps({"tool_call": {"name": t.name, "input": t.input}}))
                        try:
                            # Check integration tools first
                            from services.integrations import TOOL_PROVIDER_MAP, execute_tool
                            from routes.connections import get_live_token
                            int_provider = TOOL_PROVIDER_MAP.get(t.name)
                            if int_provider:
                                token = get_live_token(int_provider)
                                if token:
                                    result = _run_async(execute_tool(t.name, t.input or {}, token))
                                else:
                                    result = f"[{int_provider} not connected or token expired — ask user to reconnect in Settings]"
                            else:
                                # Fall back to MCP server tools
                                from routes.mcp import get_server_url_for_tool, call_tool
                                server_url = get_server_url_for_tool(t.name)
                                if server_url:
                                    result = _run_async(call_tool(server_url, t.name, t.input or {}))
                                else:
                                    result = f"[Tool {t.name} not found]"
                        except Exception as te:
                            result = f"[Tool error: {te}]"
                        queue.put_nowait(json.dumps({"tool_result": {"name": t.name, "input": t.input, "result": result}}))
                        tool_results.append({"type": "tool_result", "tool_use_id": t.id, "content": result})

                    conv.append({"role": "user", "content": tool_results})
                    # Loop: send tool results back to Claude for the final answer

            queue.put_nowait(json.dumps({"done": True, "tokens": total_tokens}))
        except Exception as e:
            queue.put_nowait(json.dumps({"error": str(e)}))
            queue.put_nowait(json.dumps({"done": True, "tokens": 0}))
        finally:
            queue.put_nowait(None)

    # Dispatch to the right runner
    if mode == "search":
        target = run_search
    elif _provider == "openai":
        target = run_openai
    elif _provider == "google":
        target = run_google
    else:
        target = run_stream

    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, target)

    while True:
        item = await queue.get()
        if item is None:
            break
        yield f"data: {item}\n\n"

    yield "data: [DONE]\n\n"


async def compress_context(messages: list) -> str:
    """
    Compress older messages into a running summary injected as context.

    Triggered when history > SUMMARIZE_THRESHOLD (10 messages).
    Uses Haiku — fast and cheap for summarization work.
    """
    text = "\n".join(
        f"{m['role']}: {m['content']}"
        for m in messages
        if isinstance(m.get("content"), str) and m["content"].strip()
    )
    resp = await asyncio.to_thread(
        get_client().messages.create,
        model="claude-haiku-4-5-20251001",
        max_tokens=350,
        temperature=0.2,
        messages=[{"role": "user", "content": (
            "Compress the following conversation into a concise 3–5 sentence summary. "
            "Preserve all key facts, decisions, code snippets mentioned, and user preferences. "
            "Write in neutral third-person so it can be prepended as context for a continuing conversation.\n\n"
            + text
        )}],
    )
    return "".join(block.text for block in resp.content if block.type == "text").strip()


async def extract_facts(messages: list) -> List[str]:
    slice_ = messages[-6:]
    text = "\n".join(f"{m['role']}: {m['content']}" for m in slice_)
    resp = await asyncio.to_thread(
        get_client().messages.create,
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        temperature=0.3,
        messages=[{"role": "user", "content": (
            "Extract permanent facts about the user as a person (name, job, skills, background). "
            "Do NOT include task-specific things like 'user wants to rewrite X'. "
            "Return a JSON array of short strings only. If none, return [].\n\n" + text
        )}],
    )
    try:
        import re
        text = "".join(block.text for block in resp.content if block.type == "text")
        match = re.search(r'\[.*?\]', text, re.DOTALL)
        return json.loads(match.group()) if match else []
    except Exception:
        return []


async def generate_summary(messages: list) -> str:
    text = "\n".join(f"{m['role']}: {m['content']}" for m in messages)
    resp = await asyncio.to_thread(
        get_client().messages.create,
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        temperature=0.3,
        messages=[{"role": "user", "content": f"Summarize in exactly 3 plain English sentences:\n\n{text}"}],
    )
    return "".join(block.text for block in resp.content if block.type == "text").strip()
