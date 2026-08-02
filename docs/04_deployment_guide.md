# HƯỚNG DẪN CHI TIẾT TỪ A-Z: DEPLOY HỆ THỐNG TIỀN NHÀ 904B

Tài liệu này hướng dẫn chi tiết quy trình đưa ứng dụng Tiền Nhà 904B lên môi trường thật (Production), bao gồm: **Cơ sở dữ liệu Supabase**, **GitHub**, **Backend trên Render.com** và **Frontend trên Vercel**.

---

## 🗄 BƯỚC 1: KHỞI TẠO CƠ SỞ DỮ LIỆU TRÊN SUPABASE

1. Truy cập [Supabase.com](https://supabase.com) và đăng nhập (hoặc tạo tài khoản).
2. Tạo một **New Project** mới (đặt tên: `tien-nha-904b`).
3. Mở mục **SQL Editor** trong thanh menu bên trái và dán đoạn mã SQL sau để khởi tạo 4 bảng và chèn dữ liệu 6 thành viên:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng Members
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    fixed_rent INTEGER NOT NULL
);

-- Chèn dữ liệu 6 thành viên cố định theo 01_business_logic.md
INSERT INTO members (name, fixed_rent) VALUES
    ('Duy', 3750000),
    ('Khải', 3750000),
    ('P.Khang', 3000000),
    ('N.Khang', 3000000),
    ('Thịnh', 2500000),
    ('Khoa', 2000000);

-- 2. Bảng Monthly_Cycles
CREATE TABLE IF NOT EXISTS monthly_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    electricity_amount INTEGER DEFAULT 0,
    water_amount INTEGER DEFAULT 0,
    UNIQUE (month, year)
);

-- 3. Bảng Extra_Expenses
CREATE TABLE IF NOT EXISTS extra_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID NOT NULL REFERENCES monthly_cycles(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    amount INTEGER NOT NULL
);

-- 4. Bảng Monthly_Overrides
CREATE TABLE IF NOT EXISTS monthly_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID NOT NULL REFERENCES monthly_cycles(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    parking_fee INTEGER DEFAULT 173000,
    UNIQUE (cycle_id, member_id)
);
```

4. Nhấn nút **Run** để thực thi SQL.
5. Vào **Project Settings -> API** để lấy:
   - **Project URL** (Gán cho `SUPABASE_URL`)
   - **anon / public key** (Gán cho `SUPABASE_KEY`)

---

## 🐙 BƯỚC 2: ĐẨY DỰ ÁN LÊN GITHUB

Mở Terminal tại thư mục gốc dự án (`/Users/khainguyen/Tiền nhà`):

```bash
# 1. Khởi tạo Git repository (nếu chưa khởi tạo)
git init

# 2. Kiểm tra trạng thái các file sẽ commit (file .env đã bị .gitignore bỏ qua)
git status

# 3. Add toàn bộ mã nguồn
git add .

# 4. Commit dự án
git commit -m "Initial commit: Production ready Tien Nha 904B"

# 5. Tạo repository mới trên GitHub (ví dụ đặt tên repo: tien-nha-904b)
# Sau đó liên kết và push code lên GitHub:
git branch -M main
git remote add origin https://github.com/<tai-khoan-github-cua-ban>/tien-nha-904b.git
git push -u origin main
```

---

## 🚀 BƯỚC 3: DEPLOY BACKEND LÊN RENDER.COM

1. Đăng nhập [Render.com](https://render.com).
2. Nhấn nút **New +** -> Chọn **Web Service**.
3. Kết nối với tài khoản GitHub và chọn repository `tien-nha-904b`.
4. Cấu hình dịch vụ Backend:
   - **Name:** `tien-nha-904b-backend`
   - **Region:** `Singapore`
   - **Root Directory:** *(Để trống)*
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port 10000`
5. Cuộn xuống phần **Environment Variables** và thêm 2 biến:
   - `SUPABASE_URL`: `<URL lấy từ Supabase>`
   - `SUPABASE_KEY`: `<Key lấy từ Supabase>`
6. Nhấn **Create Web Service**.
7. Chờ 2-3 phút để Render build và deploy xong. Sau khi hoàn tất, sao chép URL Backend (Ví dụ: `https://tien-nha-904b-backend.onrender.com`).

---

## ⚡ BƯỚC 4: DEPLOY FRONTEND LÊN VERCEL

1. Đăng nhập [Vercel.com](https://vercel.com).
2. Nhấn **Add New...** -> **Project**.
3. Chọn repository `tien-nha-904b` từ GitHub.
4. Cấu hình dự án:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Chọn `frontend` *(Rất quan trọng!)*
5. Mở mục **Environment Variables** và thêm:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://tien-nha-904b-backend.onrender.com/api` *(Thay bằng URL Render của bạn + `/api`)*
6. Nhấn **Deploy**.

---

## ✅ BƯỚC 5: KIỂM TRA VÀ HOÀN TẤT

1. Mở URL của Vercel (ví dụ: `https://tien-nha-904b.vercel.app`).
2. Giao diện sẽ hiển thị Bảng Chốt Sổ hàng tháng với 6 thành viên.
3. Thử thêm một chi phí phát sinh mới qua Form "Thêm Chi Phí Mua Đồ Chung".
4. Bảng tính chốt sổ sẽ tự động tính toán lại theo đúng công thức:
   $$\text{Tổng đóng} = \text{Tiền phòng} + 133k + \text{Tiền xe} + \frac{\text{Điện}+\text{Nước}}{6} + \frac{\text{Phát sinh}}{6} - \text{Đã ứng}$$
5. Bấm **Copy tin nhắn Messenger** và dán vào nhóm chat nhà 904B!
