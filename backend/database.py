import os

from dotenv import load_dotenv
from supabase import Client, create_client


load_dotenv()


def _normalized_supabase_url() -> str:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    if url.endswith("/rest/v1"):
        url = url[:-8].rstrip("/")
    return url


SUPABASE_URL = _normalized_supabase_url()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL và SUPABASE_KEY là bắt buộc.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
