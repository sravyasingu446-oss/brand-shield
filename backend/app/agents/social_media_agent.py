import re
from typing import Optional
from app.agents.base import (
    BaseAgent, AgentResult, similarity_ratio, normalize_text,
    SUSPICIOUS_TLDS, PHISHING_KEYWORDS
)
from app.models.brand import Brand
from app.schemas.analysis import SocialAnalysisRequest


class SocialMediaAgent(BaseAgent):
    def __init__(self):
        super().__init__("Social Media Monitoring Agent")

    def analyze(self, brand: Brand, request: SocialAnalysisRequest) -> AgentResult:
        indicators = []
        mitigating = []
        raw = {}
        
        handle = request.handle.lstrip('@')
        display_name = request.display_name
        bio = request.bio or ""
        
        # 1. Handle spoofing / affix detection
        suspicious_affixes = ['support', 'helpdesk', 'official', 'service', 'care', 'security', 'verify', 'claims', 'assist']
        found_affixes = [aff for aff in suspicious_affixes if aff in handle.lower()]
        if found_affixes:
            indicators.append(f"Handle contains high-risk support/authority suffix: '{', '.join(found_affixes)}'.")

        # 2. Homoglyph / Typo squatting
        norm_handle = normalize_text(handle)
        norm_brand = normalize_text(brand.name)
        if norm_brand in norm_handle and norm_brand != handle.lower():
            indicators.append("Potential homoglyph or character substitution detected in username.")

        # 3. Bio analysis: claiming official status without verification
        claim_patterns = [r'\bofficial\b', r'\bverified\b', r'\bcustomer support\b', r'\bauthorized\b', r'\bheadquarters\b']
        claims_found = [p for p in claim_patterns if re.search(p, bio, re.IGNORECASE)]
        if claims_found and not request.is_verified:
            indicators.append("Profile claims official or customer care authorization in bio but lacks verified badge.")

        # 4. Follower metrics anomaly
        if request.follower_count is not None and request.follower_count < 250:
            if found_affixes or claims_found:
                indicators.append(f"Disproportionately low follower count ({request.follower_count}) for an institutional brand account.")
        elif request.follower_count is not None and request.follower_count > 50000 and request.is_verified:
            mitigating.append("Established follower volume and platform verification present.")

        if request.is_verified:
            mitigating.append("Platform verification badge is present.")

        # 5. External link in bio analysis
        urls_in_bio = re.findall(r'https?://[^\s]+', bio)
        for url in urls_in_bio:
            for tld in SUSPICIOUS_TLDS:
                if tld in url.lower():
                    indicators.append(f"Bio contains external link with high-risk TLD: {url}")
            if any(kw in url.lower() for kw in ['t.me', 'bit.ly', 'tinyurl', 'wa.me', 'linktr.ee']):
                indicators.append(f"Bio redirects to shortener or messaging channel ({url}), common in evasion.")

        # Determine risk level
        if len(indicators) >= 3:
            risk_level = "HIGH"
        elif len(indicators) >= 1:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        summary = (
            f"Evaluated @{handle} on {request.platform}. "
            f"Identified {len(indicators)} social risk indicators and {len(mitigating)} mitigating factors."
        )

        return AgentResult(
            agent_name=self.name,
            risk_level=risk_level,
            confidence=0.88,
            summary=summary,
            indicators_found=indicators,
            mitigating_factors=mitigating,
            raw_details={
                "platform": request.platform,
                "handle": handle,
                "follower_count": request.follower_count,
                "is_verified": request.is_verified,
                "indicators_count": len(indicators)
            }
        )
