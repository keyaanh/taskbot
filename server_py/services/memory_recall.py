from typing import Optional
import re

RECALL_PATTERNS = [
    r"what do you know about me",
    r"what.ve you (learned|saved|remembered)",
    r"remember (what|our|the|when|that)",
    r"\brecall\b",
    r"from (our|a|previous|last|past|earlier|prior) (chat|conversation|session|time)",
    r"we (talked|spoke|discussed|chatted) (about|before)",
    r"my background",
    r"use what you know",
    r"based on what you know",
    r"know about me",
]

def has_recall_intent(text: str) -> bool:
    t = text.lower()
    return any(re.search(p, t) for p in RECALL_PATTERNS)

def build_system(doc_context: Optional[str] = None, memory_cards: Optional[list] = None, mode: Optional[str] = None, context_summary: Optional[str] = None, user_prefs: Optional[dict] = None) -> str:
    prefs          = user_prefs or {}
    full_name      = prefs.get("full_name", "").strip()
    preferred_name = prefs.get("preferred_name", "").strip()

    name_clause = ""
    if full_name and preferred_name and preferred_name != full_name:
        name_clause = f" The user's full name is {full_name} and they prefer to be called {preferred_name}."
    elif full_name:
        name_clause = f" The user's name is {full_name}."
    elif preferred_name:
        name_clause = f" The user prefers to be called {preferred_name}."

    base = (
        f"You are Taskbot, a helpful general-purpose assistant. "
        f"Answer any question the user has — coding, writing, research, math, general knowledge, anything. "
        f"You also have access to tools like Google Calendar when connected, but you are NOT limited to those tools. "
        f"Never use emojis. Write clearly and directly.{name_clause}"
    )

    instructions = prefs.get("instructions", "").strip()
    if instructions:
        base += f"\n\nUser's standing instructions (always follow these):\n{instructions}"

    if mode == "search":
        base += "\n\nThe user has enabled Search mode. Use the web_search tool to find current information and cite your sources."

    if mode == "think":
        base += "\n\nThe user has enabled Think mode. Take your time to reason through the problem step by step before responding. Show your reasoning process and be thorough."

    # Compressed history from older messages — injected before recent turns
    if context_summary:
        base += f"\n\n---\nRunning conversation summary (earlier messages compressed):\n{context_summary}\n---"

    if memory_cards:
        facts = "\n".join(f"- {c['fact']}" for c in memory_cards)
        base += f"\n\nWhat you know about the user (always use this):\n{facts}"

    if doc_context:
        base += f"\n\n---\nThe user has shared this document. Use it to answer their questions accurately:\n\n{doc_context[:12000]}\n---"

    return base
