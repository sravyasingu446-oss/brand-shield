import os
import json
import logging
from typing import Optional, Dict, Any
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    async def analyze_threat(
        self,
        system_instruction: str,
        target_context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Call Gemini API if key is present to provide deep contextual LLM analysis."""
        if not self.is_configured:
            return None

        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        
        prompt = f"""
You are BrandShield AI Cyber Threat Intelligence Agent.
{system_instruction}

Target Context Data (JSON):
{json.dumps(target_context, indent=2)}

Output strictly valid JSON with the following structure:
{{
  "risk_score_modifier": <int between -20 and 20>,
  "impersonation_intent": <"DEFINITE" | "PROBABLE" | "SUSPICIOUS" | "BENIGN">,
  "confidence": <float between 0.0 and 1.0>,
  "threat_reasoning": "<concise explanation of findings>",
  "detected_social_engineering": ["list of tactics e.g. urgency, authority spoofing"],
  "recommended_action": "<takedown recommendation>"
}}
Do NOT output markdown backticks. Just pure JSON.
"""

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 800,
                "responseMimeType": "application/json"
            }
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return json.loads(text.strip())
                else:
                    logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
                    return None
        except Exception as e:
            logger.warning(f"Gemini API call failed, falling back to rule-based engine: {e}")
            return None

    def analyze_threat_sync(
        self,
        system_instruction: str,
        target_context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Synchronous version for agent analysis pipeline."""
        if not self.is_configured:
            return None

        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        prompt = f"""
You are BrandShield AI Cyber Threat Intelligence Agent.
{system_instruction}

Target Context Data (JSON):
{json.dumps(target_context, indent=2)}

Output strictly valid JSON:
{{
  "risk_score_modifier": 0,
  "impersonation_intent": "SUSPICIOUS",
  "confidence": 0.85,
  "threat_reasoning": "...",
  "detected_social_engineering": ["..."],
  "recommended_action": "..."
}}
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 800,
                "responseMimeType": "application/json"
            }
        }
        try:
            with httpx.Client(timeout=6.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                    return json.loads(text.strip())
        except Exception as e:
            logger.warning(f"Gemini sync call exception: {e}")
            return None

    def check_configuration_or_error(self) -> Optional[Dict[str, Any]]:
        """Validate if GEMINI_API_KEY is configured; return clear error dict if missing."""
        if not self.is_configured:
            return {
                "status": "error",
                "missing_variable": "GEMINI_API_KEY",
                "message": (
                    "Missing environment variable: GEMINI_API_KEY. "
                    "Please configure 'GEMINI_API_KEY=your_key_here' in the .env file in the project root."
                )
            }
        return None

    def test_connection(self) -> Dict[str, Any]:
        """Test whether the Gemini API key is configured and valid."""
        err = self.check_configuration_or_error()
        if err:
            return err

        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": "Say PONG"}]}],
            "generationConfig": {"temperature": 0.0, "maxOutputTokens": 10}
        }
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    return {
                        "status": "connected",
                        "model": self.model,
                        "message": f"Successfully verified Gemini API key connection using {self.model}."
                    }
                else:
                    return {
                        "status": "error",
                        "missing_variable": "GEMINI_API_KEY",
                        "message": f"Gemini API returned status {res.status_code}: {res.text}"
                    }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to connect to Gemini API endpoint: {str(e)}"
            }


gemini_client = GeminiClient()
