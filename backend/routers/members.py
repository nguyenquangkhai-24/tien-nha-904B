from fastapi import APIRouter
from backend.database import supabase

router = APIRouter(prefix="/api/members", tags=["Members"])


@router.get("")
def get_all_members():
    """Lấy danh sách thông tin cố định của tất cả thành viên trong nhà."""
    try:
        result = supabase.table("members").select("*").execute()
        if not result or not result.data:
            return []
            
        # Deduplicate theo tên (giữ lại bản ghi đầu tiên)
        unique_members = []
        seen_names = set()
        for m in result.data:
            if m["name"] not in seen_names:
                seen_names.add(m["name"])
                unique_members.append(m)
        return unique_members
    except Exception as e:
        return {"error": str(e)}

from pydantic import BaseModel
from fastapi import HTTPException

class MemberCreate(BaseModel):
    name: str
    fixed_rent: int

class MemberUpdate(BaseModel):
    name: str
    fixed_rent: int

@router.post("")
def add_member(payload: MemberCreate):
    try:
        res = supabase.table("members").insert({
            "name": payload.name,
            "fixed_rent": payload.fixed_rent
        }).execute()
        return {"message": "Thêm thành viên thành công", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{member_id}")
def update_member(member_id: str, payload: MemberUpdate):
    try:
        res = supabase.table("members").update({
            "name": payload.name,
            "fixed_rent": payload.fixed_rent
        }).eq("id", member_id).execute()
        return {"message": "Cập nhật thành viên thành công", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{member_id}")
def delete_member(member_id: str):
    try:
        res = supabase.table("members").delete().eq("id", member_id).execute()
        return {"message": "Đã xóa thành viên"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
