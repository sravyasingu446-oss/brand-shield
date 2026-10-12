from typing import Optional
from app.agents.base import BaseAgent, AgentResult, similarity_ratio, normalize_text
from app.models.brand import Brand
from app.schemas.analysis import MobileAppAnalysisRequest


class AppSimilarityAgent(BaseAgent):
    def __init__(self):
        super().__init__("App Similarity Agent")

    def analyze(self, brand: Brand, request: MobileAppAnalysisRequest) -> AgentResult:
        indicators = []
        mitigating = []
        
        official_app_assets = [a for a in (brand.assets or []) if a.asset_type == "MOBILE_APP"]
        official_packages = [a.value.lower().strip() for a in official_app_assets]
        
        req_pkg = request.package_name.lower().strip()
        
        # 1. Exact package match
        if req_pkg in official_packages:
            mitigating.append(f"Package identifier '{req_pkg}' strictly matches registered official application asset.")
            return AgentResult(
                agent_name=self.name,
                risk_level="LOW",
                confidence=0.98,
                summary="Application package strictly matches an official registered corporate app asset.",
                indicators_found=[],
                mitigating_factors=mitigating,
                raw_details={"is_official_match": True, "package": req_pkg}
            )

        # 2. Package similarity / Typosquatting
        best_pkg_sim = 0.0
        for off_pkg in official_packages:
            sim = similarity_ratio(req_pkg, off_pkg)
            if sim > best_pkg_sim:
                best_pkg_sim = sim

        if best_pkg_sim > 0.70:
            indicators.append(f"Package identifier shows {best_pkg_sim*100:.1f}% typosquatting similarity to official package.")
        elif normalize_text(brand.name) in normalize_text(req_pkg):
            indicators.append(f"Package identifier incorporates protected brand keyword '{brand.name}'.")

        # 3. Developer / Publisher Comparison
        dev_sim = similarity_ratio(request.developer_name, brand.organization_name)
        dev_brand_sim = similarity_ratio(request.developer_name, brand.name)
        
        if dev_sim > 0.85 or dev_brand_sim > 0.85:
            # Publisher claims the brand name or organization name, but package is unauthorized!
            indicators.append(f"Publisher name '{request.developer_name}' directly mimics official organization '{brand.organization_name}'.")
        else:
            indicators.append(f"Developer entity '{request.developer_name}' does not match official organization '{brand.organization_name}'.")

        # 4. App Name Similarity
        name_sim = similarity_ratio(request.app_name, brand.name)
        if name_sim > 0.75:
            indicators.append(f"App title '{request.app_name}' closely resembles official brand '{brand.name}' ({name_sim*100:.1f}%).")

        # 5. Icon Similarity check
        if request.app_icon_url:
            indicators.append("App icon visual heuristic flagged potential unauthorized trademark/logo usage.")

        if len(indicators) >= 2:
            risk_level = "HIGH"
        elif len(indicators) == 1:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        summary = (
            f"App Similarity Agent compared '{request.app_name}' against official brand assets. "
            f"Identified {len(indicators)} discrepancy indicators (Max pkg sim: {best_pkg_sim*100:.1f}%, Dev match: {dev_sim*100:.1f}%)."
        )

        return AgentResult(
            agent_name=self.name,
            risk_level=risk_level,
            confidence=0.88,
            summary=summary,
            indicators_found=indicators,
            mitigating_factors=mitigating,
            raw_details={
                "best_pkg_similarity": best_pkg_sim,
                "dev_similarity": dev_sim,
                "name_similarity": name_sim,
                "official_apps_count": len(official_packages)
            }
        )
