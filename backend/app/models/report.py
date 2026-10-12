from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class InvestigationReport(Base):
    __tablename__ = "investigation_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(50), unique=True, index=True, nullable=False)
    case_id = Column(Integer, ForeignKey("investigation_cases.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    executive_summary = Column(Text, nullable=False)
    methodology = Column(Text, nullable=False)
    threat_indicators = Column(Text, nullable=False)  # JSON string
    remediation_playbook = Column(Text, nullable=False) # JSON string
    generated_by = Column(String(100), default="BrandShield AI Report Generation Agent")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("InvestigationCase", back_populates="reports")
