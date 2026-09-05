import os


ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()
IS_PRODUCTION = ENVIRONMENT == "production"

DEFAULT_ORIGINS = [
    "https://tien-nha-904-b.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def get_allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "")
    origins = [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]
    return origins or DEFAULT_ORIGINS


def get_bootstrap_pin() -> str:
    return os.getenv("ADMIN_BOOTSTRAP_PIN", "").strip()
