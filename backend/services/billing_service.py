from typing import List, Dict, Any
from backend.database import supabase

# Phí cố định theo 01_business_logic.md
DEFAULT_SERVICE_FEE = 133000
DEFAULT_PARKING_FEE = 173000


def calculate_member_bill(month: int, year: int) -> List[Dict[str, Any]]:
    """
    Tính toán hóa đơn chốt sổ hàng tháng cho các thành viên dựa trên 01_business_logic.md.

    Công thức:
      Số tiền 1 người phải đóng =
          Tiền phòng cố định (1)
        + 133.000đ phí dịch vụ (2)
        + Tiền gửi xe của tháng đó (3) - mặc định 173.000đ hoặc override
        + [(Tổng điện + Tổng nước) / 6] (4)
        + (Tổng chi phí phát sinh cả nhà / 6) (5)
        - Tổng số tiền người đó đã ứng ra mua đồ phát sinh (6)
    """
    # 1. Fetch danh sách thành viên từ DB
    try:
        members_resp = supabase.table("members").select("*").execute()
        members = members_resp.data if members_resp and members_resp.data else []
    except Exception as e:
        print(f"Error fetching members: {e}")
        members = []

    # 2. Fetch chu kỳ hàng tháng (Monthly_Cycles) cho tháng và năm tương ứng
    cycle = None
    try:
        cycle_resp = (
            supabase.table("monthly_cycles")
            .select("*")
            .eq("month", month)
            .eq("year", year)
            .execute()
        )
        if cycle_resp and cycle_resp.data:
            cycle = cycle_resp.data[0]
    except Exception as e:
        print(f"Error fetching monthly_cycles: {e}")

    electricity_amount = cycle.get("electricity_amount", 0) if cycle else 0
    water_amount = cycle.get("water_amount", 0) if cycle else 0
    cycle_id = cycle.get("id") if cycle else None

    # Tính tiền điện + nước chia 6 cho mỗi người
    utility_total = electricity_amount + water_amount
    num_members = len(members) if len(members) > 0 else 6
    utility_share_per_person = round(utility_total / num_members)

    # 3. Fetch chi phí phát sinh (Extra_Expenses) cho tháng này
    extra_expenses = []
    if cycle_id:
        try:
            expenses_resp = (
                supabase.table("extra_expenses")
                .select("*")
                .eq("cycle_id", cycle_id)
                .execute()
            )
            if expenses_resp and expenses_resp.data:
                extra_expenses = expenses_resp.data
        except Exception as e:
            print(f"Error fetching extra_expenses: {e}")

    total_extra_expenses = sum(item.get("amount", 0) for item in extra_expenses)
    extra_share_per_person = round(total_extra_expenses / num_members)

    # Tính số tiền từng cá nhân đã ứng ra mua đồ trong tháng đó (Offset)
    member_offsets: Dict[str, int] = {}
    for exp in extra_expenses:
        buyer_id = str(exp.get("buyer_id"))
        member_offsets[buyer_id] = member_offsets.get(buyer_id, 0) + exp.get("amount", 0)

    # 4. Fetch các cấu hình ghi đè (Monthly_Overrides) cho tháng này (ví dụ tiền xe)
    overrides_map: Dict[str, int] = {}
    if cycle_id:
        try:
            overrides_resp = (
                supabase.table("monthly_overrides")
                .select("*")
                .eq("cycle_id", cycle_id)
                .execute()
            )
            if overrides_resp and overrides_resp.data:
                for ov in overrides_resp.data:
                    m_id = str(ov.get("member_id"))
                    if ov.get("parking_fee") is not None:
                        overrides_map[m_id] = ov.get("parking_fee")
        except Exception as e:
            print(f"Error fetching monthly_overrides: {e}")

    # 5. Tính toán tiền chốt sổ cho từng người
    billing_summary = []
    for member in members:
        m_id = str(member["id"])
        fixed_rent = member.get("fixed_rent", 0)

        # Phí xe: Lấy ghi đè nếu có, nếu không lấy mặc định 173.000đ
        parking_fee = overrides_map.get(m_id, DEFAULT_PARKING_FEE)

        # Số tiền người đó đã ứng mua đồ phát sinh trong tháng
        offset_amount = member_offsets.get(m_id, 0)

        # CÔNG THỨC CHỐT SỔ CUỐI CÙNG (FINAL FORMULA)
        total_due = (
            fixed_rent
            + DEFAULT_SERVICE_FEE
            + parking_fee
            + utility_share_per_person
            + extra_share_per_person
            - offset_amount
        )

        billing_summary.append({
            "member_id": member["id"],
            "name": member["name"],
            "fixed_rent": fixed_rent,
            "service_fee": DEFAULT_SERVICE_FEE,
            "parking_fee": parking_fee,
            "utility_share": utility_share_per_person,
            "extra_expense_share": extra_share_per_person,
            "offset_amount": offset_amount,
            "total_due": total_due,
        })

    return billing_summary
