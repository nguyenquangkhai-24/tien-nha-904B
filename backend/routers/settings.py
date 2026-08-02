from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.database import supabase

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class UpdateSettingRequest(BaseModel):
    value: str | int

class VerifyPinRequest(BaseModel):
    pin: str

@router.get("")
def get_all_settings():
    """Lấy danh sách cấu hình hệ thống (vd: service_fee)"""
    try:
        res = supabase.table("global_settings").select("*").execute()
        settings_dict = {}
        if res and res.data:
            for row in res.data:
                # Ẩn admin_pin không cho GET lộ ra ngoài
                if row["key"] != "admin_pin":
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
            "value": str(payload.value)
        }, on_conflict="key").execute()
        
        return {"message": f"Đã cập nhật {key}", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-pin")
def verify_pin(payload: VerifyPinRequest):
    """Kiểm tra mã PIN có đúng không"""
    try:
        res = supabase.table("global_settings").select("value").eq("key", "admin_pin").execute()
        current_pin = "123456" # Default
        if res and res.data and len(res.data) > 0:
            current_pin = str(res.data[0]["value"])
            
        if payload.pin == current_pin:
            return {"success": True}
        else:
            return {"success": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
