# REST API CONTRACT

Base path: `/api`. Trừ `/api/health` và `/api/auth/login`, mọi endpoint yêu cầu header `X-Admin-Pin`. PIN chỉ được giữ trong bộ nhớ của tab và gửi qua HTTPS.

## Authentication

- `POST /api/auth/login` — kiểm tra PIN, rate-limit theo IP; PIN plaintext cũ được nâng cấp sang PBKDF2 khi đăng nhập thành công.
- `POST /api/auth/logout` — xóa PIN phía client; server không tạo cookie/session.
- `PUT /api/settings/admin-pin` — đổi PIN; yêu cầu PIN hiện tại qua middleware.

## Read

- `GET /api/health` — liveness, không đọc DB.
- `GET /api/health/database` — readiness có xác thực.
- `GET /api/billing/{month}/{year}` — hóa đơn theo BR-006; trả `cycle_version` và `override_version` để cập nhật lạc quan.
- `GET /api/yearly/{year}` — chỉ thống kê điện, nước và tổng.
- `GET /api/members`
- `GET /api/settings` — không bao giờ trả PIN/hash.

## Mutations

Mọi mutation tài chính gửi `idempotency_key` UUID. Cập nhật bản ghi hiện có gửi `expected_version`; conflict trả HTTP 409.

- `PUT /api/monthly/{month}/{year}` — `{electricity_amount, water_amount, expected_version, idempotency_key}`
- `PUT /api/overrides` — `{member_id, month, year, parking_fee, is_excluded, expected_version, idempotency_key}`
- `PUT /api/overrides/status` — `{member_id, month, year, is_paid, expected_version, idempotency_key}`
- `POST /api/members`
- `PUT /api/members/{member_id}`
- `DELETE /api/members/{member_id}` — trả 409 nếu thành viên đã có dữ liệu liên quan.
- `PUT /api/settings/service-fee`
- `PUT /api/settings/admin-pin`

## Quy ước lỗi

- `400`: request sai cấu trúc nghiệp vụ.
- `401`: thiếu/sai PIN.
- `409`: version cũ, tên trùng hoặc xung đột dữ liệu.
- `422`: Pydantic từ chối range/type/size.
- `429`: quá nhiều lần đăng nhập sai.
- `503`: DB không sẵn sàng. Response chỉ có thông báo an toàn và `request_id`; không trả lỗi Supabase thô.
