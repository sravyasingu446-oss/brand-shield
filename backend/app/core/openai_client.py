import json
import logging
from typing import Optional, Dict, Any
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL or "gpt-4o-mini"
        self.base_url = "https://api.openai.com/v1"

    @property
    def is_configured(self) -> bool:
        key = self.api_key or settings.OPENAI_API_KEY
        return bool(key and len(key.strip()) > 8 and not key.strip().startswith("your_"))

    def check_configuration_or_error(self) -> Optional[Dict[str, Any]]:
        """Validate if OPENAI_API_KEY is configured; return clear error dict if missing."""
        if not self.is_configured:
            return {
                "status": "error",
                "missing_variable": "OPENAI_API_KEY",
                "message": (
                    "Missing environment variable: OPENAI_API_KEY. "
                    "Please configure 'OPENAI_API_KEY=your_key_here' in the .env file in the project root."
                )
            }
        return None

    def test_connection(self) -> Dict[str, Any]:
        """Test whether the OpenAI API key is configured and valid."""
        err = self.check_configuration_or_error()
        if err:
            return err

        headers = {
            "Authorization": f"Bearer {self.api_key or settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a test ping for BrandShield AI."},
                {"role": "user", "content": "Respond with 'PONG'"}
            ],
            "max_tokens": 5,
            "temperature": 0.0
        }

        try:
            with httpx.Client(timeout=8.0) as client:
                resp = client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                if resp.status_code == 200:
                    return {
                        "status": "connected",
                        "model": self.model,
                        "message": f"Successfully verified OpenAI API key connection using {self.model}."
                    }
                elif resp.status_code == 401:
                    return {
                        "status": "error",
                        "missing_variable": "OPENAI_API_KEY",
                        "message": "Authentication failed: The OPENAI_API_KEY in your .env file is invalid or expired."
                    }
                else:
                    return {
                        "status": "error",
                        "message": f"OpenAI API responded with status {resp.status_code}: {resp.text}"
                    }
        except Exception as e:
            logger.warning(f"OpenAI test connection failed: {e}")
            return {
                "status": "error",
                "message": f"Failed to connect to OpenAI API endpoint: {str(e)}"
            }

    def analyze_threat(
        self,
        system_instruction: str,
        target_context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Run cognitive threat analysis using OpenAI chat completions."""
        if not self.is_configured:
            logger.info("OPENAI_API_KEY not configured. Falling back to deterministic rule engine.")
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key or settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
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
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a cyber security threat intelligence specialist that strictly outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
            "max_tokens": 600
        }

        try:
            with httpx.Client(timeout=8.0) as client:
                resp = client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return json.loads(content.strip())
                else:
                    logger.warning(f"OpenAI API returned status {resp.status_code}: {resp.text}")
                    return None
        except Exception as e:
            logger.warning(f"OpenAI API analysis call failed, falling back to rule engine: {e}")
            return None


openai_client = OpenAIClient()
