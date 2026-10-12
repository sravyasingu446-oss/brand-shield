from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.services.case_service import CaseService
from app.schemas.case import CaseResponse, CaseDetailResponse, HumanReviewUpdate

router = APIRouter()


@router.get("/")
def list_cases(
    brand_id: Optional[int] = Query(None),
    risk_level: Optional[str] = Query(None),
    target_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve investigation cases with multi-criteria filtering, search, and pagination."""
    items, total = CaseService.list_cases(
        db=db,
        brand_id=brand_id,
        risk_level=risk_level,
        target_type=target_type,
        status=status,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit
    )
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{case_id}", response_model=CaseDetailResponse)
def get_case_detail(case_id: int, db: Session = Depends(get_db)):
    """Retrieve comprehensive case details including factor explainability, agent telemetry, and evidence items."""
    case_data = CaseService.get_case_detail(db, case_id)
    if not case_data:
        raise HTTPException(status_code=404, detail="Investigation case not found.")
    return case_data


@router.put("/{case_id}/review", response_model=CaseResponse)
def update_case_human_review(case_id: int, review_in: HumanReviewUpdate, db: Session = Depends(get_db)):
    """Update human review verdict, analyst notes, and action taken."""
    case = CaseService.update_human_review(db, case_id, review_in)
    if not case:
        raise HTTPException(status_code=404, detail="Investigation case not found.")
    return CaseResponse(
        id=case.id,
        case_number=case.case_number,
        brand_id=case.brand_id,
        brand_name=case.brand.name if case.brand else "Unknown",
        target_type=case.target_type,
        target_name=case.target_name,
        target_url=case.target_url,
        target_identifier=case.target_identifier,
        risk_score=case.risk_score,
        risk_level=case.risk_level,
        status=case.status,
        threat_category=case.threat_category,
        summary=case.summary,
        reviewer_name=case.reviewer_name,
        review_notes=case.review_notes,
        reviewed_at=case.reviewed_at,
        action_taken=case.action_taken,
        created_at=case.created_at,
        updated_at=case.updated_at
    )
