from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import members, monthly, expenses

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


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "API Tiền Nhà 904B đang hoạt động.",
        "docs": "/docs",
    }
