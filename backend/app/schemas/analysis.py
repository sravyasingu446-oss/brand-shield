from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.case import ExplainabilityReport, EvidenceItemResponse


# --- Target Input Requests ---

class SocialAnalysisRequest(BaseModel):
    brand_id: int
    platform: str = Field("TWITTER", description="TWITTER, LINKEDIN, INSTAGRAM, FACEBOOK, TIKTOK, TELEGRAM, YOUTUBE")
    profile_url: str = Field(..., description="Public profile URL")
    handle: str = Field(..., description="Username / handle e.g. @apexbank_helpdesk")
    display_name: str = Field(..., description="Profile display name")
    bio: Optional[str] = Field(None, description="Profile bio or about text")
    follower_count: Optional[int] = Field(0, description="Follower count")
    following_count: Optional[int] = Field(0, description="Following count")
    account_created: Optional[str] = Field(None, description="Account creation date or string e.g. 'Last month'")
    is_verified: Optional[bool] = Field(False, description="Whether the account has a verified badge")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    recent_posts: Optional[List[str]] = Field(default_factory=list, description="Sample recent posts or tweets")


class MobileAppAnalysisRequest(BaseModel):
    brand_id: int
    app_store: str = Field("GOOGLE_PLAY", description="GOOGLE_PLAY, APPLE_APP_STORE, THIRD_PARTY_APK")
    app_name: str = Field(..., description="Application title on store")
    package_name: str = Field(..., description="App package identifier e.g. com.apex.secure.banking.app")
    developer_name: str = Field(..., description="Developer / Publisher entity name")
    listing_url: Optional[str] = Field(None, description="Store listing URL")
    download_count_range: Optional[str] = Field("100+", description="e.g. '100+', '10M+', '500+'")
    rating: Optional[float] = Field(2.5, description="Average store rating")
    permissions: Optional[List[str]] = Field(default_factory=list, description="Requested Android/iOS permissions")
    app_icon_url: Optional[str] = Field(None, description="App icon image URL")
    privacy_policy_url: Optional[str] = Field(None, description="Privacy policy URL on listing")


class UrlAnalysisRequest(BaseModel):
    brand_id: int
    url: str = Field(..., description="Suspicious URL to analyze e.g. https://apexbank-verify-auth.xyz/login")
    page_title: Optional[str] = Field(None, description="Extracted HTML title")
    detected_forms: Optional[List[str]] = Field(default_factory=list, description="Forms detected e.g. ['password', 'card_number', 'ssn']")
    meta_description: Optional[str] = Field(None, description="Meta tag description")


class CompanyPageAnalysisRequest(BaseModel):
    brand_id: int
    platform: str = Field("LINKEDIN", description="LINKEDIN, FACEBOOK, GLASSDOOR, INDEED")
    page_name: str = Field(..., description="Company page title")
    page_url: str = Field(..., description="Public company page URL")
    claimed_headquarters: Optional[str] = Field(None, description="Claimed HQ location")
    contact_email: Optional[str] = Field(None, description="Contact email on page")
    recruiter_name: Optional[str] = Field(None, description="Recruiter claiming to represent company")
    job_titles: Optional[List[str]] = Field(default_factory=list, description="Job postings listed")
    description_text: Optional[str] = Field(None, description="Company overview / about text")


# --- Analysis Outputs ---

class AgentFinding(BaseModel):
    agent_name: str
    risk_level: str  # LOW, MEDIUM, HIGH
    confidence: float  # 0.0 to 1.0
    summary: str
    indicators_found: List[str] = []
    mitigating_factors: List[str] = []
    execution_time_ms: int = 0


class AnalysisResultResponse(BaseModel):
    case_number: str
    case_id: int
    brand_id: int
    brand_name: str
    target_type: str
    target_name: str
    target_identifier: str
    target_url: Optional[str] = None
    risk_score: int
    risk_level: str
    threat_category: str
    summary: str
    evidence_sufficient: bool
    additional_checks_performed: List[str] = []
    agent_findings: List[AgentFinding]
    explainability: ExplainabilityReport
    evidence_items: List[EvidenceItemResponse]
    recommended_actions: List[str]
    alert_triggered: bool
    created_at: datetime


# --- Dashboard Stats ---

class ThreatCategoryCount(BaseModel):
    category: str
    count: int
    percentage: float


class RiskTrendPoint(BaseModel):
    date: str
    high: int
    medium: int
    low: int


class DashboardStatsResponse(BaseModel):
    total_cases: int
    high_risk_cases: int
    medium_risk_cases: int
    low_risk_cases: int
    suspicious_social_profiles: int
    suspicious_mobile_apps: int
    suspicious_urls: int
    fake_company_pages: int
    open_alerts: int
    monitored_brands: int
    threat_distribution: List[ThreatCategoryCount]
    risk_trend: List[RiskTrendPoint]
    active_agent_count: int
    agent_statuses: List[Dict[str, Any]]
