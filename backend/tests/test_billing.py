import os
import unittest
from unittest.mock import patch

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")

from backend.services import billing_service


class Response:
    def __init__(self, data):
        self.data = data


class Query:
    def __init__(self, owner, table):
        self.owner = owner
        self.table = table
        self.filters = {}

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def execute(self):
        self.owner.calls.append(self.table)
        rows = self.owner.rows.get(self.table, [])
        return Response([
            row for row in rows
            if all(row.get(key) == value for key, value in self.filters.items())
        ])


class FakeSupabase:
    def __init__(self):
        self.calls = []
        self.rows = {
            "global_settings": [{"key": "service_fee", "value": 133000}],
            "members": [
                {"id": "m1", "name": "A", "fixed_rent": 1000000},
                {"id": "m2", "name": "B", "fixed_rent": 2000000},
            ],
            "monthly_cycles": [{
                "id": "c1", "month": 9, "year": 2026,
                "electricity_amount": 300000, "water_amount": 100000,
            }],
            "monthly_overrides": [],
        }

    def table(self, name):
        return Query(self, name)


class BillingWithoutExpensesTests(unittest.TestCase):
    def test_formula_and_response_do_not_use_expenses(self):
        fake = FakeSupabase()
        with patch.object(billing_service, "supabase", fake):
            result = billing_service.calculate_member_bill(9, 2026)

        self.assertNotIn("extra_expenses", fake.calls)
        self.assertEqual(result[0]["utility_share"], 200000)
        self.assertEqual(result[0]["total_due"], 1506000)
        self.assertNotIn("extra_expense_share", result[0])
        self.assertNotIn("offset_amount", result[0])


if __name__ == "__main__":
    unittest.main()
