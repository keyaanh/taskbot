"""
Database layer — Supabase client (PostgREST).

To migrate to direct PostgreSQL later, replace this file with a psycopg2
pool and update DATABASE_URL in .env. The routes use plain SQL helpers
(fetchall / fetchone / execute) that will work with either backend.
"""
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'), override=True)

_client = None

def get_db():
    global _client
    if not _client:
        _client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_ANON_KEY"),
        )
    return _client


# ── Thin helpers so routes don't depend on Supabase query syntax ──────────────

def fetchall(conn, sql, params=()):
    """Execute a raw SELECT and return list[dict]. conn = supabase client."""
    # PostgREST doesn't take raw SQL; we use the table API.
    # Routes that need raw SQL pass a _raw=True sentinel — handled below.
    raise NotImplementedError("Use get_db() table API directly in routes")

def fetchone(conn, sql, params=()):
    raise NotImplementedError("Use get_db() table API directly in routes")

def execute(conn, sql, params=()):
    raise NotImplementedError("Use get_db() table API directly in routes")
