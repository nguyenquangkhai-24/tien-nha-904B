# TEST PLAN

| ID | Lớp | Điều phải chứng minh |
|---|---|---|
| T-BILL-001 | Golden | Công thức không còn chi phí phát sinh |
| T-BILL-002 | Golden | Thành viên vắng chỉ trả phòng + dịch vụ |
| T-BILL-003 | Error | Tất cả thành viên vắng trả lỗi |
| T-AUTH-001 | Security | Thiếu/sai PIN trả 401 |
| T-AUTH-002 | Security | DB auth lỗi trả 503, không gọi router |
| T-AUTH-003 | Security | Hash PIN, legacy upgrade, rate-limit |
| T-VAL-001 | Validation | Số âm/lớn, tháng/năm/tên/PIN sai trả 422 |
| T-CON-001 | Concurrency | Hai update cùng version chỉ một thành công |
| T-IDEM-001 | Idempotency | Retry cùng key không ghi lần hai |
| T-UI-001 | Browser | Tháng/năm đồng bộ giữa form, bảng, chart |
| T-UI-002 | Browser | Không còn giao diện/chuỗi/API chi phí phát sinh |
| T-UI-003 | Browser | Không hydration error; modal có role/focus/Escape |
| T-DEP-001 | Production | Frontend/backend/DB đúng release manifest |

Mỗi cổng phải chạy test liên quan trước, sau đó chạy lại full suite để phát hiện ghi đè/hồi quy.

