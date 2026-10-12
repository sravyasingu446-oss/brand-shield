import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import List, Optional, Tuple, Dict, Any
from app.models.case import InvestigationCase, EvidenceItem
from app.models.brand import Brand
from app.schemas.case import HumanReviewUpdate


class CaseService:
    @staticmethod
    def list_cases(
        db: Session,
        brand_id: Optional[int] = None,
        risk_level: Optional[str] = None,
        target_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Dict[str, Any]], int]:
        query = db.query(InvestigationCase).join(Brand, InvestigationCase.brand_id == Brand.id)

        if brand_id:
            query = query.filter(InvestigationCase.brand_id == brand_id)
        if risk_level:
            query = query.filter(InvestigationCase.risk_level == risk_level.upper())
        if target_type:
            query = query.filter(InvestigationCase.target_type == target_type.upper())
        if status:
            query = query.filter(InvestigationCase.status == status.upper())
        if search:
            s = f"%{search}%"
            query = query.filter(
                or_(
                    InvestigationCase.case_number.ilike(s),
                    InvestigationCase.target_name.ilike(s),
                    InvestigationCase.target_identifier.ilike(s),
                    InvestigationCase.threat_category.ilike(s),
                    Brand.name.ilike(s)
                )
            )

        total = query.count()

        # Sorting
        sort_column = getattr(InvestigationCase, sort_by, InvestigationCase.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))

        cases = query.offset(skip).limit(limit).all()

        results = []
        for c in cases:
            results.append({
                "id": c.id,
                "case_number": c.case_number,
                "brand_id": c.brand_id,
                "brand_name": c.brand.name if c.brand else "Unknown",
                "target_type": c.target_type,
                "target_name": c.target_name,
                "target_url": c.target_url,
                "target_identifier": c.target_identifier,
                "risk_score": c.risk_score,
                "risk_level": c.risk_level,
                "status": c.status,
                "threat_category": c.threat_category,
                "summary": c.summary,
                "reviewer_name": c.reviewer_name,
                "review_notes": c.review_notes,
                "reviewed_at": c.reviewed_at,
                "action_taken": c.action_taken,
                "created_at": c.created_at,
                "updated_at": c.updated_at
            })

        return results, total

    @staticmethod
    def get_case_detail(db: Session, case_id: int) -> Optional[Dict[str, Any]]:
        case = db.query(InvestigationCase).filter(InvestigationCase.id == case_id).first()
        if not case:
            return None

        explainability = json.loads(case.explainability) if case.explainability else {}
        telemetry = json.loads(case.agent_telemetry) if case.agent_telemetry else []

        evidence_list = []
        for ev in case.evidence:
            evidence_list.append({
                "id": ev.id,
                "case_id": ev.case_id,
                "evidence_type": ev.evidence_type,
                "title": ev.title,
                "description": ev.description,
                "value": ev.value,
                "severity": ev.severity,
                "sha256_hash": ev.sha256_hash,
                "created_at": ev.created_at
            })

        return {
            "id": case.id,
            "case_number": case.case_number,
            "brand_id": case.brand_id,
            "brand_name": case.brand.name if case.brand else "Unknown",
            "target_type": case.target_type,
            "target_name": case.target_name,
            "target_url": case.target_url,
            "target_identifier": case.target_identifier,
            "risk_score": case.risk_score,
            "risk_level": case.risk_level,
            "status": case.status,
            "threat_category": case.threat_category,
            "summary": case.summary,
            "explainability": explainability,
            "agent_telemetry": telemetry,
            "reviewer_name": case.reviewer_name,
            "review_notes": case.review_notes,
            "reviewed_at": case.reviewed_at,
            "action_taken": case.action_taken,
            "evidence": evidence_list,
            "created_at": case.created_at,
            "updated_at": case.updated_at
        }

    @staticmethod
    def update_human_review(db: Session, case_id: int, review_in: HumanReviewUpdate) -> Optional[InvestigationCase]:
        case = db.query(InvestigationCase).filter(InvestigationCase.id == case_id).first()
        if not case:
            return None

        case.reviewer_name = review_in.reviewer_name
        case.status = review_in.status.upper()
        case.review_notes = review_in.review_notes
        case.action_taken = review_in.action_taken
        case.reviewed_at = datetime.now(timezone.utc)
        case.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(case)
        return case
