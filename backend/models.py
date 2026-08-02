from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

# ==========================================
# 1. Members
# ==========================================
class MemberBase(BaseModel):
    name: str
    fixed_rent: int

class MemberCreate(MemberBase):
    pass

class Member(MemberBase):
    id: UUID

    class Config:
        from_attributes = True


# ==========================================
# 2. Monthly_Cycles
# ==========================================
class MonthlyCycleBase(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int
    electricity_amount: int = 0
    water_amount: int = 0

class MonthlyCycleCreate(MonthlyCycleBase):
    pass

class MonthlyCycleUpdate(BaseModel):
    electricity_amount: Optional[int] = None
    water_amount: Optional[int] = None

class MonthlyCycle(MonthlyCycleBase):
    id: UUID

    class Config:
        from_attributes = True


# ==========================================
# 3. Extra_Expenses
# ==========================================
class ExtraExpenseBase(BaseModel):
    cycle_id: UUID
    buyer_id: UUID
    item_name: str
    amount: int

class ExtraExpenseCreate(BaseModel):
    buyer_id: UUID
    item_name: str
    amount: int

class ExtraExpense(ExtraExpenseBase):
    id: UUID

    class Config:
        from_attributes = True


# ==========================================
# 4. Monthly_Overrides
# ==========================================
class MonthlyOverrideBase(BaseModel):
    cycle_id: UUID
    member_id: UUID
    parking_fee: Optional[int] = 173000

class MonthlyOverrideCreate(MonthlyOverrideBase):
    cycle_id: UUID
    member_id: UUID
    parking_fee: Optional[int] = 173000

class MonthlyOverrideUpdatePayload(BaseModel):
    member_id: UUID
    month: int
    year: int
    parking_fee: Optional[int] = 173000

class MonthlyOverride(MonthlyOverrideBase):
    id: UUID

    class Config:
        from_attributes = True


# ==========================================
# Billing Result Schema
# ==========================================
class MemberBillingDetail(BaseModel):
    member_id: UUID
    name: str
    fixed_rent: int
    service_fee: int = 133000
    parking_fee: int
    utility_share: int
    extra_expense_share: int
    offset_amount: int
    total_due: int
