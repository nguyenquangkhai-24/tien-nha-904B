# QUY TRÌNH DEPLOY TIỀN NHÀ 904B

Production gồm GitHub → Render (FastAPI) → Supabase và GitHub → Vercel (Next.js). Không được kết luận “đã deploy” chỉ vì URL trả 200.

## Cổng 1 — Trước khi merge

1. `git status` chỉ chứa thay đổi có chủ đích.
2. Backend: unit + integration + concurrency + security tests đạt.
3. Frontend: lint, build, dependency audit và browser verification đạt ở desktop/mobile.
4. Secret scan không tìm thấy khóa thật; `.env` bị ignore.
5. Migration đã review và test trên project/branch phù hợp; Supabase security/performance advisors đã đọc.

## Cổng 2 — Database

1. Xác nhận đúng Supabase project ref mà Render đang dùng.
2. Xác nhận Render dùng secret/service-role key; tuyệt đối không bật RLS rồi dùng anon key cho backend.
3. Backup hoặc snapshot trước DDL có rủi ro.
4. Áp dụng migration theo thứ tự trong `supabase/migrations`.
5. Chạy query kiểm tra constraints, RLS, grants, RPC và dữ liệu 6 thành viên.

## Cổng 3 — GitHub và CI

1. Commit nhỏ theo từng cổng; không `git add .` khi có file ngoài phạm vi.
2. Push `main` sau khi full suite xanh.
3. GitHub Actions phải chạy backend tests, frontend lint/build và audit.
4. Ghi commit SHA vào `docs/release_manifest.md`.

## Cổng 4 — Render

- Root directory: repository root.
- Build: `pip install -r backend/requirements.txt`.
- Start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`.
- Secret env: `SUPABASE_URL`, `SUPABASE_KEY` (secret/service-role), `ALLOWED_ORIGINS`, `ENVIRONMENT=production`.
- Sau deploy: kiểm `/api/health`, readiness có auth, log error và backend commit SHA nếu nền tảng cung cấp.

## Cổng 5 — Vercel

- Root directory: `frontend`.
- Env: `NEXT_PUBLIC_API_URL=https://tien-nha-904b-backend.onrender.com/api`.
- Domain production hiện tại: `https://tien-nha-904-b.vercel.app`.
- Kiểm generated deployment trước, rồi production alias; xác nhận build gắn đúng Git commit.

## Cổng 6 — Smoke test production

1. Trang tải không có hydration/runtime error.
2. Khi chưa đăng nhập, API dữ liệu trả 401 và UI mở modal truy cập; không có PIN trong các request sau login.
3. Đăng nhập; tải billing, members, settings và yearly thành công.
4. Kiểm tra update điện/nước; gửi lại cùng idempotency key không ghi hai lần.
5. Hai cập nhật dùng cùng version: một thành công, một trả 409.
6. Kiểm CORS từ origin lạ bị từ chối; không có secret trong bundle/log.
7. Kiểm desktop/mobile, bàn phím, modal và chức năng copy/xuất hóa đơn.

## Rollback

- Vercel/Render: quay lại deployment trước theo commit SHA.
- Database: migration chỉ bổ sung cột/hàm/quyền và không xóa `extra_expenses`; rollback ứng dụng không mất dữ liệu legacy.
- Nếu smoke test tài chính thất bại, rollback code trước, không nhập thêm dữ liệu cho đến khi đối chiếu xong.
