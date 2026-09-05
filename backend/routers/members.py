from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from backend.database import supabase


router = APIRouter(prefix="/api/members", tags=["Members"])


class MemberPayload(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    fixed_rent: int = Field(ge=0, le=100_000_000)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = " ".join(value.split())
        if not value:
            raise ValueError("Tên thành viên không được để trống.")
        return value


class MemberUpdatePayload(MemberPayload):
    expected_version: int = Field(ge=1)


def _write_error(exc: Exception, action: str):
    message = str(exc).lower()
    if "duplicate" in message or "unique" in message:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tên thành viên đã tồn tại.") from exc
    if "foreign key" in message or "violates" in message:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Không thể xóa thành viên đã có dữ liệu chốt sổ.",
        ) from exc
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=f"Không thể {action} thành viên.",
    ) from exc


@router.get("")
def get_all_members():
    try:
        result = (
            supabase.table("members")
            .select("id,name,fixed_rent,version")
            .is_("archived_at", "null")
            .order("name")
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Không thể tải danh sách thành viên.",
        ) from exc
    return result.data or []


@router.post("", status_code=status.HTTP_201_CREATED)
def add_member(payload: MemberPayload):
    try:
        result = supabase.table("members").insert(payload.model_dump()).execute()
    except Exception as exc:
        _write_error(exc, "thêm")
    return {"message": "Thêm thành viên thành công.", "data": result.data}


@router.put("/{member_id}")
def update_member(member_id: UUID, payload: MemberUpdatePayload):
    changes = payload.model_dump(exclude={"expected_version"})
    changes.update({
        "version": payload.expected_version + 1,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    try:
        result = (
            supabase.table("members")
            .update(changes)
            .eq("id", str(member_id))
            .eq("version", payload.expected_version)
            .is_("archived_at", "null")
            .execute()
        )
    except Exception as exc:
        _write_error(exc, "cập nhật")
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Thành viên vừa được người khác cập nhật. Hãy tải lại trước khi lưu.",
        )
    return {"message": "Cập nhật thành viên thành công.", "data": result.data}


@router.delete("/{member_id}")
def delete_member(member_id: UUID, expected_version: int):
    if expected_version < 1:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Version không hợp lệ.")
    try:
        result = (
            supabase.table("members")
            .delete()
            .eq("id", str(member_id))
            .eq("version", expected_version)
            .is_("archived_at", "null")
            .execute()
        )
    except Exception as exc:
        _write_error(exc, "xóa")
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Thành viên vừa được người khác cập nhật hoặc đã bị xóa.",
        )
    return {"message": "Đã xóa thành viên.", "data": result.data}
