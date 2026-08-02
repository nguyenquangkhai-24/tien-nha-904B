import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "").strip()

# Tự động dọn dẹp URL nếu người dùng vô tình copy thừa /rest/v1 từ dashboard
if SUPABASE_URL.endswith('/'):
    SUPABASE_URL = SUPABASE_URL[:-1]
if SUPABASE_URL.endswith('/rest/v1'):
    SUPABASE_URL = SUPABASE_URL[:-8] # cắt bỏ /rest/v1
if SUPABASE_URL.endswith('/'):
    SUPABASE_URL = SUPABASE_URL[:-1]

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_KEY environment variables are missing.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
