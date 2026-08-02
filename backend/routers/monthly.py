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
    is_excluded: Optional[bool] = False

class UpdateStatusRequest(BaseModel):
    member_id: UUID
    month: int
    year: int
    is_paid: bool


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

    try:
        # Sử dụng UPSERT để tránh lỗi duplicate key khi 2 người cùng thao tác
        upsert_res = (
            supabase.table("monthly_cycles")
            .upsert(
                {
                    "month": month,
                    "year": year,
                    "electricity_amount": payload.electricity_amount,
                    "water_amount": payload.water_amount,
                },
                on_conflict="month,year"
            )
            .execute()
        )
        return {
            "message": "Cập nhật tiền điện nước thành công.",
            "data": upsert_res.data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật chu kỳ (Supabase): {str(e)}")


@router.put("/overrides")
def update_parking_override(payload: UpdateOverrideRequest):
    """
    5. PUT /api/overrides
    Cập nhật tiền gửi xe cho một người trong một tháng cụ thể.
    """
    try:
        # Lấy cycle_id (UPSERT để đảm bảo luôn tồn tại và không dính lỗi Concurrency)
        cycle_res = (
            supabase.table("monthly_cycles")
            .upsert(
                {
                    "month": payload.month,
                    "year": payload.year
                },
                on_conflict="month,year",
                ignore_duplicates=False
            )
            .execute()
        )
        cycle_id = cycle_res.data[0]["id"]
    except Exception as e:
        # Nếu fail (do config Supabase API key version cũ), fallback sang select -> insert -> select
        cycle_check = supabase.table("monthly_cycles").select("*").eq("month", payload.month).eq("year", payload.year).execute()
        if cycle_check and cycle_check.data:
            cycle_id = cycle_check.data[0]["id"]
        else:
            try:
                new_cycle = supabase.table("monthly_cycles").insert({"month": payload.month, "year": payload.year}).execute()
                cycle_id = new_cycle.data[0]["id"]
            except Exception as e2:
                # Race condition, select lại 1 lần nữa
                cycle_check2 = supabase.table("monthly_cycles").select("*").eq("month", payload.month).eq("year", payload.year).execute()
                cycle_id = cycle_check2.data[0]["id"]

    try:
        from backend.services.billing_service import DEFAULT_PARKING_FEE
        
        # Vì UPSERT cần full config, ta fetch dữ liệu cũ (nếu có)
        existing_ov = supabase.table("monthly_overrides").select("*").eq("cycle_id", cycle_id).eq("member_id", str(payload.member_id)).execute()
        
        current_paid = False
        if existing_ov and existing_ov.data:
            current_paid = existing_ov.data[0].get("is_paid", False)

        # UPSERT ghi đè phí và trạng thái nghỉ phép
        result = (
            supabase.table("monthly_overrides")
            .upsert(
                {
                    "cycle_id": cycle_id,
                    "member_id": str(payload.member_id),
                    "parking_fee": payload.parking_fee,
                    "is_excluded": payload.is_excluded,
                    "is_paid": current_paid,
                },
                on_conflict="cycle_id,member_id"
            )
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi ghi đè phí (Supabase): {str(e)}")

    return {"message": "Cập nhật ghi đè tiền gửi xe thành công.", "data": result.data}

@router.put("/overrides/status")
def update_payment_status(payload: UpdateStatusRequest):
    """
    6. PUT /api/overrides/status
    Cập nhật trạng thái đã thu tiền (is_paid) cho một người trong tháng.
    """
    try:
        # Lấy cycle_id (Fallback check để an toàn)
        cycle_res = (
            supabase.table("monthly_cycles")
            .upsert(
                {
                    "month": payload.month,
                    "year": payload.year
                },
                on_conflict="month,year",
                ignore_duplicates=False
            )
            .execute()
        )
        cycle_id = cycle_res.data[0]["id"]
    except Exception as e:
        cycle_check = supabase.table("monthly_cycles").select("*").eq("month", payload.month).eq("year", payload.year).execute()
        if cycle_check and cycle_check.data:
            cycle_id = cycle_check.data[0]["id"]
        else:
            try:
                new_cycle = supabase.table("monthly_cycles").insert({"month": payload.month, "year": payload.year}).execute()
                cycle_id = new_cycle.data[0]["id"]
            except Exception as e2:
                cycle_check2 = supabase.table("monthly_cycles").select("*").eq("month", payload.month).eq("year", payload.year).execute()
                cycle_id = cycle_check2.data[0]["id"]

    try:
        from backend.services.billing_service import DEFAULT_PARKING_FEE
        
        # Vì UPSERT cần full config, ta fetch dữ liệu cũ (nếu có) để không đè parking_fee
        existing_ov = supabase.table("monthly_overrides").select("*").eq("cycle_id", cycle_id).eq("member_id", str(payload.member_id)).execute()
        
        current_parking = DEFAULT_PARKING_FEE
        current_excluded = False
        if existing_ov and existing_ov.data:
            current_parking = existing_ov.data[0].get("parking_fee", DEFAULT_PARKING_FEE)
            current_excluded = existing_ov.data[0].get("is_excluded", False)
            
        result = (
            supabase.table("monthly_overrides")
            .upsert(
                {
                    "cycle_id": cycle_id,
                    "member_id": str(payload.member_id),
                    "parking_fee": current_parking,
                    "is_paid": payload.is_paid,
                    "is_excluded": current_excluded,
                },
                on_conflict="cycle_id,member_id"
            )
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi cập nhật trạng thái thu tiền: {str(e)}")

    return {"message": "Cập nhật trạng thái thu tiền thành công.", "data": result.data}

@router.get("/yearly/{year}")
def get_yearly_stats(year: int):
    """
    7. GET /api/yearly/:year
    Lấy thống kê điện, nước và phát sinh của toàn bộ 12 tháng trong năm.
    """
    try:
        # Fetch tất cả cycles trong năm
        cycles_res = supabase.table("monthly_cycles").select("*").eq("year", year).execute()
        cycles = cycles_res.data if cycles_res and cycles_res.data else []

        # Nếu không có cycle nào, trả về mảng rỗng
        if not cycles:
            return []

        cycle_ids = [c["id"] for c in cycles]
        
        # Fetch tất cả expenses thuộc các cycles này
        # Vì supabase-py chưa hỗ trợ tốt lệnh .in_(), ta fetch toàn bộ hoặc chia batch (ở đây ít nên fetch hết)
        # Cách đơn giản: fetch những expense nào có cycle_id nằm trong list.
        expenses = []
        if cycle_ids:
            exp_res = supabase.table("extra_expenses").select("*").in_("cycle_id", cycle_ids).execute()
            if exp_res and exp_res.data:
                expenses = exp_res.data

        # Nhóm expenses theo cycle_id
        expenses_by_cycle = {}
        for exp in expenses:
            c_id = exp.get("cycle_id")
            amount = exp.get("amount", 0)
            expenses_by_cycle[c_id] = expenses_by_cycle.get(c_id, 0) + amount

        # Build mảng kết quả 12 tháng (1-12)
        # Để đảm bảo đủ 12 tháng (kể cả chưa có), ta có thể sinh ra array 1-12
        stats = []
        cycle_map = {c["month"]: c for c in cycles}

        for m in range(1, 13):
            if m in cycle_map:
                c = cycle_map[m]
                c_id = c["id"]
                elec = c.get("electricity_amount", 0)
                water = c.get("water_amount", 0)
                extra = expenses_by_cycle.get(c_id, 0)
                stats.append({
                    "month": m,
                    "electricity": elec,
                    "water": water,
                    "extra": extra,
                    "total": elec + water + extra
                })
            else:
                stats.append({
                    "month": m,
                    "electricity": 0,
                    "water": 0,
                    "extra": 0,
                    "total": 0
                })

        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy thống kê năm: {str(e)}")
