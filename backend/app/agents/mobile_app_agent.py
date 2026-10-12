from typing import List, Optional
from app.agents.base import BaseAgent, AgentResult, SUSPICIOUS_TLDS
from app.models.brand import Brand
from app.schemas.analysis import MobileAppAnalysisRequest

HIGH_RISK_PERMISSIONS = {
    'READ_SMS': 'Critical: Allows intercepting 2FA OTP codes.',
    'RECEIVE_SMS': 'Critical: Can stealthily consume incoming banking OTPs.',
    'SYSTEM_ALERT_WINDOW': 'High: Overlay attack potential to steal credentials.',
    'BIND_ACCESSIBILITY_SERVICE': 'Critical: Malware keylogger / UI scraping capabilities.',
    'REQUEST_INSTALL_PACKAGES': 'High: Dropper capability to download secondary payloads.',
    'RECORD_AUDIO': 'Medium: Audio surveillance risk without clear justification.',
    'CAMERA': 'Medium: Image capture permission.'
}


class MobileAppMonitoringAgent(BaseAgent):
    def __init__(self):
        super().__init__("Mobile App Monitoring Agent")

    def analyze(self, brand: Brand, request: MobileAppAnalysisRequest) -> AgentResult:
        indicators = []
        mitigating = []
        
        # 1. High-risk permissions check
        flagged_perms = []
        for perm in (request.permissions or []):
            clean_p = perm.upper().replace('ANDROID.PERMISSION.', '')
            if clean_p in HIGH_RISK_PERMISSIONS:
                flagged_perms.append((clean_p, HIGH_RISK_PERMISSIONS[clean_p]))
        
        if flagged_perms:
            for p, desc in flagged_perms:
                indicators.append(f"Dangerous Android Permission requested: {p} ({desc})")

        # 2. Privacy Policy Validation
        if not request.privacy_policy_url:
            indicators.append("App store listing lacks mandatory privacy policy documentation.")
        else:
            p_url = request.privacy_policy_url.lower()
            if any(free_host in p_url for free_host in ['sites.google.com', 'blogspot.com', 'wordpress.com', 'notion.site']):
                indicators.append(f"Privacy policy hosted on unverified free blogging platform ({request.privacy_policy_url}).")
            elif any(tld in p_url for tld in SUSPICIOUS_TLDS):
                indicators.append(f"Privacy policy points to high-risk TLD: {request.privacy_policy_url}")
            elif brand.primary_domain.lower() in p_url:
                mitigating.append(f"Privacy policy is hosted on official verified domain '{brand.primary_domain}'.")

        # 3. Third-party APK repository risk
        if request.app_store == "THIRD_PARTY_APK":
            indicators.append("Application distributed via unverified third-party APK aggregator outside official app stores.")

        # 4. Download count anomaly
        if request.download_count_range in ['100+', '500+', '1K+'] and brand.industry.lower().startswith(('bank', 'finance', 'fintech')):
            indicators.append(f"Suspiciously low install volume ({request.download_count_range}) for a recognized institutional financial service.")

        if len(indicators) >= 3 or any('Critical' in desc for _, desc in flagged_perms):
            risk_level = "HIGH"
        elif len(indicators) >= 1:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        summary = (
            f"Mobile App Monitoring Agent audited '{request.app_name}' ({request.package_name}). "
            f"Detected {len(indicators)} security compliance and risk indicators."
        )

        return AgentResult(
            agent_name=self.name,
            risk_level=risk_level,
            confidence=0.90,
            summary=summary,
            indicators_found=indicators,
            mitigating_factors=mitigating,
            raw_details={
                "app_name": request.app_name,
                "package_name": request.package_name,
                "store": request.app_store,
                "flagged_permissions_count": len(flagged_perms),
                "has_privacy_policy": bool(request.privacy_policy_url)
            }
        )
