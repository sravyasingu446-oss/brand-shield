import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.services.demo_data_service import DemoDataService

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    DemoDataService.seed_demo_data(db, force=False)
    db.close()


def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["platform"] == "BrandShield AI"
    assert data["status"] == "OPERATIONAL"


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"


def test_dashboard_stats_endpoint():
    res = client.get("/api/v1/stats/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "total_cases" in data
    assert "active_agent_count" in data
    assert data["active_agent_count"] == 13
    assert len(data["agent_statuses"]) == 13


def test_list_brands_endpoint():
    res = client.get("/api/v1/brands/")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # Should have seeded brands


def test_list_cases_endpoint():
    res = client.get("/api/v1/cases/")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


def test_settings_endpoint():
    res = client.get("/api/v1/settings/")
    assert res.status_code == 200
    data = res.json()
    assert "project_name" in data
    assert "gemini_api_configured" in data
    assert "openai_api_configured" in data
    assert "serpapi_api_configured" in data
    assert "analysis_engine" in data


def test_integration_test_endpoints():
    openai_res = client.get("/api/v1/settings/test-openai")
    assert openai_res.status_code == 200
    o_data = openai_res.json()
    assert "status" in o_data
    if o_data.get("missing_variable"):
        assert o_data["missing_variable"] == "OPENAI_API_KEY"
        assert "OPENAI_API_KEY" in o_data["message"]
    else:
        assert "message" in o_data

    serpapi_res = client.get("/api/v1/settings/test-serpapi")
    assert serpapi_res.status_code == 200
    s_data = serpapi_res.json()
    assert "status" in s_data
    if s_data.get("missing_variable"):
        assert s_data["missing_variable"] == "SERPAPI_API_KEY"
        assert "SERPAPI_API_KEY" in s_data["message"]
    else:
        assert "message" in s_data

    gemini_res = client.get("/api/v1/settings/test-gemini")
    assert gemini_res.status_code == 200
    g_data = gemini_res.json()
    assert "status" in g_data
    if g_data.get("missing_variable"):
        assert g_data["missing_variable"] == "GEMINI_API_KEY"
        assert "GEMINI_API_KEY" in g_data["message"]
    else:
        assert "message" in g_data


def test_web_search_missing_key_behavior():
    payload = {
        "brand_name": "Apex Bank",
        "search_type": "all"
    }
    res = client.post("/api/v1/analyze/web-search", json=payload)
    assert res.status_code == 200
    data = res.json()
    # If key is missing, should gracefully return error stating SERPAPI_API_KEY is missing
    if not data["success"]:
        assert data.get("missing_variable") == "SERPAPI_API_KEY"
        assert "SERPAPI_API_KEY" in data["error"]



def test_url_analysis_pipeline():
    brands_res = client.get("/api/v1/brands/")
    brands = brands_res.json()
    assert len(brands) > 0
    brand_id = brands[0]["id"]

    payload = {
        "brand_id": brand_id,
        "url": "https://suspicious-apexbank-auth-token.xyz/login",
        "page_title": "Apex Online Banking Verification",
        "detected_forms": ["password", "otp_code"]
    }
    res = client.post("/api/v1/analyze/url", json=payload)
    assert res.status_code == 200
    result = res.json()
    assert result["risk_score"] > 50
    assert result["risk_level"] in ["MEDIUM", "HIGH"]
    assert len(result["evidence_items"]) > 0
    assert "case_number" in result


def test_social_analysis_pipeline():
    brands_res = client.get("/api/v1/brands/")
    brand_id = brands_res.json()[0]["id"]

    payload = {
        "brand_id": brand_id,
        "platform": "TWITTER",
        "profile_url": "https://twitter.com/apexbank_helpdesk",
        "handle": "@apexbank_helpdesk",
        "display_name": "Apex Bank Official Escalations",
        "bio": "Official 24/7 customer escalations channel for Apex Bank. Contact WhatsApp: https://wa.me/123",
        "follower_count": 35,
        "is_verified": False
    }
    res = client.post("/api/v1/analyze/social", json=payload)
    assert res.status_code == 200
    result = res.json()
    assert result["risk_level"] in ["MEDIUM", "HIGH"]
    assert result["target_type"] == "SOCIAL_PROFILE"


def test_mobile_app_analysis_pipeline():
    brands_res = client.get("/api/v1/brands/")
    brand_id = brands_res.json()[0]["id"]

    payload = {
        "brand_id": brand_id,
        "app_store": "THIRD_PARTY_APK",
        "app_name": "Apex Fast Banking",
        "package_name": "com.apex.fast.pay.apk",
        "developer_name": "Apex App LLC",
        "permissions": ["READ_SMS", "RECEIVE_SMS", "SYSTEM_ALERT_WINDOW"]
    }
    res = client.post("/api/v1/analyze/mobile-app", json=payload)
    assert res.status_code == 200
    result = res.json()
    assert result["risk_score"] > 60
    assert result["target_type"] == "MOBILE_APP"


def test_human_review_and_pdf_export():
    # Fetch existing cases
    cases_res = client.get("/api/v1/cases/")
    cases = cases_res.json()["items"]
    assert len(cases) > 0
    case_id = cases[0]["id"]

    # Update human review
    review_payload = {
        "reviewer_name": "SecOps Lead (Automated Test)",
        "status": "CONFIRMED_IMPERSONATION",
        "review_notes": "Confirmed malicious phishing endpoint intercepting OTP tokens.",
        "action_taken": "Takedown Requested (DMCA)"
    }
    review_res = client.put(f"/api/v1/cases/{case_id}/review", json=review_payload)
    assert review_res.status_code == 200
    updated = review_res.json()
    assert updated["status"] == "CONFIRMED_IMPERSONATION"
    assert updated["reviewer_name"] == "SecOps Lead (Automated Test)"

    # Test PDF download by Case ID
    pdf_res = client.get(f"/api/v1/reports/case/{case_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000  # Valid non-empty PDF bytes!
