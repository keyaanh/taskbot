from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'), override=True)

_client = None

def get_db():
    global _client
    if not _client:
        _client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))
    return _client
