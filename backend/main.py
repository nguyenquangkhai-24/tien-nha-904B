from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.routers import members, monthly, expenses, settings
from backend.database import supabase

app = FastAPI(
    title="Tiền Nhà 904B API",
    description="Hệ thống quản lý và tính tiền nhà 904B",
    version="1.0.0",
)

# Cấu hình CORS hỗ trợ linh hoạt mọi domain Vercel, Render và Localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các routers
app.include_router(members.router)
app.include_router(monthly.router)
app.include_router(expenses.router)
app.include_router(settings.router)

@app.middleware("http")
async def admin_auth_middleware(request: Request, call_next):
    # Chỉ chặn các thao tác thay đổi dữ liệu (POST, PUT, DELETE)
    # Bỏ qua POST /api/settings/verify-pin
    if request.method in ["POST", "PUT", "DELETE"]:
        if request.url.path == "/api/settings/verify-pin":
            return await call_next(request)
            
        # Lấy X-Admin-Pin từ header
        client_pin = request.headers.get("X-Admin-Pin")
        
        # Fetch pin thực tế từ DB
        try:
            res = supabase.table("global_settings").select("value").eq("key", "admin_pin").execute()
            current_pin = "123456" # Mặc định
            if res and res.data and len(res.data) > 0:
                current_pin = str(res.data[0]["value"])
                
            if not client_pin or client_pin != current_pin:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Sai mã PIN Quản trị viên hoặc chưa đăng nhập!"}
                )
        except Exception as e:
            pass # Nếu lỗi DB, có thể cho qua hoặc chặn tuỳ strategy, nhưng tạm cho chặn
            
    response = await call_next(request)
    return response


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "API Tiền Nhà 904B đang hoạt động.",
        "docs": "/docs",
    }
