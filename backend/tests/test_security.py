import os
import unittest
from unittest.mock import patch

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")

from fastapi.testclient import TestClient

from backend.main import app
from backend.security import (
    AuthBackendUnavailable,
    PinRateLimiter,
    hash_pin,
    issue_admin_session,
    verify_admin_session,
    verify_pin_hash,
)


class SecurityTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_pin_hash_round_trip(self):
        encoded = hash_pin("987654")
        self.assertNotIn("987654", encoded)
        self.assertTrue(verify_pin_hash("987654", encoded))
        self.assertFalse(verify_pin_hash("987655", encoded))

    def test_data_api_requires_pin(self):
        response = self.client.get("/api/members")
        self.assertEqual(response.status_code, 401)
        self.assertIn("X-Request-ID", response.headers)

    def test_auth_database_error_fails_closed(self):
        with patch("backend.main.verify_admin_session", side_effect=AuthBackendUnavailable()):
            response = self.client.get(
                "/api/members", headers={"Authorization": "Bearer test-session"}
            )
        self.assertEqual(response.status_code, 503)

    def test_session_token_is_signed_and_tamper_evident(self):
        encoded = hash_pin("987654")
        with patch("backend.security._load_pin_rows", return_value={"admin_pin_hash": encoded}):
            token = issue_admin_session()
            self.assertTrue(verify_admin_session(token))
            self.assertFalse(verify_admin_session(f"{token}x"))

    def test_untrusted_cors_origin_is_not_allowed(self):
        response = self.client.options(
            "/api/members",
            headers={
                "Origin": "https://evil.example",
                "Access-Control-Request-Method": "GET",
            },
        )
        self.assertNotEqual(response.headers.get("access-control-allow-origin"), "*")
        self.assertIsNone(response.headers.get("access-control-allow-origin"))

    def test_rate_limiter_blocks_after_five_failures(self):
        limiter = PinRateLimiter()
        for _ in range(5):
            limiter.record_failure("client")
        self.assertGreater(limiter.retry_after("client"), 0)
        limiter.reset("client")
        self.assertEqual(limiter.retry_after("client"), 0)


if __name__ == "__main__":
    unittest.main()
