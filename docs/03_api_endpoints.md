# REST API ENDPOINTS

Hệ thống cần các API độc lập để Frontend gọi:

1. **GET `/api/billing/:month/:year`**: 
   - Nhiệm vụ: Lấy toàn bộ số liệu của tháng. 
   - Xử lý tại Backend: Tự động chạy CÔNG THỨC CHỐT SỔ TỔNG ở business_logic.md.
   - Trả về: Mảng JSON 6 object chứa chi tiết từng khoản của 6 thành viên (Tiền nhà, dịch vụ, xe, điện, nước, tiền mua đồ chung, tiền trừ ra, tổng cộng phải đóng).

2. **PUT `/api/monthly/:month/:year`**: Cập nhật tiền điện, tiền nước.
3. **POST `/api/expenses`**: Thêm một chi phí phát sinh mới (payload: buyer_id, item_name, amount).
4. **DELETE `/api/expenses/:id`**: Xóa chi phí phát sinh nếu nhập sai.
5. **PUT `/api/overrides`**: Cập nhật tiền xe cho một người trong một tháng cụ thể.
