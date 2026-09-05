from typing import Any

from backend.database import supabase


DEFAULT_SERVICE_FEE = 133_000
DEFAULT_PARKING_FEE = 173_000
MAX_MONEY = 100_000_000


class BillingDataError(RuntimeError):
    pass


def _money(value: Any, field: str, maximum: int = MAX_MONEY) -> int:
    try:
        normalized = int(value or 0)
    except (TypeError, ValueError) as exc:
        raise BillingDataError(f"{field} không phải số nguyên hợp lệ.") from exc
    if not 0 <= normalized <= maximum:
        raise BillingDataError(f"{field} nằm ngoài giới hạn.")
    return normalized


def _fetch_service_fee() -> int:
    try:
        response = (
            supabase.table("global_settings")
            .select("key,value")
            .eq("key", "service_fee")
            .execute()
        )
    except Exception as exc:
        raise BillingDataError("Không thể tải phí dịch vụ.") from exc
    if not response.data:
        return DEFAULT_SERVICE_FEE
    return _money(response.data[0].get("value"), "Phí dịch vụ", 10_000_000)


def _fetch_members() -> list[dict[str, Any]]:
    try:
        response = (
            supabase.table("members")
            .select("id,name,fixed_rent")
            .is_("archived_at", "null")
            .order("name")
            .execute()
        )
    except Exception as exc:
        raise BillingDataError("Không thể tải thành viên.") from exc
    members = response.data or []
    if not members:
        raise BillingDataError("Chưa có thành viên trong hệ thống.")
    normalized_names = [str(member.get("name", "")).strip().casefold() for member in members]
    if any(not name for name in normalized_names) or len(set(normalized_names)) != len(normalized_names):
        raise BillingDataError("Danh sách thành viên trống hoặc trùng tên.")
    return members


def calculate_member_bill(month: int, year: int) -> list[dict[str, Any]]:
    service_fee = _fetch_service_fee()
    members = _fetch_members()

    try:
        cycle_response = (
            supabase.table("monthly_cycles")
            .select("id,month,year,electricity_amount,water_amount,version")
            .eq("month", month)
            .eq("year", year)
            .execute()
        )
    except Exception as exc:
        raise BillingDataError("Không thể tải kỳ chốt sổ.") from exc

    cycle = cycle_response.data[0] if cycle_response.data else None
    cycle_id = cycle.get("id") if cycle else None
    cycle_version = int(cycle.get("version", 0)) if cycle else 0
    electricity_amount = _money(cycle.get("electricity_amount", 0) if cycle else 0, "Tiền điện")
    water_amount = _money(cycle.get("water_amount", 0) if cycle else 0, "Tiền nước")

    overrides: dict[str, dict[str, Any]] = {}
    if cycle_id:
        try:
            response = (
                supabase.table("monthly_overrides")
                .select("member_id,parking_fee,is_paid,is_excluded,version")
                .eq("cycle_id", cycle_id)
                .execute()
            )
        except Exception as exc:
            raise BillingDataError("Không thể tải tùy chỉnh thành viên.") from exc
        overrides = {str(item["member_id"]): item for item in (response.data or [])}

    active_members_count = sum(
        1 for member in members
        if not bool(overrides.get(str(member["id"]), {}).get("is_excluded", False))
    )
    if active_members_count == 0:
        raise BillingDataError("Không thể chia điện nước khi tất cả thành viên đều vắng.")

    utility_share = round((electricity_amount + water_amount) / active_members_count)
    billing_summary = []

    for member in members:
        member_id = str(member["id"])
        override = overrides.get(member_id, {})
        is_excluded = bool(override.get("is_excluded", False))
        fixed_rent = _money(member.get("fixed_rent"), "Tiền phòng")
        parking_value = override.get("parking_fee")
        if parking_value is None:
            parking_value = DEFAULT_PARKING_FEE
        parking_fee = 0 if is_excluded else _money(parking_value, "Phí gửi xe", 10_000_000)
        member_utility_share = 0 if is_excluded else utility_share

        billing_summary.append({
            "member_id": member["id"],
            "name": str(member["name"]),
            "fixed_rent": fixed_rent,
            "service_fee": service_fee,
            "parking_fee": parking_fee,
            "electricity_amount": electricity_amount,
            "water_amount": water_amount,
            "utility_share": member_utility_share,
            "active_members_count": active_members_count,
            "cycle_version": cycle_version,
            "override_version": int(override.get("version", 0)),
            "total_due": fixed_rent + service_fee + parking_fee + member_utility_share,
            "is_paid": bool(override.get("is_paid", False)),
            "is_excluded": is_excluded,
        })

    return billing_summary
