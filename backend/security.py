import base64
import hashlib
import hmac
import json
import secrets
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timezone

from backend.config import get_bootstrap_pin
from backend.database import supabase


PIN_ITERATIONS = 310_000
PIN_PREFIX = "pbkdf2_sha256"
MAX_FAILED_ATTEMPTS = 5
WINDOW_SECONDS = 300
SESSION_TTL_SECONDS = 8 * 60 * 60


class AuthBackendUnavailable(RuntimeError):
    pass


class VersionConflict(RuntimeError):
    pass


def hash_pin(pin: str, *, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", pin.encode("utf-8"), salt, PIN_ITERATIONS)
    return f"{PIN_PREFIX}${PIN_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_pin_hash(pin: str, encoded: str) -> bool:
    try:
        prefix, iterations, salt_hex, digest_hex = encoded.split("$", 3)
        if prefix != PIN_PREFIX:
            return False
        expected = bytes.fromhex(digest_hex)
        actual = hashlib.pbkdf2_hmac(
            "sha256", pin.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
        return secrets.compare_digest(actual, expected)
    except (TypeError, ValueError):
        return False


def _load_pin_rows() -> dict[str, str]:
    try:
        result = (
            supabase.table("global_settings")
            .select("key,value")
            .in_("key", ["admin_pin_hash", "admin_pin"])
            .execute()
        )
    except Exception as exc:
        raise AuthBackendUnavailable("Không thể truy cập kho xác thực.") from exc
    return {str(row["key"]): str(row["value"]) for row in (result.data or [])}


def ensure_admin_pin_is_hashed() -> None:
    """Migrate the legacy PIN in place without exposing or changing its value."""
    rows = _load_pin_rows()
    if rows.get("admin_pin_hash"):
        if rows.get("admin_pin"):
            try:
                supabase.table("global_settings").delete().eq("key", "admin_pin").execute()
            except Exception as exc:
                raise AuthBackendUnavailable("Không thể xóa PIN plaintext cũ.") from exc
        return

    legacy_pin = rows.get("admin_pin") or get_bootstrap_pin()
    if not legacy_pin or not legacy_pin.isdigit() or not 6 <= len(legacy_pin) <= 12:
        raise AuthBackendUnavailable("PIN quản trị chưa được cấu hình hợp lệ.")

    try:
        supabase.table("global_settings").upsert(
            {"key": "admin_pin_hash", "value": hash_pin(legacy_pin)},
            on_conflict="key",
        ).execute()
        supabase.table("global_settings").delete().eq("key", "admin_pin").execute()
    except Exception as exc:
        raise AuthBackendUnavailable("Không thể nâng cấp bảo mật PIN.") from exc


def verify_admin_pin(pin: str, *, upgrade_legacy: bool = False) -> bool:
    rows = _load_pin_rows()
    encoded = rows.get("admin_pin_hash")
    if encoded:
        return verify_pin_hash(pin, encoded)

    legacy_pin = rows.get("admin_pin") or get_bootstrap_pin()
    if not legacy_pin or not secrets.compare_digest(pin, legacy_pin):
        return False

    if upgrade_legacy:
        try:
            supabase.table("global_settings").upsert(
                {"key": "admin_pin_hash", "value": hash_pin(pin)},
                on_conflict="key",
            ).execute()
            supabase.table("global_settings").delete().eq("key", "admin_pin").execute()
        except Exception as exc:
            raise AuthBackendUnavailable("Không thể nâng cấp bảo mật PIN.") from exc
    return True


def set_admin_pin(pin: str, expected_version: int) -> None:
    try:
        result = (
            supabase.table("global_settings")
            .update({
                "value": hash_pin(pin),
                "version": expected_version + 1,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("key", "admin_pin_hash")
            .eq("version", expected_version)
            .execute()
        )
    except Exception as exc:
        raise AuthBackendUnavailable("Không thể cập nhật PIN.") from exc
    if not result.data:
        raise VersionConflict("PIN vừa được một phiên khác cập nhật.")


def _session_signing_key(pin_hash: str) -> bytes:
    return hashlib.sha256(f"tien-nha-session:{pin_hash}".encode("utf-8")).digest()


def _encode_urlsafe(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _decode_urlsafe(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def issue_admin_session() -> str:
    pin_hash = _load_pin_rows().get("admin_pin_hash")
    if not pin_hash:
        raise AuthBackendUnavailable("PIN chưa được nâng cấp an toàn.")
    payload = json.dumps(
        {"exp": int(time.time()) + SESSION_TTL_SECONDS, "nonce": secrets.token_hex(16)},
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    encoded_payload = _encode_urlsafe(payload)
    signature = hmac.new(
        _session_signing_key(pin_hash), encoded_payload.encode("ascii"), hashlib.sha256
    ).digest()
    return f"{encoded_payload}.{_encode_urlsafe(signature)}"


def verify_admin_session(token: str) -> bool:
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        payload = json.loads(_decode_urlsafe(encoded_payload))
        if int(payload["exp"]) < int(time.time()):
            return False
        pin_hash = _load_pin_rows().get("admin_pin_hash")
        if not pin_hash:
            return False
        expected = hmac.new(
            _session_signing_key(pin_hash), encoded_payload.encode("ascii"), hashlib.sha256
        ).digest()
        return hmac.compare_digest(expected, _decode_urlsafe(encoded_signature))
    except (KeyError, TypeError, ValueError, json.JSONDecodeError):
        return False


class PinRateLimiter:
    def __init__(self):
        self._failed: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float) -> deque[float]:
        attempts = self._failed[key]
        while attempts and now - attempts[0] >= WINDOW_SECONDS:
            attempts.popleft()
        return attempts

    def retry_after(self, key: str) -> int:
        now = time.monotonic()
        with self._lock:
            attempts = self._prune(key, now)
            if len(attempts) < MAX_FAILED_ATTEMPTS:
                return 0
            return max(1, int(WINDOW_SECONDS - (now - attempts[0])))

    def record_failure(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            self._prune(key, now).append(now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._failed.pop(key, None)


pin_rate_limiter = PinRateLimiter()
