from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class BrandAssetBase(BaseModel):
    asset_type: str = Field(..., description="DOMAIN, SOCIAL_HANDLE, MOBILE_APP, TRADEMARK")
    platform: str = Field(..., description="WEB, TWITTER, LINKEDIN, INSTAGRAM, GOOGLE_PLAY, APPLE_APP_STORE")
    value: str = Field(..., description="Asset identifier, handle, URL or package name")
    is_verified: bool = True
    notes: Optional[str] = None


class BrandAssetCreate(BrandAssetBase):
    pass


class BrandAssetResponse(BrandAssetBase):
    id: int
    brand_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class BrandBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    organization_name: str = Field(..., min_length=2, max_length=150)
    industry: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    primary_domain: str = Field(..., min_length=3, max_length=150)
    logo_url: Optional[str] = None
    contact_email: str = Field(..., min_length=5, max_length=150)
    trademark_names: Optional[str] = None


class BrandCreate(BrandBase):
    initial_assets: Optional[List[BrandAssetCreate]] = None


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    organization_name: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    primary_domain: Optional[str] = None
    logo_url: Optional[str] = None
    contact_email: Optional[str] = None
    trademark_names: Optional[str] = None


class BrandResponse(BrandBase):
    id: int
    created_at: datetime
    updated_at: datetime
    assets: List[BrandAssetResponse] = []

    class Config:
        from_attributes = True
