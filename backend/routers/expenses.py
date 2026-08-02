from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from backend.database import supabase

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])


class CreateExpenseRequest(BaseModel):
    buyer_id: UUID
    item_name: str
    amount: int
    cycle_id: Optional[UUID] = None
    month: Optional[int] = None
    year: Optional[int] = None


@router.post("")
def create_expense(payload: CreateExpenseRequest):
    """
    3. POST /api/expenses
    Thêm một chi phí phát sinh mới (payload: buyer_id, item_name, amount, [month, year hoặc cycle_id]).
    """
    cycle_id = payload.cycle_id

    # Nếu chưa truyền cycle_id trực tiếp, tìm hoặc tạo từ (month, year)
    if not cycle_id:
        if payload.month is None or payload.year is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cần truyền cycle_id hoặc cả (month, year) để xác định tháng phát sinh.",
            )

        try:
            cycle_res = (
                supabase.table("monthly_cycles")
                .select("*")
                .eq("month", payload.month)
                .eq("year", payload.year)
                .execute()
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi kiểm tra chu kỳ (Supabase): {str(e)}")

        if cycle_res and cycle_res.data:
            cycle_id = cycle_res.data[0]["id"]
        else:
            try:
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
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Lỗi tạo chu kỳ (Supabase): {str(e)}")

    expense_data = {
        "cycle_id": str(cycle_id),
        "buyer_id": str(payload.buyer_id),
        "item_name": payload.item_name,
        "amount": payload.amount,
    }

    try:
        result = supabase.table("extra_expenses").insert(expense_data).execute()
        return {"message": "Thêm chi phí phát sinh thành công.", "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi thêm chi phí (Supabase): {str(e)}")


@router.delete("/{expense_id}")
def delete_expense(expense_id: UUID):
    """
    4. DELETE /api/expenses/:id
    Xóa chi phí phát sinh theo ID nếu nhập sai.
    """
    try:
        result = (
            supabase.table("extra_expenses")
            .delete()
            .eq("id", str(expense_id))
            .execute()
        )
        return {"message": "Xóa chi phí phát sinh thành công.", "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xóa chi phí (Supabase): {str(e)}")


@router.get("/{month}/{year}")
def get_expenses_by_month(month: int, year: int):
    """
    GET /api/expenses/:month/:year
    Lấy danh sách các chi phí phát sinh trong một tháng.
    """
    try:
        cycle_res = (
            supabase.table("monthly_cycles")
            .select("*")
            .eq("month", month)
            .eq("year", year)
            .execute()
        )
        if not cycle_res or not cycle_res.data:
            return []

        cycle_id = cycle_res.data[0]["id"]
        result = (
            supabase.table("extra_expenses")
            .select("*")
            .eq("cycle_id", cycle_id)
            .execute()
        )
        return result.data if result and result.data else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy chi phí (Supabase): {str(e)}")
