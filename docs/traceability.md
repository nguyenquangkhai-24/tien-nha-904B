# TRACEABILITY

| Yêu cầu | Chủ sở hữu trong code | Test | Production evidence |
|---|---|---|---|
| BR-006 công thức | `backend/services/billing_service.py` | T-BILL-001/002 | response schema và contract test không còn trường phát sinh |
| BR-007 bỏ phát sinh | `frontend/src`, backend router/service, migration legacy lock | T-UI-002 + negative search + route 404 | bundle không có service/route phát sinh; API cũ 404 |
| BR-008 concurrency | RPC v2 + `backend/routers/monthly.py` + version trong client | T-CON-001/T-IDEM-001 | optimistic conflict 409 và retry idempotent được kiểm bằng contract/integration |
| Security baseline | `backend/security.py`, middleware, RLS/grants, CSP/CORS | T-AUTH/T-VAL + secret/dependency scan | 401/404, CORS trusted/evil, headers và Advisor production |
| Single period state | `page.jsx`, dashboard, forms, chart | T-UI-001 + lint/build/browser | desktop/mobile local; public lock screen production |
| PIN không lưu plaintext | lifespan startup + `ensure_admin_pin_is_hashed` | T-PIN-MIG/T-PIN-INVALID | production: 0 plaintext, 1 PBKDF2 hash hợp lệ |
| Chuỗi triển khai đúng release | workflow, Vercel, Render, Supabase migrations | CI + build + smoke | application SHA `a605a14866f6b5eca8b8f8625dc51043bda19c1e` |
