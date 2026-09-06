# REST API CONTRACT

Base path: `/api`. Trừ `/api/health` và `/api/auth/login`, mọi endpoint yêu cầu `Authorization: Bearer <session_token>`. PIN chỉ được gửi một lần qua HTTPS để đăng nhập; token ký số có hạn 8 giờ chỉ nằm trong bộ nhớ tab.

## Authentication

- `POST /api/auth/login` — kiểm tra PIN, rate-limit theo IP và trả token ký số ngắn hạn; PIN plaintext cũ đã được nâng cấp sang PBKDF2 lúc backend khởi động.
- Đăng xuất xóa token phía client; server không tạo cookie.
- `PUT /api/settings/admin-pin` — đổi PIN với `expected_version`; mọi token cũ tự mất hiệu lực.

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
- `PUT /api/members/{member_id}` — gửi `expected_version`.
- `DELETE /api/members/{member_id}?expected_version=N` — trả 409 nếu version cũ hoặc thành viên đã có dữ liệu liên quan.
- `PUT /api/settings/service-fee` — gửi `expected_version`.
- `PUT /api/settings/admin-pin` — gửi `expected_version`.

## Quy ước lỗi

- `400`: request sai cấu trúc nghiệp vụ.
- `401`: thiếu/sai/hết hạn phiên.
- `409`: version cũ, tên trùng hoặc xung đột dữ liệu.
- `422`: Pydantic từ chối range/type/size.
- `429`: quá nhiều lần đăng nhập sai.
- `503`: DB không sẵn sàng. Response chỉ có thông báo an toàn và `request_id`; không trả lỗi Supabase thô.
