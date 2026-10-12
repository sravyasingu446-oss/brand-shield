import hashlib
from typing import List, Dict, Any
from app.agents.base import BaseAgent, AgentResult


class EvidenceCollectionAgent(BaseAgent):
    def __init__(self):
        super().__init__("Evidence Collection Agent")

    def collect_evidence(
        self,
        target_type: str,
        target_name: str,
        target_identifier: str,
        target_url: str,
        agent_results: List[AgentResult]
    ) -> List[Dict[str, Any]]:
        evidence_items = []

        # 1. Primary Target IOC Evidence
        target_raw = f"{target_type}:{target_identifier}:{target_url or ''}"
        target_hash = hashlib.sha256(target_raw.encode('utf-8')).hexdigest()
        
        evidence_items.append({
            "evidence_type": "PRIMARY_TARGET_IOC",
            "title": f"Target Artifact: {target_identifier}",
            "description": f"Verified target endpoint ({target_type}) captured during automated threat scanning.",
            "value": target_url or target_identifier,
            "severity": "INFO",
            "sha256_hash": target_hash
        })

        # 2. Extract technical findings from each agent
        for res in agent_results:
            for ind in res.indicators_found:
                ind_hash = hashlib.sha256(ind.encode('utf-8')).hexdigest()
                
                # Determine severity
                if any(k in ind.lower() for k in ['critical', 'harvesting', 'homoglyph', 'unauthorized', 'bare ip']):
                    sev = "CRITICAL"
                elif any(k in ind.lower() for k in ['high-risk', 'spoofing', 'permission', 'scam', 'typosquatting']):
                    sev = "HIGH"
                elif any(k in ind.lower() for k in ['discrepancy', 'low follower', 'hyphens']):
                    sev = "MEDIUM"
                else:
                    sev = "LOW"

                evidence_items.append({
                    "evidence_type": f"{res.agent_name.upper().replace(' ', '_')}_IOC",
                    "title": f"Flagged by {res.agent_name}",
                    "description": ind,
                    "value": ind[:250],
                    "severity": sev,
                    "sha256_hash": ind_hash
                })

        return evidence_items

    def analyze(self, *args, **kwargs) -> AgentResult:
        return AgentResult(
            agent_name=self.name,
            risk_level="LOW",
            confidence=0.99,
            summary="Evidence Collection Agent active and logging cryptographic IOC hashes."
        )
