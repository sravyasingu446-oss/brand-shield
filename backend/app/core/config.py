import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine environment file paths
# 1. Project root .env (brandshield-ai/.env)
ROOT_ENV_PATH = Path(__file__).resolve().parents[3] / ".env"
# 2. Backend directory .env (brandshield-ai/backend/.env)
BACKEND_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
# 3. Current working directory .env
CWD_ENV_PATH = Path.cwd() / ".env"

# Explicitly load environment variables using python-dotenv
for env_file in [ROOT_ENV_PATH, BACKEND_ENV_PATH, CWD_ENV_PATH]:
    if env_file.exists() and env_file.is_file():
        load_dotenv(dotenv_path=env_file, override=False)


class Settings(BaseSettings):
    PROJECT_NAME: str = "BrandShield AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite:///./brandshield.db"
    
    # OpenAI API Configuration (Threat Intelligence & Reasoning)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # SerpAPI Configuration (Live Web & Search Engine Impersonation Discovery)
    SERPAPI_API_KEY: str = ""
    
    # Gemini AI configuration (Optional Alternative)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Risk Thresholds
    HIGH_RISK_THRESHOLD: int = 70
    MEDIUM_RISK_THRESHOLD: int = 40
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://localhost:8000"
    ]
    
    # Reviewer default
    DEFAULT_REVIEWER: str = "SecOps Analyst (Tier 2)"

    model_config = SettingsConfigDict(
        env_file=[str(ROOT_ENV_PATH), str(BACKEND_ENV_PATH), ".env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
