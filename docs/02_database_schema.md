# CẤU TRÚC DATABASE

Bao gồm 4 bảng (Tables) cho cơ sở dữ liệu quan hệ (ví dụ: PostgreSQL/Supabase):

1. **Members:** Lưu thông tin cố định.
   - `id`: UUID (Primary Key)
   - `name`: String (Duy, Khải, P.Khang, N.Khang, Thịnh, Khoa)
   - `fixed_rent`: Integer (Tiền phòng)

2. **Monthly_Cycles:** Lưu hóa đơn chung hàng tháng.
   - `id`: UUID
   - `month`: Integer (1-12)
   - `year`: Integer
   - `electricity_amount`: Integer (Mặc định 0)
   - `water_amount`: Integer (Mặc định 0)

3. **Extra_Expenses:** Lưu đồ mua chung.
   - `id`: UUID
   - `cycle_id`: UUID (Foreign Key -> Monthly_Cycles.id)
   - `buyer_id`: UUID (Foreign Key -> Members.id)
   - `item_name`: String
   - `amount`: Integer

4. **Monthly_Overrides:** Lưu các tùy chỉnh riêng biệt theo tháng (ví dụ tiền xe tháng 8).
   - `id`: UUID
   - `cycle_id`: UUID (Foreign Key -> Monthly_Cycles.id)
   - `member_id`: UUID (Foreign Key -> Members.id)
   - `parking_fee`: Integer (Nếu Null, lấy mặc định 173.000đ)
