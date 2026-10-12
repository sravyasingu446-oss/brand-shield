from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AlertResponse(BaseModel):
    id: int
    case_id: Optional[int] = None
    brand_id: int
    title: str
    message: str
    severity: str
    is_read: bool
    is_dismissed: bool
    created_at: datetime
    brand_name: Optional[str] = None
    case_number: Optional[str] = None

    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_dismissed: Optional[bool] = None
