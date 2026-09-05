# LUẬT NGHIỆP VỤ — TIỀN NHÀ 904B

Tài liệu này là nguồn sự thật cho công thức tính tiền. Khi thay đổi công thức, phải cập nhật tài liệu, API contract và test trong cùng một commit.

## BR-001 — Thành viên và tiền phòng

- Thành viên được quản lý trong bảng `members`.
- Mỗi thành viên có `name` duy nhất (không phân biệt hoa/thường) và `fixed_rent` từ 0 đến 100.000.000đ.
- Dữ liệu khởi tạo: Duy 3.750.000đ; Khải 3.750.000đ; P.Khang 3.000.000đ; N.Khang 3.000.000đ; Thịnh 2.500.000đ; Khoa 2.000.000đ.

## BR-002 — Phí dịch vụ

- `service_fee` là phí áp dụng cho từng thành viên, mặc định 133.000đ/người/tháng.
- Giá trị hợp lệ từ 0 đến 10.000.000đ.

## BR-003 — Phí gửi xe

- Mặc định 173.000đ/người/tháng.
- Có thể ghi đè theo thành viên và tháng, trong khoảng 0 đến 10.000.000đ.
- Thành viên được đánh dấu vắng mặt không đóng phí gửi xe của tháng đó.

## BR-004 — Điện và nước

- Tổng điện và tổng nước của tháng đều từ 0 đến 100.000.000đ.
- Tổng điện + nước được chia đều cho số thành viên không bị đánh dấu vắng mặt.
- Làm tròn bằng quy tắc `round` hiện hành của Python; golden tests phải khóa các ví dụ có phần lẻ.
- Nếu tất cả thành viên đều vắng mặt, API trả lỗi dữ liệu thay vì âm thầm chia cho 1.

## BR-005 — Thành viên vắng mặt

- Thành viên vắng mặt chỉ đóng tiền phòng cố định và phí dịch vụ.
- Phí gửi xe và phần chia điện/nước bằng 0.

## BR-006 — Công thức chốt sổ

Với thành viên đang ở:

```text
total_due = fixed_rent + service_fee + parking_fee + utility_share
utility_share = round((electricity_amount + water_amount) / active_member_count)
```

Với thành viên vắng mặt:

```text
total_due = fixed_rent + service_fee
parking_fee = 0
utility_share = 0
```

## BR-007 — Loại bỏ chi phí phát sinh

- Hệ thống không cho thêm, xem, xóa hoặc tính “chi phí phát sinh/đã chi hộ”.
- API và UI không trả các trường `extra_expense_share`, `offset_amount`, `bill_url`.
- Bảng `extra_expenses` cũ được giữ lại tạm thời để bảo toàn lịch sử, nhưng bị thu hồi quyền Data API và không được code production truy cập.

## BR-008 — Cập nhật đồng thời

- Mỗi bản ghi tháng và tùy chỉnh thành viên có cột `version`.
- Client gửi `expected_version`; server chỉ cập nhật khi phiên bản khớp.
- Nếu dữ liệu đã được người khác sửa, API trả `409 Conflict`; UI tải lại dữ liệu mới và yêu cầu người dùng thử lại.
- Mỗi mutation nhận `idempotency_key`; gửi lại cùng khóa phải trả cùng kết quả và không ghi lần thứ hai.
