# TRACEABILITY

| Yêu cầu | Code dự kiến | Test | Production evidence |
|---|---|---|---|
| BR-006 công thức | `billing_service.py` | T-BILL-001/002 | billing smoke |
| BR-007 bỏ phát sinh | frontend, router, yearly | T-UI-002 | bundle/API smoke |
| BR-008 concurrency | RPC + monthly router | T-CON-001/T-IDEM-001 | conflict smoke |
| Security baseline | middleware/auth/RLS | T-AUTH/T-VAL | 401/CORS/advisors |
| Single period state | page/dashboard/forms/chart | T-UI-001 | desktop/mobile |

