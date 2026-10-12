from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class EvidenceItemResponse(BaseModel):
    id: int
    case_id: int
    evidence_type: str
    title: str
    description: str
    value: str
    severity: str
    sha256_hash: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ExplainabilityFactor(BaseModel):
    factor_name: str
    category: str
    weight: float
    score_contribution: float
    description: str
    risk_direction: str = "POSITIVE"  # POSITIVE (increases risk) or MITIGATING (decreases risk)


class ExplainabilityReport(BaseModel):
    final_score: int
    risk_level: str
    confidence: float
    factors: List[ExplainabilityFactor]
    summary_rationale: str
    mitigations_present: List[str] = []


class HumanReviewUpdate(BaseModel):
    reviewer_name: str = Field(..., min_length=2)
    status: str = Field(..., description="NEW, IN_REVIEW, CONFIRMED_IMPERSONATION, FALSE_POSITIVE, RESOLVED, CLOSED")
    review_notes: str = Field(..., min_length=5)
    action_taken: Optional[str] = None  # DMCA Takedown Filed, Domain Blocked, Escalated, Marked Benign


class CaseBase(BaseModel):
    brand_id: int
    target_type: str
    target_name: str
    target_url: Optional[str] = None
    target_identifier: str
    risk_score: int
    risk_level: str
    status: str
    threat_category: str
    summary: str


class CaseResponse(CaseBase):
    id: int
    case_number: str
    reviewer_name: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    action_taken: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    brand_name: Optional[str] = None

    class Config:
        from_attributes = True


from typing import Optional, List, Dict, Any, Union

class CaseDetailResponse(CaseResponse):
    explainability: Optional[Dict[str, Any]] = None
    agent_telemetry: Optional[Union[List[Dict[str, Any]], Dict[str, Any], List[Any]]] = None
    evidence: List[EvidenceItemResponse] = []

