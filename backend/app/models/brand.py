from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    organization_name = Column(String(150), nullable=False)
    industry = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    primary_domain = Column(String(150), nullable=False)
    logo_url = Column(String(500), nullable=True)
    contact_email = Column(String(150), nullable=False)
    trademark_names = Column(Text, nullable=True)  # JSON or comma-separated aliases
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    assets = relationship("BrandAsset", back_populates="brand", cascade="all, delete-orphan")
    cases = relationship("InvestigationCase", back_populates="brand", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="brand", cascade="all, delete-orphan")


class BrandAsset(Base):
    __tablename__ = "brand_assets"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    asset_type = Column(String(50), nullable=False)  # DOMAIN, SOCIAL_HANDLE, MOBILE_APP, TRADEMARK
    platform = Column(String(50), nullable=False)    # WEB, TWITTER, LINKEDIN, INSTAGRAM, GOOGLE_PLAY, etc.
    value = Column(String(255), nullable=False)      # e.g., @apexbank, com.apexbank.mobile, apexbank.com
    is_verified = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    brand = relationship("Brand", back_populates="assets")
