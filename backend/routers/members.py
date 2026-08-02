from fastapi import APIRouter
from backend.database import supabase

router = APIRouter(prefix="/api/members", tags=["Members"])


@router.get("")
def get_all_members():
    """Lấy danh sách thông tin cố định của tất cả thành viên trong nhà."""
    try:
        result = supabase.table("members").select("*").execute()
        return result.data if result and result.data else []
    except Exception as e:
        return {"error": str(e)}
