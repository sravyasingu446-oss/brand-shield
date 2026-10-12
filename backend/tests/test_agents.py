import pytest
from app.models.brand import Brand, BrandAsset
from app.agents.brand_profile_agent import BrandProfileAgent
from app.agents.social_media_agent import SocialMediaAgent
from app.agents.url_analysis_agent import UrlAnalysisAgent
from app.agents.mobile_app_agent import MobileAppMonitoringAgent
from app.agents.risk_scoring_agent import RiskScoringAgent
from app.agents.base import similarity_ratio, normalize_text
from app.schemas.analysis import SocialAnalysisRequest, UrlAnalysisRequest, MobileAppAnalysisRequest


@pytest.fixture
def dummy_brand():
    b = Brand(
        id=1,
        name="Apex Bank",
        organization_name="Apex Financial Group",
        industry="Banking",
        primary_domain="apexbank.com",
        trademark_names="Apex Bank, ApexPay"
    )
    b.assets = [
        BrandAsset(id=1, brand_id=1, asset_type="DOMAIN", platform="WEB", value="apexbank.com"),
        BrandAsset(id=2, brand_id=1, asset_type="SOCIAL_HANDLE", platform="TWITTER", value="@apexbank"),
        BrandAsset(id=3, brand_id=1, asset_type="MOBILE_APP", platform="GOOGLE_PLAY", value="com.apexbank.mobile")
    ]
    return b


def test_text_similarity_and_homoglyphs():
    # Test leetspeak / homoglyph normalization
    assert normalize_text("ap3xb@nk") == "apexbank"
    assert normalize_text("0fficial-apex") == "official-apex"
    
    # Test similarity ratio
    sim = similarity_ratio("apexbank", "apex-bank")
    assert sim >= 0.85


def test_brand_profile_agent_official_match(dummy_brand):
    agent = BrandProfileAgent()
    result = agent.execute(
        brand=dummy_brand,
        target_name="Apex Bank",
        target_identifier="@apexbank"
    )
    assert result.risk_level == "LOW"
    assert result.raw_details.get("is_official_match") is True
    assert len(result.mitigating_factors) > 0


def test_social_media_agent_spoofed_support(dummy_brand):
    agent = SocialMediaAgent()
    req = SocialAnalysisRequest(
        brand_id=1,
        platform="TWITTER",
        profile_url="https://twitter.com/apexbank_helpdesk",
        handle="@apexbank_helpdesk",
        display_name="Apex Bank Helpdesk Support",
        bio="Official 24/7 Apex Bank customer support desk. Contact via WhatsApp: https://wa.me/1234",
        follower_count=25,
        is_verified=False
    )
    result = agent.execute(brand=dummy_brand, request=req)
    assert result.risk_level in ["MEDIUM", "HIGH"]
    assert any("helpdesk" in ind.lower() for ind in result.indicators_found)
    assert any("wa.me" in ind.lower() or "messaging" in ind.lower() for ind in result.indicators_found)


def test_url_analysis_agent_phishing(dummy_brand):
    agent = UrlAnalysisAgent()
    req = UrlAnalysisRequest(
        brand_id=1,
        url="https://apexbank-login-security.xyz/auth/verify",
        detected_forms=["password", "card_number", "ssn"]
    )
    result = agent.execute(brand=dummy_brand, request=req)
    assert result.risk_level == "HIGH"
    assert any(".xyz" in ind.lower() for ind in result.indicators_found)
    assert any("credential" in ind.lower() for ind in result.indicators_found)


def test_mobile_app_monitoring_agent(dummy_brand):
    agent = MobileAppMonitoringAgent()
    req = MobileAppAnalysisRequest(
        brand_id=1,
        app_store="THIRD_PARTY_APK",
        app_name="Apex Quick Banking",
        package_name="com.apex.quick.pay",
        developer_name="Rogue Dev LLC",
        permissions=["android.permission.READ_SMS", "android.permission.RECEIVE_SMS", "SYSTEM_ALERT_WINDOW"]
    )
    result = agent.execute(brand=dummy_brand, request=req)
    assert result.risk_level == "HIGH"
    assert any("sms" in ind.lower() for ind in result.indicators_found)


def test_risk_scoring_agent():
    scorer = RiskScoringAgent()
    
    # Simulate high risk results from multiple agents
    agent = UrlAnalysisAgent()
    req = UrlAnalysisRequest(
        brand_id=1,
        url="https://apexbank-login-security.xyz/auth/verify",
        detected_forms=["password", "otp"]
    )
    b = Brand(id=1, name="Apex Bank", primary_domain="apexbank.com", assets=[])
    res = agent.execute(brand=b, request=req)
    
    score, level, report = scorer.analyze([res])
    assert 0 <= score <= 100
    assert level in ["LOW", "MEDIUM", "HIGH"]
    assert len(report.factors) > 0
    assert report.summary_rationale != ""
