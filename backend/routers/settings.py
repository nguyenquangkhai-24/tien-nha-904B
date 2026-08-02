from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.database import supabase

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class UpdateSettingRequest(BaseModel):
    value: int

@router.get("")
def get_all_settings():
    """Lấy danh sách cấu hình hệ thống (vd: service_fee)"""
    try:
        res = supabase.table("global_settings").select("*").execute()
        settings_dict = {}
        if res and res.data:
            for row in res.data:
                settings_dict[row["key"]] = row["value"]
        
        # Trả về giá trị mặc định nếu chưa có
        if "service_fee" not in settings_dict:
            settings_dict["service_fee"] = 133000
            
        return settings_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{key}")
def update_setting(key: str, payload: UpdateSettingRequest):
    """Cập nhật một cấu hình"""
    try:
        # UPSERT
        res = supabase.table("global_settings").upsert({
            "key": key,
            "value": payload.value
        }, on_conflict="key").execute()
        
        return {"message": f"Đã cập nhật {key}", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
