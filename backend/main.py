from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import members, monthly, expenses

app = FastAPI(
    title="Tiền Nhà 904B API",
    description="Hệ thống quản lý và tính tiền nhà 904B",
    version="1.0.0",
)

# Cấu hình CORS để Frontend (localhost:3000, 5173, ...) có thể gọi được API
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*",  # Cho phép tất cả các nguồn truy cập trong môi trường dev
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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
        "message": "API Tiền Nhà 904B đang hoạt động.",
        "docs": "/docs",
    }
