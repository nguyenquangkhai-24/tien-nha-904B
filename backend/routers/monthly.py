from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from backend.database import supabase
from backend.services.billing_service import calculate_member_bill

router = APIRouter(prefix="/api", tags=["Monthly & Billing"])


class UpdateMonthlyRequest(BaseModel):
    electricity_amount: int = 0
    water_amount: int = 0


class UpdateOverrideRequest(BaseModel):
    member_id: UUID
    month: int
    year: int
    parking_fee: int


@router.get("/billing/{month}/{year}")
def get_monthly_billing(month: int, year: int):
    """
    1. GET /api/billing/:month/:year
    Lấy toàn bộ số liệu chốt sổ của tháng theo đúng CÔNG THỨC CHỐT SỔ TỔNG ở 01_business_logic.md.
    """
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tháng không hợp lệ (phải từ 1 đến 12).",
        )
    return calculate_member_bill(month, year)


@router.put("/monthly/{month}/{year}")
def update_monthly_utilities(month: int, year: int, payload: UpdateMonthlyRequest):
    """
    2. PUT /api/monthly/:month/:year
    Cập nhật tổng tiền điện và tiền nước hàng tháng.
    """
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tháng không hợp lệ (phải từ 1 đến 12).",
        )

    # Kiểm tra chu kỳ tháng đã tồn tại chưa
    res = (
        supabase.table("monthly_cycles")
        .select("*")
        .eq("month", month)
        .eq("year", year)
        .execute()
    )

    if res and res.data:
        cycle_id = res.data[0]["id"]
        update_res = (
            supabase.table("monthly_cycles")
            .update({
                "electricity_amount": payload.electricity_amount,
                "water_amount": payload.water_amount,
            })
            .eq("id", cycle_id)
            .execute()
        )
        return {
            "message": "Cập nhật tiền điện nước thành công.",
            "data": update_res.data,
        }
    else:
        # Tạo chu kỳ mới nếu chưa tồn tại
        insert_res = (
            supabase.table("monthly_cycles")
            .insert({
                "month": month,
                "year": year,
                "electricity_amount": payload.electricity_amount,
                "water_amount": payload.water_amount,
            })
            .execute()
        )
        return {
            "message": "Tạo mới chu kỳ tháng và cập nhật tiền điện nước thành công.",
            "data": insert_res.data,
        }


@router.put("/overrides")
def update_parking_override(payload: UpdateOverrideRequest):
    """
    5. PUT /api/overrides
    Cập nhật tiền gửi xe cho một người trong một tháng cụ thể.
    """
    # Lấy hoặc tạo mới cycle_id cho (month, year)
    cycle_res = (
        supabase.table("monthly_cycles")
        .select("*")
        .eq("month", payload.month)
        .eq("year", payload.year)
        .execute()
    )

    if cycle_res and cycle_res.data:
        cycle_id = cycle_res.data[0]["id"]
    else:
        new_cycle = (
            supabase.table("monthly_cycles")
            .insert({
                "month": payload.month,
                "year": payload.year,
                "electricity_amount": 0,
                "water_amount": 0,
            })
            .execute()
        )
        cycle_id = new_cycle.data[0]["id"]

    # Kiểm tra xem đã có ghi đè cho member trong cycle này chưa
    ov_res = (
        supabase.table("monthly_overrides")
        .select("*")
        .eq("cycle_id", cycle_id)
        .eq("member_id", str(payload.member_id))
        .execute()
    )

    if ov_res and ov_res.data:
        ov_id = ov_res.data[0]["id"]
        result = (
            supabase.table("monthly_overrides")
            .update({"parking_fee": payload.parking_fee})
            .eq("id", ov_id)
            .execute()
        )
    else:
        result = (
            supabase.table("monthly_overrides")
            .insert({
                "cycle_id": cycle_id,
                "member_id": str(payload.member_id),
                "parking_fee": payload.parking_fee,
            })
            .execute()
        )

    return {"message": "Cập nhật ghi đè tiền gửi xe thành công.", "data": result.data}
