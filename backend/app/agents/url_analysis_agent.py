import re
import math
from urllib.parse import urlparse
from typing import Optional, List
from app.agents.base import (
    BaseAgent, AgentResult, SUSPICIOUS_TLDS, PHISHING_KEYWORDS,
    similarity_ratio, normalize_text
)
from app.models.brand import Brand
from app.schemas.analysis import UrlAnalysisRequest


def calculate_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string to detect randomized DGA domains."""
    if not text:
        return 0.0
    prob = [float(text.count(c)) / len(text) for c in dict.fromkeys(list(text))]
    entropy = - sum([p * math.log(p) / math.log(2.0) for p in prob])
    return round(entropy, 2)


class UrlAnalysisAgent(BaseAgent):
    def __init__(self):
        super().__init__("URL Analysis Agent")

    def analyze(self, brand: Brand, request: UrlAnalysisRequest) -> AgentResult:
        indicators = []
        mitigating = []
        raw = {}
        
        url_str = request.url.strip()
        if not url_str.startswith(('http://', 'https://')):
            url_str = f"https://{url_str}"
            
        parsed = urlparse(url_str)
        hostname = (parsed.hostname or "").lower()
        path = (parsed.path or "").lower()
        query = (parsed.query or "").lower()

        # 1. Match against official domains
        official_domains = [asset.value.lower().strip() for asset in (brand.assets or []) if asset.asset_type == "DOMAIN"]
        official_domains.append(brand.primary_domain.lower().strip())
        
        is_official = False
        for off_dom in official_domains:
            if hostname == off_dom or hostname.endswith(f".{off_dom}"):
                is_official = True
                mitigating.append(f"Domain strictly matches registered official domain or subdomain ({off_dom}).")
                break

        if is_official:
            return AgentResult(
                agent_name=self.name,
                risk_level="LOW",
                confidence=0.98,
                summary=f"URL '{request.url}' resolves to an official authenticated brand domain.",
                indicators_found=[],
                mitigating_factors=mitigating,
                raw_details={"is_official_domain": True, "hostname": hostname}
            )

        # 2. IP Address in Hostname
        ip_pattern = r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'
        if re.match(ip_pattern, hostname):
            indicators.append(f"Host uses bare IP address ({hostname}) rather than a registered domain name (common in drive-by phishing).")

        # 3. Subdomain Brand Spoofing (e.g. apexbank.secure-login-gate.com)
        norm_brand = normalize_text(brand.name)
        if norm_brand in hostname:
            # Check if brand name is in the subdomain rather than apex domain
            parts = hostname.split('.')
            if len(parts) >= 3:
                apex_domain = ".".join(parts[-2:])
                subdomain = ".".join(parts[:-2])
                if norm_brand in subdomain and norm_brand not in apex_domain:
                    indicators.append(f"Subdomain brand spoofing: Brand '{brand.name}' placed in subdomain '{subdomain}' while root domain is '{apex_domain}'.")

        # 4. Combosquatting / Excessive Hyphens
        if hostname.count('-') >= 2:
            indicators.append(f"Combosquatting pattern: Domain contains excessive hyphens ({hostname.count('-')}) to mimic genuine corporate portal.")

        # 5. Suspicious TLDs
        for tld in SUSPICIOUS_TLDS:
            if hostname.endswith(tld):
                indicators.append(f"Domain registered under high-abuse / high-risk TLD: '{tld}'.")
                break

        # 6. Phishing keywords in path or query
        url_full = f"{path}?{query}"
        found_phish_kw = [kw for kw in PHISHING_KEYWORDS if kw in url_full]
        if found_phish_kw:
            indicators.append(f"Phishing authentication keywords identified in URL endpoint: '{', '.join(found_phish_kw[:4])}'.")

        # 7. Entropy Analysis (DGA detection)
        domain_entropy = calculate_entropy(hostname.replace('.', '').replace('-', ''))
        if domain_entropy > 3.8 and len(hostname) > 15:
            indicators.append(f"High Shannon entropy ({domain_entropy}) suggests algorithmic domain generation (DGA) evasion.")

        # 8. Detected credential harvesting forms
        if request.detected_forms:
            sensitive_inputs = [f for f in request.detected_forms if any(k in f.lower() for k in ['password', 'card', 'cvv', 'ssn', 'pin', 'otp', 'token'])]
            if sensitive_inputs:
                indicators.append(f"Form analysis discovered sensitive credential capture fields: '{', '.join(sensitive_inputs)}' on untrusted domain.")

        # Determine Risk Level
        if len(indicators) >= 3 or (request.detected_forms and len(indicators) >= 2):
            risk_level = "HIGH"
        elif len(indicators) >= 1:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        summary = (
            f"URL Analysis Agent audited '{hostname}'. "
            f"Identified {len(indicators)} technical and heuristic phishing indicators."
        )

        return AgentResult(
            agent_name=self.name,
            risk_level=risk_level,
            confidence=0.93,
            summary=summary,
            indicators_found=indicators,
            mitigating_factors=mitigating,
            raw_details={
                "hostname": hostname,
                "domain_entropy": domain_entropy,
                "phishing_keywords": found_phish_kw,
                "suspicious_indicators_count": len(indicators)
            }
        )
