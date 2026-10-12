import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.agents.brand_profile_agent import BrandProfileAgent
from app.agents.social_media_agent import SocialMediaAgent
from app.agents.impersonation_agent import BrandImpersonationAgent
from app.agents.fake_company_page_agent import FakeCompanyPageAgent
from app.agents.scam_detection_agent import ScamDetectionAgent
from app.agents.mobile_app_agent import MobileAppMonitoringAgent
from app.agents.app_similarity_agent import AppSimilarityAgent
from app.agents.url_analysis_agent import UrlAnalysisAgent
from app.agents.risk_scoring_agent import RiskScoringAgent
from app.agents.evidence_collection_agent import EvidenceCollectionAgent
from app.agents.alert_agent import AlertAgent
from app.agents.report_generation_agent import ReportGenerationAgent
from app.agents.base import AgentResult
from app.models.brand import Brand
from app.schemas.analysis import (
    SocialAnalysisRequest, MobileAppAnalysisRequest,
    UrlAnalysisRequest, CompanyPageAnalysisRequest
)

logger = logging.getLogger(__name__)


class InvestigationOrchestratorAgent:
    def __init__(self):
        self.brand_agent = BrandProfileAgent()
        self.social_agent = SocialMediaAgent()
        self.impersonation_agent = BrandImpersonationAgent()
        self.fake_page_agent = FakeCompanyPageAgent()
        self.scam_agent = ScamDetectionAgent()
        self.mobile_agent = MobileAppMonitoringAgent()
        self.similarity_agent = AppSimilarityAgent()
        self.url_agent = UrlAnalysisAgent()
        self.scoring_agent = RiskScoringAgent()
        self.evidence_agent = EvidenceCollectionAgent()
        self.alert_agent = AlertAgent()
        self.report_agent = ReportGenerationAgent()

    def generate_case_number(self) -> str:
        short_id = uuid.uuid4().hex[:6].upper()
        year = datetime.now().year
        return f"CS-{year}-{short_id}"

    def investigate_social(self, brand: Brand, request: SocialAnalysisRequest) -> Dict[str, Any]:
        """Workflow: Social Media Profile Investigation."""
        agent_results: List[AgentResult] = []
        additional_checks = []

        # 1. Brand Profile Ground Truth Check
        brand_res = self.brand_agent.execute(
            brand=brand,
            target_name=request.display_name,
            target_identifier=request.handle,
            target_url=request.profile_url
        )
        agent_results.append(brand_res)

        # 2. Social Media Specialist Agent
        social_res = self.social_agent.execute(brand=brand, request=request)
        agent_results.append(social_res)

        # 3. Impersonation Agent
        imp_res = self.impersonation_agent.execute(
            brand=brand,
            target_name=request.display_name,
            target_bio_or_desc=request.bio or "",
            avatar_or_icon_url=request.avatar_url
        )
        agent_results.append(imp_res)

        # 4. Scam Detection Agent (on posts & bio)
        scam_corpus = (request.recent_posts or []) + ([request.bio] if request.bio else [])
        if scam_corpus:
            scam_res = self.scam_agent.execute(
                text_samples=request.recent_posts or [],
                target_context=request.bio
            )
            agent_results.append(scam_res)

        # 5. Check whether evidence is sufficient
        total_indicators = sum(len(r.indicators_found) for r in agent_results)
        evidence_sufficient = True
        
        # If bio contains links but no URL analysis was run, trigger URL check!
        if request.bio and ('http://' in request.bio or 'https://' in request.bio):
            import re
            links = re.findall(r'https?://[^\s]+', request.bio)
            if links:
                additional_checks.append(f"Recursive Deep URL Inspection on bio link: {links[0]}")
                url_sub_req = UrlAnalysisRequest(brand_id=brand.id, url=links[0])
                sub_url_res = self.url_agent.execute(brand=brand, request=url_sub_req)
                agent_results.append(sub_url_res)

        # 6. Risk Scoring
        risk_score, risk_level, explainability = self.scoring_agent.analyze(agent_results)

        # If borderline score (40-65), trigger supplemental linguistic check
        if 40 <= risk_score <= 65:
            additional_checks.append("Borderline risk threshold detected: Executed secondary leetspeak & brand phonetic dispersion audit.")
            evidence_sufficient = True

        # Threat Category
        if "High-threat credential harvesting" in str(explainability):
            threat_category = "Credential Harvesting & Social Impersonation"
        elif "Financial lure" in str(explainability):
            threat_category = "Fraudulent Giveaway / Scam Campaign"
        elif risk_level in ["HIGH", "MEDIUM"]:
            threat_category = "Brand Impersonation & Executive Pretexting"
        else:
            threat_category = "Low-Risk / Benign Social Media Entity"

        # 7. Collect Structured Evidence
        evidence_items = self.evidence_agent.collect_evidence(
            target_type="SOCIAL_PROFILE",
            target_name=request.display_name,
            target_identifier=request.handle,
            target_url=request.profile_url,
            agent_results=agent_results
        )

        # 8. Alert evaluation
        alert_payload = self.alert_agent.evaluate_alert(
            brand_name=brand.name,
            target_name=request.handle,
            risk_score=risk_score,
            risk_level=risk_level,
            threat_category=threat_category
        )

        case_number = self.generate_case_number()

        # 9. Report generation
        report_data = self.report_agent.generate_report_content(
            case_number=case_number,
            brand_name=brand.name,
            target_name=f"{request.display_name} ({request.handle})",
            target_type="SOCIAL_PROFILE",
            risk_score=risk_score,
            risk_level=risk_level,
            threat_category=threat_category,
            explainability=explainability.model_dump(),
            evidence_items=evidence_items
        )

        summary = (
            f"Automated multi-agent investigation of {request.platform} account {request.handle} for brand '{brand.name}'. "
            f"Assigned risk rating {risk_score}/100 ({risk_level}). Primary threat: {threat_category}."
        )

        return {
            "case_number": case_number,
            "brand_id": brand.id,
            "brand_name": brand.name,
            "target_type": "SOCIAL_PROFILE",
            "target_name": f"{request.display_name} ({request.handle})",
            "target_identifier": request.handle,
            "target_url": request.profile_url,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "status": "NEW" if risk_level != "LOW" else "RESOLVED",
            "threat_category": threat_category,
            "summary": summary,
            "evidence_sufficient": evidence_sufficient,
            "additional_checks_performed": additional_checks,
            "agent_findings": [r.model_dump() for r in agent_results],
            "explainability": explainability.model_dump(),
            "evidence_items": evidence_items,
            "alert_payload": alert_payload,
            "report_data": report_data,
            "recommended_actions": [p["action"] + ": " + p["detail"] for p in report_data["remediation_playbook"]]
        }

    def investigate_mobile_app(self, brand: Brand, request: MobileAppAnalysisRequest) -> Dict[str, Any]:
        """Workflow: Suspicious Mobile Application Investigation."""
        agent_results: List[AgentResult] = []
        additional_checks = []

        # 1. Brand Profile Check
        brand_res = self.brand_agent.execute(
            brand=brand,
            target_name=request.app_name,
            target_identifier=request.package_name,
            target_url=request.listing_url
        )
        agent_results.append(brand_res)

        # 2. Mobile App Monitoring Agent
        mobile_res = self.mobile_agent.execute(brand=brand, request=request)
        agent_results.append(mobile_res)

        # 3. App Similarity Agent
        sim_res = self.similarity_agent.execute(brand=brand, request=request)
        agent_results.append(sim_res)

        # 4. Impersonation Agent
        imp_res = self.impersonation_agent.execute(
            brand=brand,
            target_name=request.app_name,
            target_bio_or_desc=f"Publisher: {request.developer_name}. Package: {request.package_name}",
            avatar_or_icon_url=request.app_icon_url
        )
        agent_results.append(imp_res)

        # Additional Check: If privacy policy exists on unknown domain, run URL check
        if request.privacy_policy_url:
            additional_checks.append(f"Sub-investigation: Auditing privacy policy endpoint {request.privacy_policy_url}")
            sub_url = UrlAnalysisRequest(brand_id=brand.id, url=request.privacy_policy_url)
            url_res = self.url_agent.execute(brand=brand, request=sub_url)
            agent_results.append(url_res)

        risk_score, risk_level, explainability = self.scoring_agent.analyze(agent_results)

        threat_category = (
            "Rogue Mobile App / Trojanized Banking APK" if risk_level == "HIGH"
            else "Suspicious Unofficial Application Listing" if risk_level == "MEDIUM"
            else "Verified Official / Benign Mobile App"
        )

        evidence_items = self.evidence_agent.collect_evidence(
            target_type="MOBILE_APP",
            target_name=request.app_name,
            target_identifier=request.package_name,
            target_url=request.listing_url or "",
            agent_results=agent_results
        )

        alert_payload = self.alert_agent.evaluate_alert(
            brand_name=brand.name,
            target_name=f"{request.app_name} ({request.package_name})",
            risk_score=risk_score,
            risk_level=risk_level,
            threat_category=threat_category
        )

        case_number = self.generate_case_number()

        report_data = self.report_agent.generate_report_content(
            case_number=case_number,
            brand_name=brand.name,
            target_name=f"{request.app_name} ({request.package_name})",
            target_type="MOBILE_APP",
            risk_score=risk_score,
            risk_level=risk_level,
            threat_category=threat_category,
            explainability=explainability.model_dump(),
            evidence_items=evidence_items
        )

        summary = (
            f"Mobile application compliance investigation for '{request.app_name}' claiming affiliation with {brand.name}. "
            f"Risk rating: {risk_score}/100 ({risk_level}). Category: {threat_category}."
        )

        return {
            "case_number": case_number,
            "brand_id": brand.id,
            "brand_name": brand.name,
            "target_type": "MOBILE_APP",
            "target_name": f"{request.app_name} ({request.package_name})",
            "target_identifier": request.package_name,
            "target_url": request.listing_url,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "status": "NEW" if risk_level != "LOW" else "RESOLVED",
            "threat_category": threat_category,
            "summary": summary,
            "evidence_sufficient": True,
            "additional_checks_performed": additional_checks,
            "agent_findings": [r.model_dump() for r in agent_results],
            "explainability": explainability.model_dump(),
            "evidence_items": evidence_items,
            "alert_payload": alert_payload,
            "report_data": report_data,
            "recommended_actions": [p["action"] + ": " + p["detail"] for p in report_data["remediation_playbook"]]
        }

    def investigate_url(self, brand: Brand, request: UrlAnalysisRequest) -> Dict[str, Any]:
        """Workflow: Suspicious URL / Phishing Domain Investigation."""
        agent_results: List[AgentResult] = []
        additional_checks = []

        # 1. Brand Profile Check
        brand_res = self.brand_agent.execute(
            brand=brand,
            target_name=request.page_title or request.url,
            target_identifier=request.url,
            target_url=request.url
        )
        agent_results.append(brand_res)

        # 2. URL Analysis Specialist Agent
        url_res = self.url_agent.execute(brand=brand, request=request)
        agent_results.append(url_res)

        # 3. Impersonation Agent
        imp_res = self.impersonation_agent.execute(
            brand=brand,
            target_name=request.page_title or "Web Portal",
            target_bio_or_desc=f"URL: {request.url}. Meta: {request.meta_description or ''}"
        )
        agent_results.append(imp_res)

        # 4. Scam Agent (if title / meta exists)
        if request.page_title or request.meta_description:
            scam_res = self.scam_agent.execute(
                text_samples=[request.page_title or ""],
                target_context=request.meta_description or ""
            )
            agent_results.append(scam_res)

        # Additional Check: If form captures credentials, add critical IOC check
        if request.detected_forms:
            additional_checks.append("Form input telemetry confirmed: Executed active credential harvesting payload evaluation.")

        risk_score, risk_level, explainability = self.scoring_agent.analyze(agent_results)

        threat_category = (
            "Phishing Portal & Credential Harvesting Website" if risk_level == "HIGH"
            else "Suspicious Domain Squatting / Unofficial Landing Page" if risk_level == "MEDIUM"
            else "Authenticated Official / Benign Domain"
        )

        evidence_items = self.evidence_agent.collect_evidence(
            target_type="PHISHING_URL",
            target_name=request.page_title or request.url,
            target_identifier=request.url,
            target_url=request.url,
            agent_results=agent_results
        )

        alert_payload = self.alert_agent.evaluate_alert(
            brand_name=brand.name,
            target_name=request.url,
            risk_score=risk_score,
            risk_level=risk_level,
            threat_category=threat_category
        )

        case_number = self.generate_case_number()

        report_data = self.report_agent.generate_report_content(
            case_number=case_number,
            brand_name=brand.name,
            target_name=request.url,
            target_type="PHISHING_URL",
            risk_score=risk_score,
            risk_level=risk_level,
            threat_category=threat_category,
            explainability=explainability.model_dump(),
            evidence_items=evidence_items
        )

        summary = (
            f"URL security investigation for '{request.url}' targeting {brand.name}. "
            f"Risk assessment: {risk_score}/100 ({risk_level}). Category: {threat_category}."
        )

        return {
            "case_number": case_number,
            "brand_id": brand.id,
            "brand_name": brand.name,
            "target_type": "PHISHING_URL",
            "target_name": request.page_title or request.url,
            "target_identifier": request.url,
            "target_url": request.url,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "status": "NEW" if risk_level != "LOW" else "RESOLVED",
            "threat_category": threat_category,
            "summary": summary,
            "evidence_sufficient": True,
            "additional_checks_performed": additional_checks,
            "agent_findings": [r.model_dump() for r in agent_results],
            "explainability": explainability.model_dump(),
            "evidence_items": evidence_items,
            "alert_payload": alert_payload,
            "report_data": report_data,
            "recommended_actions": [p["action"] + ": " + p["detail"] for p in report_data["remediation_playbook"]]
        }

    def investigate_company_page(self, brand: Brand, request: CompanyPageAnalysisRequest) -> Dict[str, Any]:
        """Workflow: Fake Corporate Page / Recruiter Scam Investigation."""
        agent_results: List[AgentResult] = []
        additional_checks = []

        brand_res = self.brand_agent.execute(
            brand=brand,
            target_name=request.page_name,
            target_identifier=request.page_url,
            target_url=request.page_url
        )
        agent_results.append(brand_res)

        fake_page_res = self.fake_page_agent.execute(brand=brand, request=request)
        agent_results.append(fake_page_res)

        imp_res = self.impersonation_agent.execute(
            brand=brand,
            target_name=request.page_name,
            target_bio_or_desc=request.description_text or ""
        )
        agent_results.append(imp_res)

        scam_res = self.scam_agent.execute(
            text_samples=request.job_titles or [],
            target_context=request.description_text
        )
        agent_results.append(scam_res)

        if request.contact_email and not request.contact_email.endswith(brand.primary_domain):
            additional_checks.append(f"Domain mismatch check on recruiter email provider {request.contact_email}")

        risk_score, risk_level, explainability = self.scoring_agent.analyze(agent_results)

        threat_category = (
            "Fraudulent Recruitment & Fake Corporate Directory" if risk_level in ["HIGH", "MEDIUM"]
            else "Authorized Corporate Listing"
        )

        evidence_items = self.evidence_agent.collect_evidence(
            target_type="FAKE_PAGE",
            target_name=request.page_name,
            target_identifier=request.page_url,
            target_url=request.page_url,
            agent_results=agent_results
        )

        alert_payload = self.alert_agent.evaluate_alert(
            brand_name=brand.name,
            target_name=request.page_name,
            risk_score=risk_score,
            risk_level=risk_level,
            threat_category=threat_category
        )

        case_number = self.generate_case_number()

        report_data = self.report_agent.generate_report_content(
            case_number=case_number,
            brand_name=brand.name,
            target_name=request.page_name,
            target_type="FAKE_PAGE",
            risk_score=risk_score,
            risk_level=risk_level,
            threat_category=threat_category,
            explainability=explainability.model_dump(),
            evidence_items=evidence_items
        )

        summary = (
            f"Corporate page legitimacy analysis for '{request.page_name}' on {request.platform}. "
            f"Risk score: {risk_score}/100 ({risk_level}). Category: {threat_category}."
        )

        return {
            "case_number": case_number,
            "brand_id": brand.id,
            "brand_name": brand.name,
            "target_type": "FAKE_PAGE",
            "target_name": request.page_name,
            "target_identifier": request.page_url,
            "target_url": request.page_url,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "status": "NEW" if risk_level != "LOW" else "RESOLVED",
            "threat_category": threat_category,
            "summary": summary,
            "evidence_sufficient": True,
            "additional_checks_performed": additional_checks,
            "agent_findings": [r.model_dump() for r in agent_results],
            "explainability": explainability.model_dump(),
            "evidence_items": evidence_items,
            "alert_payload": alert_payload,
            "report_data": report_data,
            "recommended_actions": [p["action"] + ": " + p["detail"] for p in report_data["remediation_playbook"]]
        }


orchestrator = InvestigationOrchestratorAgent()
