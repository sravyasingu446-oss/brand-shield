import re
from typing import Optional, List
from app.agents.base import BaseAgent, AgentResult, normalize_text
from app.models.brand import Brand
from app.schemas.analysis import CompanyPageAnalysisRequest


class FakeCompanyPageAgent(BaseAgent):
    def __init__(self):
        super().__init__("Fake Company Page Agent")

    def analyze(self, brand: Brand, request: CompanyPageAnalysisRequest) -> AgentResult:
        indicators = []
        mitigating = []
        
        # 1. Contact email domain validation against official domain
        if request.contact_email:
            email = request.contact_email.lower().strip()
            email_domain = email.split('@')[-1] if '@' in email else ""
            
            # Check free webmail (gmail, yahoo, outlook, protonmail)
            free_providers = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com', 'mail.ru']
            if email_domain in free_providers:
                indicators.append(f"Official company recruitment uses free public webmail service ({email}) instead of corporate domain.")
            elif email_domain != brand.primary_domain.lower():
                indicators.append(f"Contact email domain '@{email_domain}' mismatches official verified domain '@{brand.primary_domain}'.")
            else:
                mitigating.append(f"Contact email domain matches official verified corporate domain '@{brand.primary_domain}'.")

        # 2. Recruitment scam indicators in description or job listings
        corpus = f"{request.page_name} {request.description_text or ''} {' '.join(request.job_titles or [])}".lower()
        
        recruitment_red_flags = [
            'remote data entry', 'immediate start no interview', 'equipment check',
            'home office stipend check', 'telegram interview', 'wire fee for background check',
            'cryptocurrency payment', 'no experience 50$/hr', 'work from home immediate hire'
        ]
        
        found_red_flags = [flag for flag in recruitment_red_flags if flag in corpus]
        if found_red_flags:
            indicators.append(f"Detected common employment scam patterns: '{', '.join(found_red_flags)}'.")

        # 3. Recruiter identity check
        if request.recruiter_name and ('hr' in request.recruiter_name.lower() or 'talent' in request.recruiter_name.lower()):
            indicators.append(f"Recruiter handle '{request.recruiter_name}' employs generic corporate identity markers without verifiable corporate ID.")

        if len(indicators) >= 2:
            risk_level = "HIGH"
        elif len(indicators) == 1:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        summary = (
            f"Fake Company Page Agent evaluated '{request.page_name}' on {request.platform}. "
            f"Flagged {len(indicators)} corporate discrepancy indicators."
        )

        return AgentResult(
            agent_name=self.name,
            risk_level=risk_level,
            confidence=0.89,
            summary=summary,
            indicators_found=indicators,
            mitigating_factors=mitigating,
            raw_details={
                "platform": request.platform,
                "contact_email": request.contact_email,
                "job_postings_count": len(request.job_titles or []),
                "red_flags": found_red_flags
            }
        )
