from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.services.report_service import ReportService
from app.schemas.report import ReportResponse, ReportDetailResponse

router = APIRouter()


@router.get("/", response_model=List[ReportResponse])
def list_reports(
    brand_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieve investigation reports."""
    return ReportService.list_reports(db, brand_id=brand_id, limit=limit)


@router.get("/{report_id}", response_model=ReportDetailResponse)
def get_report_detail(report_id: int, db: Session = Depends(get_db)):
    """Retrieve comprehensive report details including indicators and remediation playbook."""
    report = ReportService.get_report_detail(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Investigation report not found.")
    return report


@router.get("/{report_id}/pdf")
def download_report_pdf(report_id: int, db: Session = Depends(get_db)):
    """Export and download investigation report as a formatted PDF."""
    pdf_buffer = ReportService.generate_pdf(db, report_id)
    if not pdf_buffer:
        raise HTTPException(status_code=404, detail="Investigation report not found.")

    report = ReportService.get_report_detail(db, report_id)
    filename = f"{report.get('report_number', 'report')}.pdf"

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/case/{case_id}/pdf")
def download_report_pdf_by_case(case_id: int, db: Session = Depends(get_db)):
    """Export and download investigation report as a formatted PDF using Case ID."""
    pdf_buffer = ReportService.generate_pdf_by_case(db, case_id)
    if not pdf_buffer:
        raise HTTPException(status_code=404, detail="Investigation report not found for this case.")

    report = ReportService.get_report_by_case(db, case_id)
    filename = f"{report.get('report_number', 'report')}.pdf"

    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
