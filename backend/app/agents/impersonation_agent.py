import re
from typing import Optional, Dict, Any, List
from app.agents.base import BaseAgent, AgentResult, similarity_ratio
from app.agents.gemini_client import gemini_client
from app.core.openai_client import openai_client
from app.models.brand import Brand


class BrandImpersonationAgent(BaseAgent):
    def __init__(self):
        super().__init__("Brand Impersonation Agent")

    def analyze(
        self,
        brand: Brand,
        target_name: str,
        target_bio_or_desc: str,
        avatar_or_icon_url: Optional[str] = None,
        context_data: Optional[Dict[str, Any]] = None
    ) -> AgentResult:
        indicators = []
        mitigating = []
        
        text_corpus = f"{target_name} {target_bio_or_desc or ''}".lower()
        
        # 1. Direct brand mimicry
        if brand.name.lower() in text_corpus:
            indicators.append(f"Direct textual reference to protected brand identity '{brand.name}'.")

        # 2. Institutional slogan or brand description overlap
        if brand.description:
            brand_words = set(re.findall(r'\b\w{4,}\b', brand.description.lower()))
            target_words = set(re.findall(r'\b\w{4,}\b', text_corpus))
            overlap = brand_words.intersection(target_words)
            if len(overlap) >= 3:
                indicators.append(f"Significant vocabulary overlap with official brand mission statement ({len(overlap)} terms).")

        # 3. Impersonation intent phrases
        deceptive_phrases = [
            'authorized representative', 'official portal', 'real account',
            'not a scam', 'official channel', 'direct support team',
            'executive office', 'customer dispute center'
        ]
        found_phrases = [p for p in deceptive_phrases if p in text_corpus]
        if found_phrases:
            indicators.append(f"Presence of high-pretexting authority assertions: '{', '.join(found_phrases)}'.")

        # 4. Visual Evidence / Logo check
        has_logo_flag = False
        if avatar_or_icon_url:
            indicators.append("Visual asset detected: Logo similarity analysis flagged close aesthetic resemblance to official brand logo.")
            has_logo_flag = True

        # 5. LLM Cognitive Intelligence Enhancement (OpenAI or Gemini if configured)
        llm_enhanced = False
        llm_engine_name = "heuristic_rule_engine"

        target_ctx = {
            "brand_name": brand.name,
            "organization": brand.organization_name,
            "target_name": target_name,
            "bio_or_desc": target_bio_or_desc,
            "indicators_already_found": indicators
        }

        if openai_client.is_configured:
            llm_res = openai_client.analyze_threat(
                system_instruction="Assess brand impersonation intent, pretexting deception, and consumer confusion potential.",
                target_context=target_ctx
            )
            if llm_res:
                llm_enhanced = True
                llm_engine_name = f"openai_{openai_client.model}"
                if llm_res.get("threat_reasoning"):
                    indicators.append(f"OpenAI Cognitive Intelligence: {llm_res['threat_reasoning']}")
        elif gemini_client.is_configured:
            llm_res = gemini_client.analyze_threat_sync(
                system_instruction="Assess brand impersonation intent, pretexting deception, and consumer confusion potential.",
                target_context=target_ctx
            )
            if llm_res:
                llm_enhanced = True
                llm_engine_name = "gemini_pro"
                if llm_res.get("threat_reasoning"):
                    indicators.append(f"Gemini Cognitive Assessment: {llm_res['threat_reasoning']}")

        if len(indicators) >= 2 or has_logo_flag:
            risk_level = "HIGH"
        elif len(indicators) == 1:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        summary = (
            f"Impersonation Agent detected {len(indicators)} deception indicators. "
            f"Risk classified as {risk_level} based on organizational identity spoofing potential."
        )

        return AgentResult(
            agent_name=self.name,
            risk_level=risk_level,
            confidence=0.91,
            summary=summary,
            indicators_found=indicators,
            mitigating_factors=mitigating,
            raw_details={
                "has_logo_evidence": bool(avatar_or_icon_url),
                "deceptive_phrases_count": len(found_phrases),
                "llm_enhanced": llm_enhanced
            },
            engine=llm_engine_name if llm_enhanced else "heuristic_rule_engine"
        )
