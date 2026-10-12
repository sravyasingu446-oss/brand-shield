import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.brand import Brand
from app.models.case import InvestigationCase, EvidenceItem
from app.models.alert import Alert
from app.models.report import InvestigationReport
from app.agents.orchestrator import orchestrator
from app.schemas.analysis import (
    SocialAnalysisRequest, MobileAppAnalysisRequest,
    UrlAnalysisRequest, CompanyPageAnalysisRequest,
    AnalysisResultResponse
)


class AnalysisService:
    @staticmethod
    def _persist_investigation(db: Session, brand: Brand, inv_data: dict) -> AnalysisResultResponse:
        """Common database persistence logic for all investigation types."""
        # 1. Create Case
        case = InvestigationCase(
            case_number=inv_data["case_number"],
            brand_id=brand.id,
            target_type=inv_data["target_type"],
            target_name=inv_data["target_name"],
            target_url=inv_data["target_url"],
            target_identifier=inv_data["target_identifier"],
            risk_score=inv_data["risk_score"],
            risk_level=inv_data["risk_level"],
            status=inv_data["status"],
            threat_category=inv_data["threat_category"],
            summary=inv_data["summary"],
            explainability=json.dumps(inv_data["explainability"]),
            agent_telemetry=json.dumps(inv_data["agent_findings"])
        )
        db.add(case)
        db.commit()
        db.refresh(case)

        # 2. Create Evidence Items
        db_evidence = []
        for ev in inv_data["evidence_items"]:
            item = EvidenceItem(
                case_id=case.id,
                evidence_type=ev["evidence_type"],
                title=ev["title"],
                description=ev["description"],
                value=ev["value"],
                severity=ev["severity"],
                sha256_hash=ev.get("sha256_hash")
            )
            db.add(item)
            db_evidence.append(item)
        db.commit()

        # 3. Create Alert if triggered
        alert_triggered = False
        if inv_data.get("alert_payload"):
            alert_triggered = True
            al = inv_data["alert_payload"]
            alert = Alert(
                case_id=case.id,
                brand_id=brand.id,
                title=al["title"],
                message=al["message"],
                severity=al["severity"],
                is_read=False,
                is_dismissed=False
            )
            db.add(alert)
            db.commit()

        # 4. Create Investigation Report
        rep_data = inv_data["report_data"]
        report_number = f"REP-{case.case_number.replace('CS-', '')}"
        report = InvestigationReport(
            report_number=report_number,
            case_id=case.id,
            title=rep_data["title"],
            executive_summary=rep_data["executive_summary"],
            methodology=rep_data["methodology"],
            threat_indicators=json.dumps(rep_data["threat_indicators"]),
            remediation_playbook=json.dumps(rep_data["remediation_playbook"]),
            generated_by="BrandShield AI Multi-Agent Pipeline"
        )
        db.add(report)
        db.commit()

        # Refresh evidence to get generated IDs
        saved_evidence = db.query(EvidenceItem).filter(EvidenceItem.case_id == case.id).all()

        return AnalysisResultResponse(
            case_number=case.case_number,
            case_id=case.id,
            brand_id=brand.id,
            brand_name=brand.name,
            target_type=case.target_type,
            target_name=case.target_name,
            target_identifier=case.target_identifier,
            target_url=case.target_url,
            risk_score=case.risk_score,
            risk_level=case.risk_level,
            threat_category=case.threat_category,
            summary=case.summary,
            evidence_sufficient=inv_data["evidence_sufficient"],
            additional_checks_performed=inv_data["additional_checks_performed"],
            agent_findings=inv_data["agent_findings"],
            explainability=inv_data["explainability"],
            evidence_items=[{
                "id": e.id,
                "case_id": e.case_id,
                "evidence_type": e.evidence_type,
                "title": e.title,
                "description": e.description,
                "value": e.value,
                "severity": e.severity,
                "sha256_hash": e.sha256_hash,
                "created_at": e.created_at
            } for e in saved_evidence],
            recommended_actions=inv_data["recommended_actions"],
            alert_triggered=alert_triggered,
            created_at=case.created_at
        )

    @staticmethod
    def analyze_social(db: Session, request: SocialAnalysisRequest) -> AnalysisResultResponse:
        brand = db.query(Brand).filter(Brand.id == request.brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail="Selected brand profile does not exist.")
        inv_data = orchestrator.investigate_social(brand, request)
        return AnalysisService._persist_investigation(db, brand, inv_data)

    @staticmethod
    def analyze_mobile_app(db: Session, request: MobileAppAnalysisRequest) -> AnalysisResultResponse:
        brand = db.query(Brand).filter(Brand.id == request.brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail="Selected brand profile does not exist.")
        inv_data = orchestrator.investigate_mobile_app(brand, request)
        return AnalysisService._persist_investigation(db, brand, inv_data)

    @staticmethod
    def analyze_url(db: Session, request: UrlAnalysisRequest) -> AnalysisResultResponse:
        brand = db.query(Brand).filter(Brand.id == request.brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail="Selected brand profile does not exist.")
        inv_data = orchestrator.investigate_url(brand, request)
        return AnalysisService._persist_investigation(db, brand, inv_data)

    @staticmethod
    def analyze_company_page(db: Session, request: CompanyPageAnalysisRequest) -> AnalysisResultResponse:
        brand = db.query(Brand).filter(Brand.id == request.brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail="Selected brand profile does not exist.")
        inv_data = orchestrator.investigate_company_page(brand, request)
        return AnalysisService._persist_investigation(db, brand, inv_data)
