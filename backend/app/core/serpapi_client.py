import logging
from typing import Optional, Dict, Any, List
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class SerpApiClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SERPAPI_API_KEY
        self.base_url = "https://serpapi.com/search.json"

    @property
    def is_configured(self) -> bool:
        key = self.api_key or settings.SERPAPI_API_KEY
        return bool(key and len(key.strip()) > 8 and not key.strip().startswith("your_"))

    def check_configuration_or_error(self) -> Optional[Dict[str, Any]]:
        """Validate if SERPAPI_API_KEY is configured; return clear error dict if missing."""
        if not self.is_configured:
            return {
                "status": "error",
                "missing_variable": "SERPAPI_API_KEY",
                "message": (
                    "Missing environment variable: SERPAPI_API_KEY. "
                    "Please configure 'SERPAPI_API_KEY=your_key_here' in the .env file in the project root."
                )
            }
        return None

    def test_connection(self) -> Dict[str, Any]:
        """Test whether the SerpAPI key is configured and valid."""
        err = self.check_configuration_or_error()
        if err:
            return err

        params = {
            "api_key": self.api_key or settings.SERPAPI_API_KEY,
            "q": "BrandShield AI security test",
            "num": 1,
            "engine": "google"
        }

        try:
            with httpx.Client(timeout=8.0) as client:
                resp = client.get(self.base_url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    if "error" in data:
                        return {
                            "status": "error",
                            "missing_variable": "SERPAPI_API_KEY",
                            "message": f"SerpAPI Error: {data['error']}"
                        }
                    return {
                        "status": "connected",
                        "message": "Successfully verified SerpAPI connection for real-time search engine monitoring."
                    }
                elif resp.status_code == 401 or resp.status_code == 403:
                    return {
                        "status": "error",
                        "missing_variable": "SERPAPI_API_KEY",
                        "message": "Authentication failed: The SERPAPI_API_KEY in your .env file is invalid."
                    }
                else:
                    return {
                        "status": "error",
                        "message": f"SerpAPI responded with status {resp.status_code}: {resp.text}"
                    }
        except Exception as e:
            logger.warning(f"SerpAPI test connection failed: {e}")
            return {
                "status": "error",
                "message": f"Failed to connect to SerpAPI endpoint: {str(e)}"
            }

    def search_brand_impersonations(
        self,
        brand_name: str,
        search_type: str = "all"
    ) -> Dict[str, Any]:
        """Search the public web via SerpAPI for brand impersonations and phishing candidates."""
        err = self.check_configuration_or_error()
        if err:
            return {
                "success": False,
                "error": err["message"],
                "missing_variable": err["missing_variable"],
                "results": []
            }

        # Formulate search queries based on threat vector
        query_map = {
            "social": f'"{brand_name}" (support OR helpdesk OR official) (site:twitter.com OR site:linkedin.com OR site:instagram.com)',
            "phishing": f'"{brand_name}" (login OR signin OR verify OR wallet) -site:{brand_name.lower().replace(" ", "")}.com',
            "mobile": f'"{brand_name}" apk download',
            "all": f'"{brand_name}" (support OR login OR apk OR verify)'
        }
        query = query_map.get(search_type, query_map["all"])

        params = {
            "api_key": self.api_key or settings.SERPAPI_API_KEY,
            "q": query,
            "engine": "google",
            "num": 5
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(self.base_url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    organic = data.get("organic_results", [])
                    items = []
                    for res in organic:
                        items.append({
                            "title": res.get("title", ""),
                            "link": res.get("link", ""),
                            "snippet": res.get("snippet", ""),
                            "displayed_link": res.get("displayed_link", "")
                        })
                    return {
                        "success": True,
                        "query": query,
                        "results": items
                    }
                else:
                    return {
                        "success": False,
                        "error": f"SerpAPI responded with HTTP {resp.status_code}: {resp.text}",
                        "results": []
                    }
        except Exception as e:
            logger.warning(f"SerpAPI query failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "results": []
            }


serpapi_client = SerpApiClient()
