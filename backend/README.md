# Backend Application - Tiền Nhà 904B

Hệ thống Backend FastAPI quản lý và tính toán tiền nhà 904B kết nối với Supabase.

---

## 🚀 Hướng Dẫn Chạy Server FastAPI Tại Local

### 1. Chuẩn bị môi trường Python
Mở Terminal tại thư mục `backend/`:

```bash
# Tạo môi trường ảo (Virtual Environment)
python3 -m venv venv

# Kích hoạt môi trường ảo
# Trên macOS / Linux:
source venv/bin/activate

# Trên Windows (PowerShell):
# .\venv\Scripts\Activate.ps1
```

### 2. Cài đặt các thư viện phụ thuộc
```bash
pip install -r requirements.txt
```

### 3. Cấu hình biến môi trường (`.env`)
Tạo file `.env` tại thư mục gốc của project (hoặc thư mục `backend/`) với nội dung:

```env
SUPABASE_URL=https://your-supabase-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-key
```

### 4. Khởi chạy Server với Uvicorn
Chạy lệnh sau từ thư mục gốc của dự án:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Hoặc nếu đang đứng ở trong thư mục `backend/`:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📌 Các Đường Dẫn Quan Trọng
- **API Server**: `http://localhost:8000`
- **Swagger Documentation (API Docs)**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 🛠 Danh Sách REST API Endpoints

1. **GET `/api/billing/:month/:year`**
   - Lấy chi tiết tính toán hóa đơn chốt sổ của 6 thành viên trong tháng.
2. **PUT `/api/monthly/:month/:year`**
   - Cập nhật tiền điện và tiền nước của tháng.
3. **POST `/api/expenses`**
   - Thêm một khoản chi phí phát sinh (người mua, món đồ, số tiền).
4. **DELETE `/api/expenses/:id`**
   - Xóa khoản chi phí phát sinh theo ID.
5. **PUT `/api/overrides`**
   - Ghi đè số tiền gửi xe cho một cá nhân trong tháng cụ thể.
6. **GET `/api/members`**
   - Lấy danh sách thông tin 6 thành viên.
