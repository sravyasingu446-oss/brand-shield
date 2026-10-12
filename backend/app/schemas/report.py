from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class ReportResponse(BaseModel):
    id: int
    report_number: str
    case_id: int
    title: str
    executive_summary: str
    generated_by: str
    created_at: datetime
    case_number: Optional[str] = None
    brand_name: Optional[str] = None
    risk_level: Optional[str] = None
    risk_score: Optional[int] = None

    class Config:
        from_attributes = True


class ReportDetailResponse(ReportResponse):
    methodology: str
    threat_indicators: List[Dict[str, Any]] = []
    remediation_playbook: List[Dict[str, Any]] = []
