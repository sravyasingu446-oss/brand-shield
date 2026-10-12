from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.services.alert_service import AlertService
from app.schemas.alert import AlertResponse

router = APIRouter()


@router.get("/", response_model=List[AlertResponse])
def get_alerts(
    brand_id: Optional[int] = Query(None),
    severity: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve security incident alerts."""
    return AlertService.list_alerts(db, brand_id=brand_id, severity=severity, is_read=is_read, limit=limit)


@router.put("/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    """Mark specific alert as read."""
    success = AlertService.mark_read(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return {"message": "Alert marked as read."}


@router.put("/{alert_id}/dismiss")
def dismiss_alert(alert_id: int, db: Session = Depends(get_db)):
    """Dismiss alert from active notifications."""
    success = AlertService.dismiss_alert(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return {"message": "Alert dismissed."}


@router.post("/mark-all-read")
def mark_all_alerts_read(db: Session = Depends(get_db)):
    """Mark all active alerts as read."""
    count = AlertService.mark_all_read(db)
    return {"message": f"{count} alerts marked as read."}
