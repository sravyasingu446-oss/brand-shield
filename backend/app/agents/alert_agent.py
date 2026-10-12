from typing import Optional, Dict, Any
from app.agents.base import BaseAgent, AgentResult


class AlertAgent(BaseAgent):
    def __init__(self):
        super().__init__("Alert Agent")

    def evaluate_alert(
        self,
        brand_name: str,
        target_name: str,
        risk_score: int,
        risk_level: str,
        threat_category: str
    ) -> Optional[Dict[str, Any]]:
        """Evaluate whether to generate an urgent incident alert for SecOps."""
        if risk_level == "LOW":
            return None

        if risk_score >= 80:
            severity = "CRITICAL"
        elif risk_level == "HIGH":
            severity = "HIGH"
        else:
            severity = "MEDIUM"

        title = f"[{severity}] Impersonation Alert: {target_name} ({risk_score}/100)"
        message = (
            f"BrandShield AI identified high-probability {threat_category} targeting brand '{brand_name}'. "
            f"Risk Score: {risk_score}/100 ({risk_level}). Triage and human verification recommended immediately."
        )

        return {
            "title": title,
            "message": message,
            "severity": severity,
            "is_read": False,
            "is_dismissed": False
        }

    def analyze(self, *args, **kwargs) -> AgentResult:
        return AgentResult(
            agent_name=self.name,
            risk_level="LOW",
            confidence=0.95,
            summary="Alert Agent monitoring threat thresholds."
        )
