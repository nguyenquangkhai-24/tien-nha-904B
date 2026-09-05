import os
import unittest
from unittest.mock import patch

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")

from fastapi.testclient import TestClient

from backend.main import app


class ApiContractTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.auth = patch("backend.main.verify_admin_session", return_value=True)
        self.auth.start()

    def tearDown(self):
        self.auth.stop()

    def test_removed_expenses_route_returns_not_found(self):
        response = self.client.get("/api/expenses/9/2026", headers={"Authorization": "Bearer test"})
        self.assertEqual(response.status_code, 404)

    def test_money_bounds_are_rejected(self):
        response = self.client.put(
            "/api/monthly/9/2026",
            headers={"Authorization": "Bearer test"},
            json={
                "electricity_amount": -1,
                "water_amount": 0,
                "expected_version": 0,
                "idempotency_key": "11111111-1111-4111-8111-111111111111",
            },
        )
        self.assertEqual(response.status_code, 422)

    def test_invalid_year_is_rejected(self):
        response = self.client.get("/api/billing/9/2200", headers={"Authorization": "Bearer test"})
        self.assertEqual(response.status_code, 422)

    def test_version_conflict_is_mapped_to_409(self):
        with patch("backend.routers.monthly.supabase") as database:
            database.rpc.return_value.execute.side_effect = Exception("VERSION_CONFLICT")
            response = self.client.put(
                "/api/monthly/9/2026",
                headers={"Authorization": "Bearer test"},
                json={
                    "electricity_amount": 100000,
                    "water_amount": 200000,
                    "expected_version": 3,
                    "idempotency_key": "22222222-2222-4222-8222-222222222222",
                },
            )
        self.assertEqual(response.status_code, 409)


if __name__ == "__main__":
    unittest.main()
