from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.alert import Alert
from app.models.brand import Brand
from app.models.case import InvestigationCase


class AlertService:
    @staticmethod
    def list_alerts(
        db: Session,
        brand_id: Optional[int] = None,
        severity: Optional[str] = None,
        is_read: Optional[bool] = None,
        limit: int = 50
    ) -> List[dict]:
        query = db.query(Alert).join(Brand, Alert.brand_id == Brand.id)

        if brand_id:
            query = query.filter(Alert.brand_id == brand_id)
        if severity:
            query = query.filter(Alert.severity == severity.upper())
        if is_read is not None:
            query = query.filter(Alert.is_read == is_read)

        query = query.filter(Alert.is_dismissed == False).order_by(Alert.created_at.desc())
        alerts = query.limit(limit).all()

        results = []
        for a in alerts:
            results.append({
                "id": a.id,
                "case_id": a.case_id,
                "brand_id": a.brand_id,
                "brand_name": a.brand.name if a.brand else "Unknown",
                "case_number": a.case.case_number if a.case else None,
                "title": a.title,
                "message": a.message,
                "severity": a.severity,
                "is_read": a.is_read,
                "is_dismissed": a.is_dismissed,
                "created_at": a.created_at
            })
        return results

    @staticmethod
    def mark_read(db: Session, alert_id: int) -> bool:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.is_read = True
            db.commit()
            return True
        return False

    @staticmethod
    def dismiss_alert(db: Session, alert_id: int) -> bool:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.is_dismissed = True
            db.commit()
            return True
        return False

    @staticmethod
    def mark_all_read(db: Session) -> int:
        count = db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})
        db.commit()
        return count
