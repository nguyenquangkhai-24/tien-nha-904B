# SECURITY BASELINE

- API dữ liệu fail-closed; DB lỗi trong auth phải trả 503, không cho request đi tiếp.
- PIN 6–12 chữ số, lưu PBKDF2-SHA256 với salt ngẫu nhiên; hỗ trợ nâng cấp một lần từ plaintext legacy.
- PIN không nằm trong localStorage, source, log, response hoặc frontend bundle; sau login chỉ token ký số 8 giờ được giữ trong bộ nhớ tab.
- Khóa ký token được dẫn xuất từ hash PIN hiện tại; đổi PIN làm token cũ mất hiệu lực mà không cần lưu session phía server.
- Login giới hạn 5 lần sai/5 phút/IP; đây là lớp ứng dụng một instance, có thể nâng cấp Redis khi scale ngang.
- CORS chỉ cho domain Vercel production/preview được cấu hình và localhost phát triển.
- Security headers: CSP, HSTS ở production, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors none.
- Backend trả lỗi đã làm sạch cùng `X-Request-ID`.
- Supabase RLS bật cho toàn bộ bảng public; Data API roles không được truy cập trực tiếp. Backend là ranh giới duy nhất.
- Swagger/ReDoc/OpenAPI tắt ở production.
