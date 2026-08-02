# Frontend Application - Tiền Nhà 904B (Next.js & TailwindCSS)

---

## 🚀 Hướng Dẫn Deploy Frontend lên Vercel

### 1. Chuẩn bị biến môi trường (Environment Variables)
Ứng dụng Next.js sử dụng biến môi trường `NEXT_PUBLIC_API_URL` được định nghĩa trong `src/services/api.js`:

```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
```

- **Khi chạy local:** Hệ thống tự động fallback về `http://localhost:8000/api`.
- **Khi deploy lên Vercel:** Bạn cần thêm biến môi trường này trong Vercel Dashboard.

---

### 2. Các bước cấu hình trên Vercel Dashboard

1. Đăng nhập vào [Vercel.com](https://vercel.com) và chọn **Add New... -> Project**.
2. Kết nối tới Repository GitHub của dự án `Tiền nhà 904B`.
3. Tại phần **Root Directory**, chọn thư mục `frontend`.
4. Mở mục **Environment Variables** và điền:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://<tên-app-backend-cua-ban>.onrender.com/api` (URL Web Service Backend vừa deploy trên Render).
5. Nhấn **Deploy**.

---

## 💻 Chạy Local

```bash
cd frontend
npm install
npm run dev
```

Truy cập: `http://localhost:3000`
