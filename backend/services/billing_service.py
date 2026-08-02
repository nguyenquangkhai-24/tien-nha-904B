from typing import List, Dict, Any
from backend.database import supabase

# Phí cố định theo 01_business_logic.md
DEFAULT_SERVICE_FEE = 133000
DEFAULT_PARKING_FEE = 173000

# Danh sách 6 thành viên cố định làm Mặc Định (Fallback) theo 01_business_logic.md
DEFAULT_MEMBERS = [
    {"id": "11111111-1111-1111-1111-111111111111", "name": "Duy", "fixed_rent": 3750000},
    {"id": "22222222-2222-2222-2222-222222222222", "name": "Khải", "fixed_rent": 3750000},
    {"id": "33333333-3333-3333-3333-333333333333", "name": "P.Khang", "fixed_rent": 3000000},
    {"id": "44444444-4444-4444-4444-444444444444", "name": "N.Khang", "fixed_rent": 3000000},
    {"id": "55555555-5555-5555-5555-555555555555", "name": "Thịnh", "fixed_rent": 2500000},
    {"id": "66666666-6666-6666-6666-666666666666", "name": "Khoa", "fixed_rent": 2000000},
]


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
    # 1. Fetch danh sách thành viên từ DB (nếu rỗng sẽ tự động dùng DEFAULT_MEMBERS)
    members = []
    try:
        members_resp = supabase.table("members").select("*").execute()
        if members_resp and members_resp.data and len(members_resp.data) > 0:
            # Deduplicate theo tên
            seen = set()
            for m in members_resp.data:
                if m["name"] not in seen:
                    seen.add(m["name"])
                    members.append(m)
    except Exception as e:
        print(f"Warning: Fetching members from DB failed ({e}). Using default members list.")

    if not members:
        members = DEFAULT_MEMBERS

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
        print(f"Warning: Fetching monthly_cycles failed ({e}).")

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
            print(f"Warning: Fetching extra_expenses failed ({e}).")

    total_extra_expenses = sum(item.get("amount", 0) for item in extra_expenses)
    extra_share_per_person = round(total_extra_expenses / num_members)

    # Tính số tiền từng cá nhân đã ứng ra mua đồ trong tháng đó (Offset)
    member_offsets: Dict[str, int] = {}
    for exp in extra_expenses:
        buyer_id = str(exp.get("buyer_id"))
        member_offsets[buyer_id] = member_offsets.get(buyer_id, 0) + exp.get("amount", 0)

    # 4. Fetch các cấu hình ghi đè (Monthly_Overrides) cho tháng này (ví dụ tiền xe, trạng thái thu tiền)
    overrides_data: Dict[str, Dict[str, Any]] = {}
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
                    overrides_data[m_id] = {
                        "parking_fee": ov.get("parking_fee"),
                        "is_paid": ov.get("is_paid", False),
                    }
        except Exception as e:
            print(f"Warning: Fetching monthly_overrides failed ({e}).")

    # 5. Tính toán tiền chốt sổ cho từng người
    billing_summary = []
    for member in members:
        m_id = str(member["id"])
        fixed_rent = member.get("fixed_rent", 0)

        # Dữ liệu overrides của member
        ov_member = overrides_data.get(m_id, {})
        
        # Phí xe: Lấy ghi đè nếu có, nếu không lấy mặc định 173.000đ
        parking_fee = ov_member.get("parking_fee") if ov_member.get("parking_fee") is not None else DEFAULT_PARKING_FEE
        
        # Trạng thái đã thu tiền (is_paid)
        is_paid = ov_member.get("is_paid", False)

        # Số tiền người đó đã ứng mua đồ phát sinh trong tháng
        offset_amount = member_offsets.get(m_id, 0)

        # CÔNG THỨC CHỐT SỔ MỚI: Không trừ tiền ứng (theo yêu cầu của user)
        total_due = (
            fixed_rent
            + DEFAULT_SERVICE_FEE
            + parking_fee
            + utility_share_per_person
            + extra_share_per_person
        )

        billing_summary.append({
            "member_id": member["id"],
            "name": member["name"],
            "fixed_rent": fixed_rent,
            "service_fee": DEFAULT_SERVICE_FEE,
            "parking_fee": parking_fee,
            "utility_share": utility_share_per_person,
            "extra_expense_share": extra_share_per_person,
            "offset_amount": offset_amount, # Vẫn trả về phòng hờ nhưng không trừ vào total_due
            "total_due": total_due,
            "is_paid": is_paid,
        })

    return billing_summary
