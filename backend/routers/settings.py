from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field

from datetime import datetime, timezone

from backend.database import supabase
from backend.security import (
    AuthBackendUnavailable,
    VersionConflict,
    issue_admin_session,
    pin_rate_limiter,
    set_admin_pin,
    verify_admin_pin,
)


router = APIRouter(prefix="/api", tags=["Authentication & Settings"])


class LoginRequest(BaseModel):
    pin: str = Field(pattern=r"^\d{6,12}$")


class ServiceFeeRequest(BaseModel):
    value: int = Field(ge=0, le=10_000_000)
    expected_version: int = Field(ge=1)


class AdminPinRequest(BaseModel):
    pin: str = Field(pattern=r"^\d{6,12}$")
    expected_version: int = Field(ge=1)


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/auth/login")
def login(payload: LoginRequest, request: Request):
    client_key = _client_key(request)
    retry_after = pin_rate_limiter.retry_after(client_key)
    if retry_after:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Quá nhiều lần thử sai. Vui lòng thử lại sau.",
            headers={"Retry-After": str(retry_after)},
        )

    try:
        success = verify_admin_pin(payload.pin, upgrade_legacy=True)
    except AuthBackendUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dịch vụ xác thực tạm thời không sẵn sàng.",
        ) from exc

    if not success:
        pin_rate_limiter.record_failure(client_key)
        return {"success": False}

    pin_rate_limiter.reset(client_key)
    try:
        session_token = issue_admin_session()
    except AuthBackendUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Không thể tạo phiên đăng nhập.",
        ) from exc
    return {"success": True, "session_token": session_token, "expires_in": 8 * 60 * 60}


@router.get("/settings")
def get_all_settings():
    try:
        result = (
            supabase.table("global_settings")
            .select("key,value,version")
            .in_("key", ["service_fee", "admin_pin_hash"])
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Không thể tải cấu hình hệ thống.",
        ) from exc

    rows = {row["key"]: row for row in (result.data or [])}
    value = 133_000
    service_row = rows.get("service_fee")
    if service_row:
        try:
            value = int(service_row["value"])
        except (KeyError, TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cấu hình phí dịch vụ không hợp lệ.",
            ) from exc
    if not 0 <= value <= 10_000_000:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cấu hình phí dịch vụ nằm ngoài giới hạn.",
        )
    return {
        "service_fee": value,
        "service_fee_version": int(service_row.get("version", 1)) if service_row else 1,
        "admin_pin_version": int(rows.get("admin_pin_hash", {}).get("version", 1)),
    }


@router.put("/settings/service-fee")
def update_service_fee(payload: ServiceFeeRequest):
    try:
        result = (
            supabase.table("global_settings")
            .update({
                "value": str(payload.value),
                "version": payload.expected_version + 1,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })
            .eq("key", "service_fee")
            .eq("version", payload.expected_version)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Không thể cập nhật phí dịch vụ.",
        ) from exc
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phí dịch vụ vừa được một phiên khác cập nhật. Hãy tải lại.",
        )
    return {"message": "Đã cập nhật phí dịch vụ.", "data": result.data}


@router.put("/settings/admin-pin")
def update_admin_pin(payload: AdminPinRequest):
    try:
        set_admin_pin(payload.pin, payload.expected_version)
    except VersionConflict as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except AuthBackendUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Không thể cập nhật PIN.",
        ) from exc
    try:
        session_token = issue_admin_session()
    except AuthBackendUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PIN đã đổi nhưng không thể tạo phiên mới. Hãy đăng nhập lại.",
        ) from exc
    return {"message": "Đã cập nhật PIN.", "session_token": session_token, "expires_in": 8 * 60 * 60}
