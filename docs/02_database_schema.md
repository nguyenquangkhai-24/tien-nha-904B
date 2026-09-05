# CẤU TRÚC DATABASE

Schema production dùng PostgreSQL/Supabase. Mọi bảng trong `public` phải bật RLS; `anon` và `authenticated` không có quyền trực tiếp. Backend dùng secret/service-role key lưu trong secret manager.

## Bảng đang hoạt động

### `members`

- `id UUID PRIMARY KEY`
- `name TEXT NOT NULL`, dài 1–80, duy nhất không phân biệt hoa/thường
- `fixed_rent BIGINT NOT NULL`, 0–100.000.000
- `created_at`, `updated_at`

### `monthly_cycles`

- `id UUID PRIMARY KEY`
- `month INTEGER`, 1–12
- `year INTEGER`, 2024–2100
- `electricity_amount BIGINT`, 0–100.000.000
- `water_amount BIGINT`, 0–100.000.000
- `version INTEGER NOT NULL DEFAULT 1`
- `created_at`, `updated_at`
- `UNIQUE(month, year)`

### `monthly_overrides`

- `id UUID PRIMARY KEY`
- `cycle_id UUID REFERENCES monthly_cycles(id) ON DELETE CASCADE`
- `member_id UUID REFERENCES members(id) ON DELETE CASCADE`
- `parking_fee BIGINT`, 0–10.000.000
- `is_paid BOOLEAN NOT NULL DEFAULT false`
- `is_excluded BOOLEAN NOT NULL DEFAULT false`
- `version INTEGER NOT NULL DEFAULT 1`
- `created_at`, `updated_at`
- `UNIQUE(cycle_id, member_id)`

### `global_settings`

- `key TEXT PRIMARY KEY`, chỉ nhận `service_fee`, `admin_pin_hash`
- `value TEXT NOT NULL`
- `updated_at`

### `mutation_receipts`

- `idempotency_key UUID PRIMARY KEY`
- `operation TEXT NOT NULL`
- `request_hash TEXT NOT NULL`
- `response JSONB NOT NULL`
- `created_at`; dữ liệu cũ hơn 30 ngày có thể được dọn bằng tác vụ bảo trì.

## Dữ liệu legacy

`extra_expenses` không còn thuộc luồng nghiệp vụ. Migration không xóa bảng để tránh mất dữ liệu lịch sử, nhưng thu hồi quyền `anon/authenticated`, bật RLS không policy và đổi comment thành `LEGACY_DISABLED`.

## Hàm database

- `update_monthly_utilities_v2`: transaction, kiểm tra version, idempotency.
- `update_member_override_v2`: chỉ cập nhật phí xe/vắng mặt, giữ nguyên trạng thái thanh toán.
- `update_payment_status_v2`: chỉ cập nhật trạng thái, giữ nguyên phí xe/vắng mặt.
- Các hàm là `SECURITY DEFINER`, đặt `search_path` cố định, thu hồi `EXECUTE` khỏi `PUBLIC/anon/authenticated` và chỉ cấp cho `service_role`.
