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
