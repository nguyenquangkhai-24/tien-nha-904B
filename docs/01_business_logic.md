# LUẬT NGHIỆP VỤ (BUSINESS LOGIC) - TIỀN NHÀ 904B

## 1. Thành viên & Tiền phòng cố định
Căn nhà có 6 thành viên với tiền phòng cố định không đổi:
- Duy: 3.750.000đ
- Khải: 3.750.000đ
- P.Khang: 3.000.000đ
- N.Khang: 3.000.000đ
- Thịnh: 2.500.000đ
- Khoa: 2.000.000đ

## 2. Các loại phí cố định khác
- **Phí dịch vụ:** 800.000đ / tháng => Mặc định chia đều mỗi người 133.000đ.
- **Phí gửi xe:** Mặc định 173.000đ / người / tháng. Tuy nhiên, hệ thống PHẢI cho phép nhập ghi đè (override) số tiền gửi xe cho từng cá nhân trong từng tháng (vì tháng 8/2026 có mức đóng khác nhau giữa các thành viên).

## 3. Chi phí biến đổi hàng tháng
- **Tiền điện & Tiền nước:** Tổng tiền nhập vào hàng tháng. Công thức: (Tổng Điện + Tổng Nước) / 6.

## 4. Chi phí phát sinh (Shared Expenses)
Người dùng nhập theo cấu trúc: Người mua | Vật phẩm | Số tiền.
- **Công thức tính phát sinh:** 
  - Khoản cần đóng chung = Tổng tất cả chi phí phát sinh / 6.
  - Số tiền được trừ (Offset) = Tổng số tiền mà một người ĐÃ ứng ra mua đồ trong tháng đó.

## 5. CÔNG THỨC CHỐT SỔ CUỐI CÙNG (FINAL FORMULA)
Số tiền 1 người phải đóng trong tháng = 
    Tiền phòng cố định (1) 
  + 133.000đ (2) 
  + Tiền gửi xe của tháng đó (3) 
  + [(Tổng điện + Tổng nước) / 6] (4)
  + (Tổng chi phí phát sinh cả nhà / 6) (5)
  - Tổng số tiền người đó đã ứng ra mua đồ phát sinh (6)
