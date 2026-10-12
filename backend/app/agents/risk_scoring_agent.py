from typing import List, Dict, Any, Tuple
from app.agents.base import BaseAgent, AgentResult
from app.schemas.case import ExplainabilityReport, ExplainabilityFactor


class RiskScoringAgent(BaseAgent):
    def __init__(self):
        super().__init__("Risk Scoring Agent")

    def analyze(self, agent_results: List[AgentResult]) -> Tuple[int, str, ExplainabilityReport]:
        """Synthesize agent findings into an explainable 0-100 risk score and factor breakdown."""
        factors: List[ExplainabilityFactor] = []
        mitigations: List[str] = []

        # 1. Check for absolute official match first
        for res in agent_results:
            if res.raw_details.get("is_official_match") or res.raw_details.get("is_official_domain"):
                factors.append(ExplainabilityFactor(
                    factor_name="Verified Official Brand Asset",
                    category="Mitigating Identity",
                    weight=1.0,
                    score_contribution=-95.0,
                    description="Target strictly matches an authorized official asset registered in the corporate brand registry.",
                    risk_direction="MITIGATING"
                ))
                mitigations.append("Confirmed official corporate asset match.")
                report = ExplainabilityReport(
                    final_score=5,
                    risk_level="LOW",
                    confidence=0.99,
                    factors=factors,
                    summary_rationale="Target verified as legitimate official brand property.",
                    mitigations_present=mitigations
                )
                return 5, "LOW", report

        # 2. Compute individual agent component scores
        agent_weights = {
            "Brand Profile Agent": 0.20,
            "Brand Impersonation Agent": 0.25,
            "URL Analysis Agent": 0.35,
            "Social Media Monitoring Agent": 0.30,
            "Scam Detection Agent": 0.25,
            "Mobile App Monitoring Agent": 0.35,
            "App Similarity Agent": 0.25,
            "Fake Company Page Agent": 0.30,
        }

        component_scores = []
        weighted_sum = 0.0
        total_weight = 0.0
        has_critical_indicators = False

        for res in agent_results:
            weight = agent_weights.get(res.agent_name, 0.20)
            
            # Base severity by agent risk level
            if res.risk_level == "HIGH":
                base_sev = 80.0
            elif res.risk_level == "MEDIUM":
                base_sev = 50.0
            else:
                base_sev = 10.0

            # Add indicator scaling
            indicator_count = len(res.indicators_found)
            bonus = min(indicator_count * 4.0, 20.0)
            comp_score = min(base_sev + bonus, 100.0)
            
            # Check for critical keywords
            for ind in res.indicators_found:
                if any(k in ind.lower() for k in ['credential', 'harvesting', 'sms', 'trojan', 'malware', 'drainer', 'otp']):
                    has_critical_indicators = True

            component_scores.append(comp_score)
            weighted_sum += comp_score * weight
            total_weight += weight

            if res.indicators_found:
                factors.append(ExplainabilityFactor(
                    factor_name=f"{res.agent_name} Findings",
                    category=res.agent_name,
                    weight=weight,
                    score_contribution=round(comp_score * weight, 1),
                    description="; ".join(res.indicators_found[:3]),
                    risk_direction="POSITIVE"
                ))

            if res.mitigating_factors:
                for mit in res.mitigating_factors:
                    mitigations.append(mit)
                    factors.append(ExplainabilityFactor(
                        factor_name=f"Mitigation ({res.agent_name})",
                        category=res.agent_name,
                        weight=0.1,
                        score_contribution=-10.0,
                        description=mit,
                        risk_direction="MITIGATING"
                    ))

        # CVSS-style synthesis: Max component score is the primary driver, moderated by weighted average
        max_score = max(component_scores) if component_scores else 0.0
        weighted_avg = (weighted_sum / total_weight) if total_weight > 0 else 0.0
        
        # Primary threat model: 65% max single severity vector, 35% aggregated context
        composite_score = (0.65 * max_score) + (0.35 * weighted_avg)

        # Apply critical floor if credential harvesting / malware indicators exist
        if has_critical_indicators and composite_score < 75.0:
            composite_score = max(composite_score, 78.0)

        # Mitigations discount
        if mitigations:
            composite_score = max(0.0, composite_score - (len(mitigations) * 8.0))

        final_score = int(round(max(0.0, min(100.0, composite_score))))

        # Classification
        if final_score >= 70:
            risk_level = "HIGH"
        elif final_score >= 40:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Rationale
        pos_count = len([f for f in factors if f.risk_direction == "POSITIVE"])
        rationale = (
            f"Risk score of {final_score}/100 ({risk_level}) derived from {pos_count} positive risk vectors "
            f"and {len(mitigations)} mitigating factors across {len(agent_results)} security agents."
        )

        report = ExplainabilityReport(
            final_score=final_score,
            risk_level=risk_level,
            confidence=0.92,
            factors=factors,
            summary_rationale=rationale,
            mitigations_present=mitigations
        )

        return final_score, risk_level, report
