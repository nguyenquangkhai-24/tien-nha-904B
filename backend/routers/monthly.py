from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Path, status
from pydantic import BaseModel, Field

from backend.database import supabase
from backend.services.billing_service import BillingDataError, calculate_member_bill


router = APIRouter(prefix="/api", tags=["Monthly & Billing"])


class MutationBase(BaseModel):
    expected_version: int = Field(ge=0)
    idempotency_key: UUID


class UpdateMonthlyRequest(MutationBase):
    electricity_amount: int = Field(ge=0, le=100_000_000)
    water_amount: int = Field(ge=0, le=100_000_000)


class UpdateOverrideRequest(MutationBase):
    member_id: UUID
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2024, le=2100)
    parking_fee: int = Field(ge=0, le=10_000_000)
    is_excluded: bool = False


class UpdateStatusRequest(MutationBase):
    member_id: UUID
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2024, le=2100)
    is_paid: bool


def _rpc(name: str, params: dict[str, Any]):
    try:
        result = supabase.rpc(name, params).execute()
    except Exception as exc:
        message = str(exc).upper()
        if "VERSION_CONFLICT" in message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Dữ liệu vừa được người khác cập nhật. Hãy tải lại trước khi lưu.",
            ) from exc
        if "IDEMPOTENCY_KEY_REUSED" in message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Khóa chống ghi trùng đã được dùng cho một request khác.",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database tạm thời không sẵn sàng.",
        ) from exc
    data = result.data
    if isinstance(data, list) and len(data) == 1:
        return data[0]
    return data


@router.get("/health")
def health():
    return {"status": "ok", "service": "tien-nha-904b-api", "version": "2.0.0"}


@router.get("/health/database")
def database_health():
    try:
        result = supabase.table("members").select("id", count="exact").limit(1).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database tạm thời không sẵn sàng.",
        ) from exc
    return {"status": "ok", "member_count": result.count}


@router.get("/billing/{month}/{year}")
def get_monthly_billing(
    month: int = Path(ge=1, le=12),
    year: int = Path(ge=2024, le=2100),
):
    try:
        return calculate_member_bill(month, year)
    except BillingDataError as exc:
        code = status.HTTP_409_CONFLICT if "tất cả thành viên" in str(exc) else status.HTTP_503_SERVICE_UNAVAILABLE
        raise HTTPException(status_code=code, detail=str(exc)) from exc


@router.put("/monthly/{month}/{year}")
def update_monthly_utilities(
    payload: UpdateMonthlyRequest,
    month: int = Path(ge=1, le=12),
    year: int = Path(ge=2024, le=2100),
):
    data = _rpc("update_monthly_utilities_v2", {
        "p_month": month,
        "p_year": year,
        "p_electricity": payload.electricity_amount,
        "p_water": payload.water_amount,
        "p_expected_version": payload.expected_version,
        "p_idempotency_key": str(payload.idempotency_key),
    })
    return {"message": "Cập nhật tiền điện nước thành công.", "data": data}


@router.put("/overrides")
def update_parking_override(payload: UpdateOverrideRequest):
    data = _rpc("update_member_override_v2", {
        "p_member_id": str(payload.member_id),
        "p_month": payload.month,
        "p_year": payload.year,
        "p_parking_fee": payload.parking_fee,
        "p_is_excluded": payload.is_excluded,
        "p_expected_version": payload.expected_version,
        "p_idempotency_key": str(payload.idempotency_key),
    })
    return {"message": "Cập nhật tùy chỉnh thành viên thành công.", "data": data}


@router.put("/overrides/status")
def update_payment_status(payload: UpdateStatusRequest):
    data = _rpc("update_payment_status_v2", {
        "p_member_id": str(payload.member_id),
        "p_month": payload.month,
        "p_year": payload.year,
        "p_is_paid": payload.is_paid,
        "p_expected_version": payload.expected_version,
        "p_idempotency_key": str(payload.idempotency_key),
    })
    return {"message": "Cập nhật trạng thái thu tiền thành công.", "data": data}


@router.get("/yearly/{year}")
def get_yearly_stats(year: int = Path(ge=2024, le=2100)):
    try:
        response = (
            supabase.table("monthly_cycles")
            .select("month,electricity_amount,water_amount")
            .eq("year", year)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Không thể tải thống kê năm.",
        ) from exc

    cycle_map = {int(row["month"]): row for row in (response.data or [])}
    stats = []
    for month in range(1, 13):
        row = cycle_map.get(month, {})
        try:
            electricity = int(row.get("electricity_amount", 0) or 0)
            water = int(row.get("water_amount", 0) or 0)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Dữ liệu thống kê không hợp lệ.",
            ) from exc
        stats.append({
            "month": month,
            "electricity": electricity,
            "water": water,
            "total": electricity + water,
        })
    return stats
