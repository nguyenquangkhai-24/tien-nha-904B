# RELEASE MANIFEST

Trạng thái: **đã phát hành và kiểm tra chéo ngày 06/09/2026**.

- Repository/branch: `nguyenquangkhai-24/tien-nha-904B` / `main`.
- Audited application SHA: `a605a14866f6b5eca8b8f8625dc51043bda19c1e`.
- Rollback point: `19d14a8264d70fbcc61a085e023bf745cd4e1b65`.
- Frontend: `https://tien-nha-904-b.vercel.app`
- Backend: `https://tien-nha-904b-backend.onrender.com`
- Supabase project ref: `gfafhrjevbchdjirkktq` (đã đối chiếu khớp `SUPABASE_URL` trên Render).
- Supabase region/Postgres: `ap-southeast-1` / PostgreSQL 17, trạng thái `ACTIVE_HEALTHY`.
- Migrations đã áp dụng: `remove_expenses_and_harden_v2` (`20260905074813`) và `advisor_index_cleanup` (`20260905074908`).

## Bằng chứng cổng chất lượng

- GitHub Actions workflow `quality`, run #2 trên SHA ứng dụng: thành công.
- Backend: 14/14 test unit, contract và security thành công.
- Frontend: ESLint thành công; Next.js production build thành công.
- Supply chain: `pnpm audit --prod` và `pip-audit` không phát hiện lỗ hổng đã biết.
- Secret scan: không phát hiện credential trong source; frontend bundle không chứa service-role key.
- Supabase Advisor: không còn cảnh báo/lỗi; INFO RLS không policy là cấu hình fail-closed có chủ đích cho client roles.
- Dữ liệu: 6 thành viên active, 36 seed trùng được archive; không còn active duplicate hoặc override mồ côi.
- PIN quản trị production: `plaintext_pin_rows=0`, `valid_hash_rows=1`; migration startup giữ nguyên PIN thực tế rồi xóa plaintext cũ.

## Bằng chứng triển khai

- Vercel: deployment của SHA ứng dụng ở trạng thái `Ready`, domain production trả HTTP 200 và error rate quan sát là 0%.
- Render: deploy `dep-daee5pp7lnhs73eouv30` của SHA ứng dụng ở trạng thái `Live`; health trả HTTP 200.
- Render production env: Python 3.12.14, `ENVIRONMENT=production`, CORS chỉ cho phép domain Vercel production; secret được giữ masked.
- Backend public negative path: endpoint riêng tư không token trả 401; `/docs` trả 404; origin tin cậy được CORS cho phép, origin lạ bị từ chối.
- Security headers frontend/backend: CSP, HSTS, `nosniff`, chống frame và chính sách referrer đã được kiểm tra trên domain thật.

## Giới hạn xác minh

Luồng đăng nhập và mutation riêng tư trên production chưa được chạy bằng PIN thực của người dùng vì PIN không được đọc/trích xuất từ hệ thống. Một lần thử PIN mặc định cũ đã thất bại và được dừng ngay; không brute force. Contract xác thực/mutation đã được kiểm tra tự động ở local, còn production chỉ thực hiện smoke read-only và negative-path an toàn.

## Rollback

- Code: quay lại rollback point ở trên và redeploy frontend/backend.
- Database: migration giữ bảng legacy `extra_expenses`, không xóa lịch sử; ưu tiên forward-fix vì schema mới là additive và đã khóa quyền client.
- Kích hoạt rollback nếu health/API lỗi, auth/CORS khóa người dùng, dữ liệu sai sau migration hoặc phát hiện lộ secret.
