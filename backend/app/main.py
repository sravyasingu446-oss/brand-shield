import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.demo_data_service import DemoDataService

# Routers
from app.api.v1.brands import router as brands_router
from app.api.v1.analyze import router as analyze_router
from app.api.v1.cases import router as cases_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.reports import router as reports_router
from app.api.v1.stats import router as stats_router
from app.api.v1.settings import router as settings_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    logger.info("Initializing BrandShield AI database...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed demo data if database is empty
    db = SessionLocal()
    try:
        DemoDataService.seed_demo_data(db, force=False)
    finally:
        db.close()
    
    yield
    logger.info("BrandShield AI backend shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Digital Risk Protection Platform - AI-powered Brand Impersonation, Phishing, and Rogue Asset Defense",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(stats_router, prefix=f"{settings.API_V1_STR}/stats", tags=["Dashboard Statistics"])
app.include_router(brands_router, prefix=f"{settings.API_V1_STR}/brands", tags=["Brand Asset Management"])
app.include_router(analyze_router, prefix=f"{settings.API_V1_STR}/analyze", tags=["Multi-Agent Threat Analysis"])
app.include_router(cases_router, prefix=f"{settings.API_V1_STR}/cases", tags=["Investigation Case Management"])
app.include_router(alerts_router, prefix=f"{settings.API_V1_STR}/alerts", tags=["Security Incident Alerts"])
app.include_router(reports_router, prefix=f"{settings.API_V1_STR}/reports", tags=["Investigation Reports"])
app.include_router(settings_router, prefix=f"{settings.API_V1_STR}/settings", tags=["System Configuration"])


@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "database": "CONNECTED",
        "api_v1": settings.API_V1_STR
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
