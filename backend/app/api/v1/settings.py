from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.agents.gemini_client import gemini_client
from app.core.openai_client import openai_client
from app.core.serpapi_client import serpapi_client
from app.services.demo_data_service import DemoDataService

router = APIRouter()


@router.get("/")
def get_system_settings():
    """Retrieve platform settings, API key status, and thresholds."""
    engines = []
    if openai_client.is_configured:
        engines.append(f"OpenAI ({openai_client.model})")
    if gemini_client.is_configured:
        engines.append(f"Gemini ({gemini_client.model})")
    if serpapi_client.is_configured:
        engines.append("SerpAPI Real-time Web Intelligence")
    
    analysis_engine_str = " + ".join(engines) if engines else "Rule-based Cyber Heuristic Engine (Standalone Active)"

    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gemini_api_configured": gemini_client.is_configured,
        "gemini_model": settings.GEMINI_MODEL,
        "openai_api_configured": openai_client.is_configured,
        "openai_model": settings.OPENAI_MODEL,
        "serpapi_api_configured": serpapi_client.is_configured,
        "analysis_engine": analysis_engine_str,
        "high_risk_threshold": settings.HIGH_RISK_THRESHOLD,
        "medium_risk_threshold": settings.MEDIUM_RISK_THRESHOLD,
        "default_reviewer": settings.DEFAULT_REVIEWER,
        "database_type": "SQLite Persistent Storage"
    }


@router.get("/test-openai")
def test_openai_api():
    """Test OpenAI integration or provide setup guidance if unconfigured."""
    return openai_client.test_connection()


@router.get("/test-serpapi")
def test_serpapi_api():
    """Test SerpAPI integration or provide setup guidance if unconfigured."""
    return serpapi_client.test_connection()


@router.get("/test-gemini")
def test_gemini_api():
    """Test Gemini integration or provide setup guidance if unconfigured."""
    return gemini_client.test_connection()


@router.post("/seed-demo-data")
def trigger_seed_demo_data(db: Session = Depends(get_db)):
    """Reset and re-seed database with realistic demonstration brands and cases."""
    result = DemoDataService.seed_demo_data(db, force=True)
    return result
