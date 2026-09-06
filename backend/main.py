import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import IS_PRODUCTION, get_allowed_origins
from backend.routers import members, monthly, settings
from backend.security import AuthBackendUnavailable, ensure_admin_pin_is_hashed, verify_admin_session


logger = logging.getLogger("tien_nha_api")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_admin_pin_is_hashed()
    yield


app = FastAPI(
    title="Tiền Nhà 904B API",
    description="Hệ thống quản lý và tính tiền nhà 904B",
    version="2.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)

app.include_router(members.router)
app.include_router(monthly.router)
app.include_router(settings.router)

PUBLIC_API_PATHS = {"/api/health", "/api/auth/login"}


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id

    if (
        request.method != "OPTIONS"
        and request.url.path.startswith("/api")
        and request.url.path not in PUBLIC_API_PATHS
    ):
        authorization = request.headers.get("Authorization", "")
        token = authorization[7:] if authorization.startswith("Bearer ") else ""
        try:
            authenticated = bool(token) and verify_admin_session(token)
        except AuthBackendUnavailable:
            return _secure_response(
                JSONResponse(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    content={"detail": "Dịch vụ xác thực tạm thời không sẵn sàng.", "request_id": request_id},
                ),
                request_id,
            )
        if not authenticated:
            return _secure_response(
                JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Phiên truy cập thiếu, sai hoặc đã hết hạn.", "request_id": request_id},
                ),
                request_id,
            )

    response = await call_next(request)
    return _secure_response(response, request_id)


def _secure_response(response, request_id: str):
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    response.headers["Cache-Control"] = "no-store"
    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": exc.errors(), "request_id": request_id},
    )


@app.exception_handler(Exception)
async def unexpected_error_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        raise exc
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.exception("Unhandled request error request_id=%s", request_id)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Lỗi máy chủ nội bộ.", "request_id": request_id},
    )


@app.get("/")
def read_root():
    return {"status": "online", "message": "API Tiền Nhà 904B đang hoạt động.", "version": "2.0.0"}
