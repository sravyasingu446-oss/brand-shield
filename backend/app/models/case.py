from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class InvestigationCase(Base):
    __tablename__ = "investigation_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True, nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    
    target_type = Column(String(50), nullable=False)     # SOCIAL_PROFILE, MOBILE_APP, PHISHING_URL, FAKE_PAGE
    target_name = Column(String(200), nullable=False)    # Display name or title
    target_url = Column(String(500), nullable=True)      # Target URL if available
    target_identifier = Column(String(200), nullable=False) # handle, package_name, domain
    
    risk_score = Column(Integer, nullable=False, default=0) # 0-100
    risk_level = Column(String(20), nullable=False, default="LOW") # LOW, MEDIUM, HIGH
    status = Column(String(50), nullable=False, default="NEW") # NEW, IN_REVIEW, CONFIRMED_IMPERSONATION, FALSE_POSITIVE, RESOLVED, CLOSED
    threat_category = Column(String(100), nullable=False) # e.g. Impersonation, Credential Harvesting, Fake Support
    
    summary = Column(Text, nullable=False)
    explainability = Column(Text, nullable=False) # JSON encoded factor breakdown
    agent_telemetry = Column(Text, nullable=True) # JSON encoded run logs & agent outputs
    
    # Human Review
    reviewer_name = Column(String(100), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    action_taken = Column(String(100), nullable=True) # e.g. Takedown Requested, Blocklist Added, Benign
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    brand = relationship("Brand", back_populates="cases")
    evidence = relationship("EvidenceItem", back_populates="case", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="case", cascade="all, delete-orphan")
    reports = relationship("InvestigationReport", back_populates="case", cascade="all, delete-orphan")


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("investigation_cases.id", ondelete="CASCADE"), nullable=False)
    evidence_type = Column(String(50), nullable=False) # IOC_DOMAIN, IOC_IP, SIMILARITY_SCORE, KEYWORD_MATCH, WHOIS, REPUTATION
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    value = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, default="MEDIUM") # CRITICAL, HIGH, MEDIUM, LOW, INFO
    sha256_hash = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("InvestigationCase", back_populates="evidence")
