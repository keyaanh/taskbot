from typing import List
import anthropic
import asyncio
import json
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'), override=True)

_client = None

def get_client():
    global _client
    if not _client:
        _client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    return _client

async def stream_chat(messages: list, system: str, mode: str = None):
    """Async generator yielding SSE lines. Last item is a JSON with token count."""
    queue = asyncio.Queue()

    def run_search():
        """Streaming path for web search — SDK handles tool loop, we stream text deltas."""
        try:
            with get_client().messages.stream(
                model="claude-sonnet-4-6",
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
                queue.put_nowait(json.dumps({"done": True, "tokens": tokens}))
        except Exception as e:
            queue.put_nowait(json.dumps({"error": str(e)}))
            queue.put_nowait(json.dumps({"done": True, "tokens": 0}))
        finally:
            queue.put_nowait(None)

    def run_stream():
        try:
            kwargs = dict(
                model="claude-sonnet-4-6",
                max_tokens=8000 if mode == "think" else 1024,
                system=system,
                messages=messages[-20:],
            )
            if mode == "think":
                kwargs["thinking"] = {"type": "enabled", "budget_tokens": 6000}

            with get_client().messages.stream(**kwargs) as stream:
                for event in stream:
                    if event.type == "content_block_delta":
                        if hasattr(event.delta, "text"):
                            queue.put_nowait(json.dumps({"text": event.delta.text}))
                        elif hasattr(event.delta, "thinking"):
                            queue.put_nowait(json.dumps({"thinking": event.delta.thinking}))

                final = stream.get_final_message()
                tokens = final.usage.output_tokens if final.usage else 0
                queue.put_nowait(json.dumps({"done": True, "tokens": tokens}))
        except Exception as e:
            queue.put_nowait(json.dumps({"error": str(e)}))
            queue.put_nowait(json.dumps({"done": True, "tokens": 0}))
        finally:
            queue.put_nowait(None)

    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, run_search if mode == "search" else run_stream)

    while True:
        item = await queue.get()
        if item is None:
            break
        yield f"data: {item}\n\n"

    yield "data: [DONE]\n\n"


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
