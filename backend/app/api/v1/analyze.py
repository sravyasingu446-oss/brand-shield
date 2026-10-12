from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.analysis_service import AnalysisService
from app.schemas.analysis import (
    SocialAnalysisRequest, MobileAppAnalysisRequest,
    UrlAnalysisRequest, CompanyPageAnalysisRequest,
    AnalysisResultResponse
)

router = APIRouter()


@router.post("/social", response_model=AnalysisResultResponse)
def analyze_social_profile(request: SocialAnalysisRequest, db: Session = Depends(get_db)):
    """Run full multi-agent investigation on a suspicious public social profile."""
    return AnalysisService.analyze_social(db, request)


@router.post("/mobile-app", response_model=AnalysisResultResponse)
def analyze_mobile_app(request: MobileAppAnalysisRequest, db: Session = Depends(get_db)):
    """Run full multi-agent investigation on a suspicious mobile application listing."""
    return AnalysisService.analyze_mobile_app(db, request)


@router.post("/url", response_model=AnalysisResultResponse)
def analyze_url(request: UrlAnalysisRequest, db: Session = Depends(get_db)):
    """Run full multi-agent investigation on a suspicious URL / phishing domain."""
    return AnalysisService.analyze_url(db, request)


@router.post("/company-page", response_model=AnalysisResultResponse)
def analyze_company_page(request: CompanyPageAnalysisRequest, db: Session = Depends(get_db)):
    """Run full multi-agent investigation on a fake company directory or recruiter profile."""
    return AnalysisService.analyze_company_page(db, request)


from pydantic import BaseModel, Field

class WebSearchRequest(BaseModel):
    brand_name: str = Field(..., description="Brand name to search for across the web")
    search_type: str = Field("all", description="Threat type: 'social', 'phishing', 'mobile', or 'all'")

from app.core.serpapi_client import serpapi_client

@router.post("/web-search")
def search_threats_web(request: WebSearchRequest):
    """Scan public search engines via SerpAPI for brand impersonations and scam domains."""
    return serpapi_client.search_brand_impersonations(
        brand_name=request.brand_name,
        search_type=request.search_type
    )

