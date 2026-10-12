import json
from typing import Dict, Any, List
from app.agents.base import BaseAgent, AgentResult


class ReportGenerationAgent(BaseAgent):
    def __init__(self):
        super().__init__("Report Generation Agent")

    def generate_report_content(
        self,
        case_number: str,
        brand_name: str,
        target_name: str,
        target_type: str,
        risk_score: int,
        risk_level: str,
        threat_category: str,
        explainability: Dict[str, Any],
        evidence_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Synthesize technical findings into an executive security report."""
        title = f"Brand Protection Incident Investigation Report - {case_number}"
        
        exec_summary = (
            f"This digital risk investigation was executed by BrandShield AI on behalf of {brand_name}. "
            f"The analyzed asset '{target_name}' ({target_type}) has been classified as {risk_level} Risk "
            f"with an explainable risk rating of {risk_score}/100. "
            f"The primary threat identified is '{threat_category}'. "
            f"The findings suggest deliberate brand impersonation and potential deception aimed at customers and stakeholders. "
            f"Prompt mitigation actions are advised to protect consumer trust and institutional integrity."
        )

        methodology = (
            "Investigation conducted via BrandShield Multi-Agent Digital Risk Protection Framework. "
            "Pipeline executed automated entity correlation against verified brand registries, "
            "lexical and homoglyph distance modeling, technical infrastructure evaluation (DNS, SSL, TLDs, entropy), "
            "app listing compliance auditing, and social engineering heuristic analysis."
        )

        # Threat indicators
        threat_indicators = []
        for ev in evidence_items:
            threat_indicators.append({
                "type": ev.get("evidence_type"),
                "title": ev.get("title"),
                "detail": ev.get("description"),
                "severity": ev.get("severity"),
                "sha256": ev.get("sha256_hash", "")[:16] + "..." if ev.get("sha256_hash") else ""
            })

        # Remediation Playbook
        remediation_playbook = [
            {
                "step": 1,
                "action": "Evidence Preservation",
                "detail": f"Cryptographic hashes and network telemetry have been logged. Case file {case_number} sealed."
            },
            {
                "step": 2,
                "action": "Provider Takedown Notice",
                "detail": f"Dispatch standardized DMCA/Abuse infringement notice to hosting provider and platform registrar referencing {brand_name} trademarks."
            },
            {
                "step": 3,
                "action": "Threat Intel & DNS Blocklisting",
                "detail": f"Submit malicious IOC endpoints to public threat feeds (Google Safe Browsing, PhishTank, Quad9)."
            },
            {
                "step": 4,
                "action": "Customer Awareness Advisory",
                "detail": "Issue defensive advisory across verified channels warning users against unauthorized solicitations."
            }
        ]

        return {
            "title": title,
            "executive_summary": exec_summary,
            "methodology": methodology,
            "threat_indicators": threat_indicators,
            "remediation_playbook": remediation_playbook
        }

    def analyze(self, *args, **kwargs) -> AgentResult:
        return AgentResult(
            agent_name=self.name,
            risk_level="LOW",
            confidence=0.98,
            summary="Report Generation Agent prepared."
        )
