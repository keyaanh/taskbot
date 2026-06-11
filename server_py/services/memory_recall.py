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

def build_system(doc_context: Optional[str] = None, memory_cards: Optional[list] = None, mode: Optional[str] = None) -> str:
    base = "You are a helpful, concise assistant. Never use emojis. Write clearly and directly."

    if mode == "search":
        base += "\n\nThe user has enabled Search mode. Draw on your most current training knowledge to answer as thoroughly as possible. Clearly indicate what you know from training data and note if information may have changed after your knowledge cutoff."

    if mode == "think":
        base += "\n\nThe user has enabled Think mode. Take your time to reason through the problem step by step before responding. Show your reasoning process and be thorough."

    if memory_cards:
        facts = "\n".join(f"- {c['fact']}" for c in memory_cards)
        base += f"\n\nThe user asked you to recall what you know about them:\n{facts}"

    if doc_context:
        base += f"\n\n---\nThe user has shared this document. Use it to answer their questions accurately:\n\n{doc_context[:12000]}\n---"

    return base
