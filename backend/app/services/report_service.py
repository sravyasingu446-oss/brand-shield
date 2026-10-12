import io
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.report import InvestigationReport
from app.models.case import InvestigationCase
from app.models.brand import Brand

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors


class ReportService:
    @staticmethod
    def list_reports(db: Session, brand_id: Optional[int] = None, limit: int = 50) -> List[dict]:
        query = db.query(InvestigationReport).join(InvestigationCase, InvestigationReport.case_id == InvestigationCase.id).join(Brand, InvestigationCase.brand_id == Brand.id)
        if brand_id:
            query = query.filter(InvestigationCase.brand_id == brand_id)
        reports = query.order_by(InvestigationReport.created_at.desc()).limit(limit).all()

        results = []
        for r in reports:
            results.append({
                "id": r.id,
                "report_number": r.report_number,
                "case_id": r.case_id,
                "case_number": r.case.case_number if r.case else None,
                "brand_name": r.case.brand.name if r.case and r.case.brand else "Unknown",
                "risk_level": r.case.risk_level if r.case else "UNKNOWN",
                "risk_score": r.case.risk_score if r.case else 0,
                "title": r.title,
                "executive_summary": r.executive_summary,
                "generated_by": r.generated_by,
                "created_at": r.created_at
            })
        return results

    @staticmethod
    def get_report_detail(db: Session, report_id: int) -> Optional[dict]:
        r = db.query(InvestigationReport).filter(InvestigationReport.id == report_id).first()
        if not r:
            return None

        indicators = json.loads(r.threat_indicators) if r.threat_indicators else []
        playbook = json.loads(r.remediation_playbook) if r.remediation_playbook else []

        return {
            "id": r.id,
            "report_number": r.report_number,
            "case_id": r.case_id,
            "case_number": r.case.case_number if r.case else None,
            "brand_name": r.case.brand.name if r.case and r.case.brand else "Unknown",
            "risk_level": r.case.risk_level if r.case else "UNKNOWN",
            "risk_score": r.case.risk_score if r.case else 0,
            "title": r.title,
            "executive_summary": r.executive_summary,
            "methodology": r.methodology,
            "threat_indicators": indicators,
            "remediation_playbook": playbook,
            "generated_by": r.generated_by,
            "created_at": r.created_at
        }

    @staticmethod
    def get_report_by_case(db: Session, case_id: int) -> Optional[dict]:
        r = db.query(InvestigationReport).filter(InvestigationReport.case_id == case_id).order_by(InvestigationReport.created_at.desc()).first()
        if not r:
            return None
        return ReportService.get_report_detail(db, r.id)

    @staticmethod
    def generate_pdf_by_case(db: Session, case_id: int) -> Optional[io.BytesIO]:
        report_data = ReportService.get_report_by_case(db, case_id)
        if not report_data:
            return None
        return ReportService.generate_pdf(db, report_data["id"])

    @staticmethod
    def generate_pdf(db: Session, report_id: int) -> Optional[io.BytesIO]:
        report_data = ReportService.get_report_detail(db, report_id)
        if not report_data:
            return None

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0B1120'),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#FF6B00'),
            fontName='Helvetica-Bold'
        )
        h2_style = ParagraphStyle(
            'Heading2Custom',
            parent=styles['Heading2'],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#0B1120'),
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BodyCustom',
            parent=styles['Normal'],
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#334155')
        )
        meta_label = ParagraphStyle(
            'MetaLabel',
            parent=styles['Normal'],
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#64748B'),
            fontName='Helvetica-Bold'
        )
        meta_val = ParagraphStyle(
            'MetaValue',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#0F172A')
        )

        elements = []

        # Header Banner
        elements.append(Paragraph("BRANDSHIELD AI • DIGITAL RISK PROTECTION PLATFORM", subtitle_style))
        elements.append(Paragraph(f"Incident Investigation Report: {report_data['report_number']}", title_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#FF6B00'), spaceBefore=4, spaceAfter=12))

        # Meta Details Table
        meta_data = [
            [
                Paragraph("Protected Brand:", meta_label), Paragraph(report_data['brand_name'], meta_val),
                Paragraph("Case Number:", meta_label), Paragraph(report_data.get('case_number') or "N/A", meta_val)
            ],
            [
                Paragraph("Risk Score:", meta_label),
                Paragraph(f"<b>{report_data['risk_score']}/100</b> ({report_data['risk_level']})", meta_val),
                Paragraph("Generated Date:", meta_label),
                Paragraph(report_data['created_at'].strftime("%Y-%m-%d %H:%M UTC") if isinstance(report_data['created_at'], datetime) else str(report_data['created_at']), meta_val)
            ]
        ]
        meta_table = Table(meta_data, colWidths=[100, 160, 100, 170])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 14))

        # Executive Summary
        elements.append(Paragraph("1. Executive Summary", h2_style))
        elements.append(Paragraph(report_data['executive_summary'], body_style))
        elements.append(Spacer(1, 10))

        # Methodology
        elements.append(Paragraph("2. Investigation Methodology & Architecture", h2_style))
        elements.append(Paragraph(report_data['methodology'], body_style))
        elements.append(Spacer(1, 10))

        # Threat Indicators Table
        elements.append(Paragraph("3. Indicators of Compromise (IOCs) & Cryptographic Evidence", h2_style))
        threat_rows = [
            [
                Paragraph("<b>Severity</b>", meta_label),
                Paragraph("<b>Type / Title</b>", meta_label),
                Paragraph("<b>Technical Findings</b>", meta_label),
                Paragraph("<b>SHA256 Hash</b>", meta_label)
            ]
        ]
        for ind in report_data.get('threat_indicators', [])[:10]:
            threat_rows.append([
                Paragraph(ind.get('severity', 'INFO'), meta_val),
                Paragraph(f"<b>{ind.get('title', '')}</b>", meta_val),
                Paragraph(ind.get('detail', ''), body_style),
                Paragraph(ind.get('sha256', '') or "N/A", meta_val)
            ])

        if len(threat_rows) > 1:
            ioc_table = Table(threat_rows, colWidths=[65, 120, 220, 125])
            ioc_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ]))
            elements.append(ioc_table)
        else:
            elements.append(Paragraph("No specific technical IOCs recorded.", body_style))

        elements.append(Spacer(1, 14))

        # Remediation Playbook
        elements.append(Paragraph("4. Recommended Remediation Playbook", h2_style))
        for step in report_data.get('remediation_playbook', []):
            elements.append(Paragraph(f"<b>Step {step.get('step')}: {step.get('action')}</b>", meta_val))
            elements.append(Paragraph(step.get('detail', ''), body_style))
            elements.append(Spacer(1, 4))

        # Footer Notice
        elements.append(Spacer(1, 20))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94A3B8'), spaceBefore=8, spaceAfter=8))
        elements.append(Paragraph(
            "CONFIDENTIAL • Prepared by BrandShield AI Digital Risk Protection Platform. "
            "Risk scores represent automated triage assessments and should be verified in accordance with corporate legal and incident response guidelines.",
            ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7.5, leading=10, textColor=colors.HexColor('#64748B'))
        ))

        doc.build(elements)
        buffer.seek(0)
        return buffer
