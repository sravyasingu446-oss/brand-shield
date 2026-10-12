from typing import List, Optional
from app.agents.base import BaseAgent, AgentResult, similarity_ratio, contains_brand_keyword
from app.models.brand import Brand, BrandAsset


class BrandProfileAgent(BaseAgent):
    def __init__(self):
        super().__init__("Brand Profile Agent")

    def analyze(
        self,
        brand: Brand,
        target_name: str,
        target_identifier: str,
        target_url: Optional[str] = None
    ) -> AgentResult:
        indicators = []
        mitigating = []
        risk_level = "LOW"
        confidence = 0.90
        
        aliases = [a.strip() for a in (brand.trademark_names or "").split(",") if a.strip()]
        official_values = [asset.value.lower().strip() for asset in (brand.assets or [])]
        official_domains = [asset.value.lower().strip() for asset in (brand.assets or []) if asset.asset_type == "DOMAIN"]
        
        clean_target_id = target_identifier.lower().strip().lstrip('@')
        
        # 1. Check for official asset match
        is_official = False
        for val in official_values:
            clean_val = val.lstrip('@')
            if clean_target_id == clean_val:
                is_official = True
                mitigating.append(f"Target matches verified official brand asset: {val}")
                break

        if is_official:
            return AgentResult(
                agent_name=self.name,
                risk_level="LOW",
                confidence=0.98,
                summary=f"Item confirmed as an official registered asset for '{brand.name}'.",
                indicators_found=[],
                mitigating_factors=mitigating,
                raw_details={"is_official_match": True, "brand_id": brand.id}
            )

        # 2. Check for brand name proximity
        brand_sim = similarity_ratio(target_name, brand.name)
        id_sim = similarity_ratio(clean_target_id, brand.name)
        
        if contains_brand_keyword(clean_target_id, brand.name, aliases):
            indicators.append(f"Target identifier '{target_identifier}' incorporates brand trademark '{brand.name}'.")
        
        if contains_brand_keyword(target_name, brand.name, aliases):
            indicators.append(f"Target display name '{target_name}' contains brand keyword '{brand.name}'.")

        # Proximity score
        if brand_sim > 0.85 or id_sim > 0.85:
            indicators.append(f"High phonetic and orthographic similarity ({max(brand_sim, id_sim)*100:.1f}%) to official brand.")
            risk_level = "HIGH"
        elif brand_sim > 0.65 or id_sim > 0.65 or indicators:
            risk_level = "MEDIUM"

        summary = (
            f"Brand Profile Agent evaluated against '{brand.name}' ({brand.organization_name}). "
            f"{len(indicators)} brand reference indicators identified. Official asset match: Negative."
        )

        return AgentResult(
            agent_name=self.name,
            risk_level=risk_level,
            confidence=confidence,
            summary=summary,
            indicators_found=indicators,
            mitigating_factors=mitigating,
            raw_details={
                "brand_id": brand.id,
                "brand_name": brand.name,
                "similarity_name": brand_sim,
                "similarity_id": id_sim,
                "official_assets_checked": len(official_values)
            }
        )
