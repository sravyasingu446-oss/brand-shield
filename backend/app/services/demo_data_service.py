import hashlib
import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.brand import Brand, BrandAsset
from app.models.case import InvestigationCase, EvidenceItem
from app.models.alert import Alert
from app.models.report import InvestigationReport


class DemoDataService:
    @staticmethod
    def seed_demo_data(db: Session, force: bool = False) -> dict:
        """Seed high-fidelity demonstration data for hackathon presentation."""
        existing_brands_count = db.query(Brand).count()
        if existing_brands_count > 0 and not force:
            return {"status": "skipped", "message": "Database already contains brand data."}

        if force:
            # Clear existing data
            db.query(InvestigationReport).delete()
            db.query(Alert).delete()
            db.query(EvidenceItem).delete()
            db.query(InvestigationCase).delete()
            db.query(BrandAsset).delete()
            db.query(Brand).delete()
            db.commit()

        # ---------------- BRAND 1: Apex Global Bank ----------------
        b1 = Brand(
            name="Apex Global Bank",
            organization_name="Apex Financial Group Inc.",
            industry="Banking & Financial Services",
            description="Global retail and commercial banking institution offering checking, mortgages, wealth management, and digital mobile banking.",
            primary_domain="apexbank.com",
            logo_url="https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=128&q=80",
            contact_email="security@apexbank.com",
            trademark_names="Apex Bank, Apex Financial, ApexPay, Apex Wealth"
        )
        db.add(b1)
        db.flush()

        # Assets for Apex
        b1_assets = [
            BrandAsset(brand_id=b1.id, asset_type="DOMAIN", platform="WEB", value="apexbank.com", is_verified=True, notes="Primary institutional domain"),
            BrandAsset(brand_id=b1.id, asset_type="DOMAIN", platform="WEB", value="online.apexbank.com", is_verified=True, notes="Verified online banking sub-portal"),
            BrandAsset(brand_id=b1.id, asset_type="SOCIAL_HANDLE", platform="TWITTER", value="@apexbank", is_verified=True, notes="Official verified institutional handle"),
            BrandAsset(brand_id=b1.id, asset_type="SOCIAL_HANDLE", platform="LINKEDIN", value="apex-global-bank", is_verified=True, notes="Official corporate LinkedIn company page"),
            BrandAsset(brand_id=b1.id, asset_type="MOBILE_APP", platform="GOOGLE_PLAY", value="com.apexbank.mobile", is_verified=True, notes="Official Android banking application"),
            BrandAsset(brand_id=b1.id, asset_type="MOBILE_APP", platform="APPLE_APP_STORE", value="id1489204812", is_verified=True, notes="Official iOS banking application")
        ]
        db.add_all(b1_assets)

        # ---------------- BRAND 2: CloudPulse SaaS ----------------
        b2 = Brand(
            name="CloudPulse",
            organization_name="CloudPulse Technologies LLC",
            industry="Cloud Infrastructure & DevOps",
            description="Next-generation cloud telemetry, distributed observability, and automated Kubernetes orchestration platform.",
            primary_domain="cloudpulse.io",
            logo_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&q=80",
            contact_email="infosec@cloudpulse.io",
            trademark_names="CloudPulse, PulseCloud, PulseTelemetry"
        )
        db.add(b2)
        db.flush()

        b2_assets = [
            BrandAsset(brand_id=b2.id, asset_type="DOMAIN", platform="WEB", value="cloudpulse.io", is_verified=True, notes="Primary production domain"),
            BrandAsset(brand_id=b2.id, asset_type="DOMAIN", platform="WEB", value="app.cloudpulse.io", is_verified=True, notes="SaaS application dashboard"),
            BrandAsset(brand_id=b2.id, asset_type="SOCIAL_HANDLE", platform="TWITTER", value="@cloudpulse_io", is_verified=True, notes="Official developer updates handle"),
            BrandAsset(brand_id=b2.id, asset_type="SOCIAL_HANDLE", platform="GITHUB", value="cloudpulse-org", is_verified=True, notes="Official open-source repository org")
        ]
        db.add_all(b2_assets)

        # ---------------- BRAND 3: CyberGuard Security ----------------
        b3 = Brand(
            name="CyberGuard",
            organization_name="CyberGuard Security Corporation",
            industry="Cybersecurity & Defense",
            description="Enterprise MDR, managed threat hunting, and automated perimeter vulnerability intelligence.",
            primary_domain="cyberguardsec.com",
            logo_url="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&q=80",
            contact_email="abuse@cyberguardsec.com",
            trademark_names="CyberGuard, CyberShield, GuardSOC"
        )
        db.add(b3)
        db.flush()

        b3_assets = [
            BrandAsset(brand_id=b3.id, asset_type="DOMAIN", platform="WEB", value="cyberguardsec.com", is_verified=True, notes="Primary security portal"),
            BrandAsset(brand_id=b3.id, asset_type="SOCIAL_HANDLE", platform="LINKEDIN", value="cyberguard-security", is_verified=True, notes="Official LinkedIn company page")
        ]
        db.add_all(b3_assets)

        # ---------------- BRAND 4: SwiftPay Financial ----------------
        b4 = Brand(
            name="SwiftPay",
            organization_name="SwiftPay Payments Network",
            industry="Fintech & P2P Payments",
            description="Instant mobile payment rail, multi-currency debit cards, and contactless peer-to-peer transfers.",
            primary_domain="swiftpay.co",
            logo_url="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&q=80",
            contact_email="security@swiftpay.co",
            trademark_names="SwiftPay, SwiftWallet, SwiftCard"
        )
        db.add(b4)
        db.flush()

        b4_assets = [
            BrandAsset(brand_id=b4.id, asset_type="DOMAIN", platform="WEB", value="swiftpay.co", is_verified=True, notes="Primary consumer app website"),
            BrandAsset(brand_id=b4.id, asset_type="SOCIAL_HANDLE", platform="TWITTER", value="@swiftpay", is_verified=True, notes="Official verified account"),
            BrandAsset(brand_id=b4.id, asset_type="MOBILE_APP", platform="GOOGLE_PLAY", value="com.swiftpay.wallet", is_verified=True, notes="Android mobile wallet application")
        ]
        db.add_all(b4_assets)

        db.commit()

        # ---------------- CASES SEEDING ----------------
        now = datetime.now(timezone.utc)

        cases_specs = [
            # Case 1: High Risk Phishing URL targeting Apex
            {
                "brand": b1,
                "case_number": "CS-2026-0081",
                "target_type": "PHISHING_URL",
                "target_name": "Apex Online Banking Verification Portal",
                "target_identifier": "https://apexbank-auth-verify.xyz/login",
                "target_url": "https://apexbank-auth-verify.xyz/login",
                "risk_score": 94,
                "risk_level": "HIGH",
                "status": "IN_REVIEW",
                "threat_category": "Phishing Portal & Credential Harvesting Website",
                "summary": "Sophisticated phishing landing page mimicking Apex Global Bank login portal. Captures username, password, and SMS 2FA codes on a suspicious .xyz domain.",
                "reviewer_name": "Alice Chen (SecOps Lead)",
                "review_notes": "Confirmed active credential harvesting form. Domain registered 48 hours ago in Russia. Escalated to Netcraft and Google Safe Browsing.",
                "action_taken": "Takedown Requested (Cloudflare Abuse & Registrar)",
                "created_at": now - timedelta(hours=3),
                "factors": [
                    {"factor_name": "Phishing Keywords & Sensitive Forms", "category": "URL Analysis Agent", "weight": 0.25, "score_contribution": 25.0, "description": "Form contains input fields for 'account_number', 'password', and 'sms_otp'.", "risk_direction": "POSITIVE"},
                    {"factor_name": "High-Abuse TLD", "category": "URL Analysis Agent", "weight": 0.25, "score_contribution": 24.0, "description": "Registered on high-abuse top-level domain '.xyz'.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Combosquatting Brand Mimicry", "category": "Brand Profile Agent", "weight": 0.20, "score_contribution": 20.0, "description": "Combines official brand 'apexbank' with security lures 'auth-verify'.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Phishing Infrastructure Heuristics", "category": "Scam Detection Agent", "weight": 0.20, "score_contribution": 25.0, "description": "Lacks valid EV SSL certificate; hosted on known bulletproof VPS subnet.", "risk_direction": "POSITIVE"}
                ],
                "evidence": [
                    ("IOC_DOMAIN", "Malicious Phishing FQDN", "apexbank-auth-verify.xyz", "CRITICAL"),
                    ("IOC_IP", "Host Server IP", "194.26.29.112 (Autonomous System AS48282)", "HIGH"),
                    ("HARVESTING_FORM", "Form Endpoint", "POST /api/collect-creds (Captures unencrypted plaintext credentials)", "CRITICAL")
                ]
            },
            # Case 2: High Risk Fake Social Profile impersonating Apex Support
            {
                "brand": b1,
                "case_number": "CS-2026-0082",
                "target_type": "SOCIAL_PROFILE",
                "target_name": "Apex Bank Helpdesk Support (@apexbank_helpdesk)",
                "target_identifier": "@apexbank_helpdesk",
                "target_url": "https://twitter.com/apexbank_helpdesk",
                "risk_score": 88,
                "risk_level": "HIGH",
                "status": "CONFIRMED_IMPERSONATION",
                "threat_category": "Brand Impersonation & Executive Pretexting",
                "summary": "Fraudulent Twitter account claiming to be the official customer care escalation channel for Apex Bank. Intercepting customer complaints and redirecting to phishing WhatsApp link.",
                "reviewer_name": "Marcus Vance (Threat Analyst)",
                "review_notes": "Account was active in replying to genuine customers under the official Apex Twitter handle. Reported to X Trust & Safety team with trademark registration proofs.",
                "action_taken": "X Platform Report Submitted",
                "created_at": now - timedelta(hours=12),
                "factors": [
                    {"factor_name": "Support Pretexting Suffix", "category": "Social Media Monitoring Agent", "weight": 0.25, "score_contribution": 24.0, "description": "Handle includes high-risk authority suffix '_helpdesk'.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Unverified Authority Claim", "category": "Brand Impersonation Agent", "weight": 0.25, "score_contribution": 25.0, "description": "Bio states 'Official 24/7 Escalations desk' but lacks verified checkmark.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Off-Platform Diversion", "category": "Scam Detection Agent", "weight": 0.20, "score_contribution": 21.0, "description": "Bio links to WhatsApp wa.me redirect for customer support resolution.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Anomalous Follower Ratio", "category": "Social Media Monitoring Agent", "weight": 0.15, "score_contribution": 18.0, "description": "Account has only 47 followers and was created within the last 14 days.", "risk_direction": "POSITIVE"}
                ],
                "evidence": [
                    ("SOCIAL_IOC", "Spoofed Twitter Handle", "@apexbank_helpdesk", "HIGH"),
                    ("EVASION_LINK", "Off-Platform Redirect Link", "https://wa.me/message/728192348", "HIGH"),
                    ("AVATAR_IOC", "Unauthorized Logo Scraping", "Exact pixel replica of Apex Global Bank vector logo", "CRITICAL")
                ]
            },
            # Case 3: High Risk Rogue Mobile App targeting Apex Bank
            {
                "brand": b1,
                "case_number": "CS-2026-0083",
                "target_type": "MOBILE_APP",
                "target_name": "Apex Mobile Banking Express",
                "target_identifier": "com.apex.banking.quick.pay",
                "target_url": "https://apkpure.com/apex-mobile-banking-express/com.apex.banking.quick.pay",
                "risk_score": 91,
                "risk_level": "HIGH",
                "status": "CONFIRMED_IMPERSONATION",
                "threat_category": "Rogue Mobile App / Trojanized Banking APK",
                "summary": "Trojanized Android application mimicking Apex Mobile Banking. Hosted on third-party APK aggregator. Requests SMS permissions capable of intercepting one-time passwords.",
                "reviewer_name": "Alice Chen (SecOps Lead)",
                "review_notes": "Reverse-engineering decompilation revealed hardcoded C2 IP in Ukraine. Submitting DMCA to APKPure.",
                "action_taken": "DMCA Notice Issued to Hosting Repo",
                "created_at": now - timedelta(days=1),
                "factors": [
                    {"factor_name": "Dangerous SMS Permissions", "category": "Mobile App Monitoring Agent", "weight": 0.30, "score_contribution": 29.0, "description": "Requests READ_SMS and RECEIVE_SMS without legitimate banking store entitlement.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Package Name Typosquatting", "category": "App Similarity Agent", "weight": 0.25, "score_contribution": 24.0, "description": "Mimics official 'com.apexbank.mobile' with 'com.apex.banking.quick.pay'.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Publisher Entity Discrepancy", "category": "App Similarity Agent", "weight": 0.20, "score_contribution": 20.0, "description": "Published by 'Apex Mobile Dev Group' instead of 'Apex Financial Group Inc.'.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Missing Privacy Disclosure", "category": "Mobile App Monitoring Agent", "weight": 0.15, "score_contribution": 18.0, "description": "Privacy policy link is dead and resolves to 404.", "risk_direction": "POSITIVE"}
                ],
                "evidence": [
                    ("APK_IOC", "Trojan Package Name", "com.apex.banking.quick.pay", "CRITICAL"),
                    ("PERMISSION_IOC", "Malicious Permission", "android.permission.RECEIVE_SMS (OTP interception)", "CRITICAL"),
                    ("C2_ENDPOINT", "Extracted C2 Server", "http://91.240.118.42:8080/sync", "HIGH")
                ]
            },
            # Case 4: High Risk Fake Corporate Page on LinkedIn
            {
                "brand": b1,
                "case_number": "CS-2026-0084",
                "target_type": "FAKE_PAGE",
                "target_name": "Apex Bank International Recruitment",
                "target_identifier": "https://linkedin.com/company/apex-bank-hiring-portal",
                "target_url": "https://linkedin.com/company/apex-bank-hiring-portal",
                "risk_score": 82,
                "risk_level": "HIGH",
                "status": "IN_REVIEW",
                "threat_category": "Fraudulent Recruitment & Fake Corporate Directory",
                "summary": "Fake LinkedIn company page posing as Apex Bank HR recruitment team. Soliciting remote workers with fraudulent job offers and demanding payment for background screening fees.",
                "reviewer_name": "Marcus Vance (Threat Analyst)",
                "review_notes": "Cross-referenced with internal HR talent team. Recruiter name 'David Sterling' does not exist in Workday directory.",
                "action_taken": "LinkedIn Impersonation Ticket Filed",
                "created_at": now - timedelta(days=2),
                "factors": [
                    {"factor_name": "Unverified Public Webmail", "category": "Fake Company Page Agent", "weight": 0.30, "score_contribution": 28.0, "description": "Recruitment inquiries directed to 'apexbank.recruiting@gmail.com'.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Recruitment Scam Red Flags", "category": "Scam Detection Agent", "weight": 0.25, "score_contribution": 25.0, "description": "Postings promise immediate hire and require \$150 background check fee.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Corporate Directory Spoofing", "category": "Brand Impersonation Agent", "weight": 0.25, "score_contribution": 25.0, "description": "Unauthorized use of Apex corporate logo and headquarters address.", "risk_direction": "POSITIVE"}
                ],
                "evidence": [
                    ("EMAIL_IOC", "Fraudulent Recruiter Email", "apexbank.recruiting@gmail.com", "HIGH"),
                    ("JOB_POSTING", "Scam Listing Title", "Remote Customer Operations Specialist (\$65/hr - Immediate Start)", "MEDIUM")
                ]
            },
            # Case 5: Medium Risk Typosquat URL for CloudPulse
            {
                "brand": b2,
                "case_number": "CS-2026-0085",
                "target_type": "PHISHING_URL",
                "target_name": "CloudPulse Technical Support Portal",
                "target_identifier": "https://cloudpulse-support.net",
                "target_url": "https://cloudpulse-support.net",
                "risk_score": 64,
                "risk_level": "MEDIUM",
                "status": "UNDER_INVESTIGATION",
                "threat_category": "Suspicious Domain Squatting / Unofficial Landing Page",
                "summary": "Combosquatting domain 'cloudpulse-support.net' parked with generic support landing page. Potential infrastructure staging for future phishing campaign.",
                "reviewer_name": "David Ross (Tier 1 SOC)",
                "review_notes": "No active credential forms present today, but MX records point to free protonmail relay. Monitoring DNS changes daily.",
                "action_taken": "Added to Active Threat Watchlist",
                "created_at": now - timedelta(days=3),
                "factors": [
                    {"factor_name": "Combosquatting Domain", "category": "URL Analysis Agent", "weight": 0.35, "score_contribution": 25.0, "description": "Registered 'cloudpulse-support.net' via Namecheap with WHOIS privacy protection.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Secondary TLD Mismatch", "category": "Brand Profile Agent", "weight": 0.30, "score_contribution": 20.0, "description": "Official brand operates on '.io', not '.net'.", "risk_direction": "POSITIVE"},
                    {"factor_name": "No Active Malware Detected", "category": "Scam Detection Agent", "weight": 0.20, "score_contribution": -10.0, "description": "Currently serving parked landing page without malicious payloads.", "risk_direction": "MITIGATING"}
                ],
                "evidence": [
                    ("WHOIS_IOC", "Suspicious Registrar", "Namecheap Inc. (Registered 12 days ago with PrivacyGuard)", "MEDIUM"),
                    ("DNS_MX", "Suspicious Mail Server", "mail.cloudpulse-support.net (MX priority 10)", "MEDIUM")
                ]
            },
            # Case 6: Medium Risk Unofficial Social Community for CloudPulse
            {
                "brand": b2,
                "case_number": "CS-2026-0086",
                "target_type": "SOCIAL_PROFILE",
                "target_name": "CloudPulse Enthusiasts & Tips (@cloudpulse_community)",
                "target_identifier": "@cloudpulse_community",
                "target_url": "https://twitter.com/cloudpulse_community",
                "risk_score": 48,
                "risk_level": "MEDIUM",
                "status": "NEW",
                "threat_category": "Unofficial Fan Account / Unregulated Community",
                "summary": "Twitter account sharing tips and configurations about CloudPulse platform. Bio clarifies 'Unofficial fan group', but profile icon uses official trademark logo.",
                "reviewer_name": None,
                "review_notes": None,
                "action_taken": None,
                "created_at": now - timedelta(days=4),
                "factors": [
                    {"factor_name": "Trademark Logo in Avatar", "category": "Brand Impersonation Agent", "weight": 0.30, "score_contribution": 22.0, "description": "Uses unmodified official CloudPulse SVG logo as avatar.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Disclaimed Fan Status in Bio", "category": "Social Media Monitoring Agent", "weight": 0.25, "score_contribution": -15.0, "description": "Bio explicitly contains disclaimer: 'Unofficial community account. Not affiliated with CloudPulse Inc.'", "risk_direction": "MITIGATING"},
                    {"factor_name": "Benign Educational Content", "category": "Scam Detection Agent", "weight": 0.20, "score_contribution": -10.0, "description": "Tweets contain links to official documentation and tutorials.", "risk_direction": "MITIGATING"}
                ],
                "evidence": [
                    ("SOCIAL_IOC", "Unofficial Handle", "@cloudpulse_community", "LOW"),
                    ("AVATAR_IOC", "Trademarked Icon", "CloudPulse corporate logo detected in profile banner", "MEDIUM")
                ]
            },
            # Case 7: Low Risk Verified Brand Property (Apex Bank Online)
            {
                "brand": b1,
                "case_number": "CS-2026-0087",
                "target_type": "PHISHING_URL",
                "target_name": "Apex Official Online Banking Gateway",
                "target_identifier": "https://online.apexbank.com/signin",
                "target_url": "https://online.apexbank.com/signin",
                "risk_score": 5,
                "risk_level": "LOW",
                "status": "RESOLVED",
                "threat_category": "Authenticated Official / Benign Domain",
                "summary": "Routine verification of corporate subdomain 'online.apexbank.com'. Confirmed strictly legitimate official asset.",
                "reviewer_name": "Alice Chen (SecOps Lead)",
                "review_notes": "Verified against Brand Asset Registry. EV SSL certificate signed by DigiCert.",
                "action_taken": "Marked Benign / Verified Official",
                "created_at": now - timedelta(days=5),
                "factors": [
                    {"factor_name": "Official Registered Subdomain", "category": "Brand Profile Agent", "weight": 1.0, "score_contribution": -95.0, "description": "Strict match with verified corporate domain registry entry.", "risk_direction": "MITIGATING"}
                ],
                "evidence": [
                    ("SSL_IOC", "Valid EV SSL Certificate", "DigiCert Global Root CA (Valid through 2028)", "INFO")
                ]
            },
            # Case 8: High Risk SwiftPay Cryptocurrency Giveaway Scam
            {
                "brand": b4,
                "case_number": "CS-2026-0088",
                "target_type": "SOCIAL_PROFILE",
                "target_name": "SwiftPay Official Rewards (@swiftpay_airdrop)",
                "target_identifier": "@swiftpay_airdrop",
                "target_url": "https://twitter.com/swiftpay_airdrop",
                "risk_score": 96,
                "risk_level": "HIGH",
                "status": "NEW",
                "threat_category": "Fraudulent Giveaway / Scam Campaign",
                "summary": "Malicious X account running fraudulent 50,000 USDT giveaway claiming to celebrate SwiftPay 5-year anniversary. Directs victims to a phishing wallet drainer.",
                "reviewer_name": None,
                "review_notes": None,
                "action_taken": None,
                "created_at": now - timedelta(hours=1),
                "factors": [
                    {"factor_name": "Crypto Wallet Drainer Lure", "category": "Scam Detection Agent", "weight": 0.35, "score_contribution": 35.0, "description": "Claims 'Connect your web3 wallet to receive free 250 SwiftTokens ($500 value)'.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Artificial Urgency Trigger", "category": "Scam Detection Agent", "weight": 0.25, "score_contribution": 25.0, "description": "Promotes countdown timer: 'Only first 1,000 users eligible. Ends in 2 hours!'.", "risk_direction": "POSITIVE"},
                    {"factor_name": "High Brand Impersonation Intent", "category": "Brand Impersonation Agent", "weight": 0.25, "score_contribution": 24.0, "description": "Uses official SwiftPay color palette, marketing renders, and legal footer.", "risk_direction": "POSITIVE"}
                ],
                "evidence": [
                    ("SOCIAL_IOC", "Scam Account Handle", "@swiftpay_airdrop", "CRITICAL"),
                    ("DRAINER_URL", "Malicious Dapp Contract", "https://swiftpay-rewards-claim.top (Known Inferno Drainer payload)", "CRITICAL")
                ]
            },
            # Case 9: High Risk SwiftPay Phishing Website
            {
                "brand": b4,
                "case_number": "CS-2026-0089",
                "target_type": "PHISHING_URL",
                "target_name": "SwiftPay Mobile Web Access",
                "target_identifier": "https://swiftpay-login-portal.top/auth",
                "target_url": "https://swiftpay-login-portal.top/auth",
                "risk_score": 93,
                "risk_level": "HIGH",
                "status": "CONFIRMED_IMPERSONATION",
                "threat_category": "Phishing Portal & Credential Harvesting Website",
                "summary": "Active phishing landing page capturing SwiftPay phone numbers and PINs. Employs obfuscated JavaScript to prevent sandbox inspection.",
                "reviewer_name": "Alice Chen (SecOps Lead)",
                "review_notes": "Live phishing session confirmed. Submitting urgent abuse report to hoster AS197695.",
                "action_taken": "Takedown Demand Sent to Host",
                "created_at": now - timedelta(hours=6),
                "factors": [
                    {"factor_name": "Credential Interception", "category": "URL Analysis Agent", "weight": 0.30, "score_contribution": 30.0, "description": "Form inputs capture 'phone_number' and 6-digit 'app_pin'.", "risk_direction": "POSITIVE"},
                    {"factor_name": "High-Risk .TOP TLD", "category": "URL Analysis Agent", "weight": 0.25, "score_contribution": 24.0, "description": "Host domain registered under high-fraud TLD '.top'.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Brand Identity Theft", "category": "Brand Impersonation Agent", "weight": 0.25, "score_contribution": 24.0, "description": "CSS and layout copied directly from official swiftpay.co.", "risk_direction": "POSITIVE"}
                ],
                "evidence": [
                    ("IOC_DOMAIN", "Phishing Host", "swiftpay-login-portal.top", "CRITICAL"),
                    ("FORM_IOC", "PIN Interception Form", "/api/v1/auth/pin-submit", "CRITICAL")
                ]
            },
            # Case 10: Medium Risk CyberGuard Fake Partner Listing
            {
                "brand": b3,
                "case_number": "CS-2026-0090",
                "target_type": "FAKE_PAGE",
                "target_name": "CyberGuard Security Authorized Reseller Hub",
                "target_identifier": "https://facebook.com/cyberguard.partner.network",
                "target_url": "https://facebook.com/cyberguard.partner.network",
                "risk_score": 62,
                "risk_level": "MEDIUM",
                "status": "NEW",
                "threat_category": "Unauthorized Partner Impersonation",
                "summary": "Facebook company page claiming to be an authorized EMEA channel partner for CyberGuard Security. Offering discounted software licenses without distributor authorization.",
                "reviewer_name": None,
                "review_notes": None,
                "action_taken": None,
                "created_at": now - timedelta(days=2),
                "factors": [
                    {"factor_name": "Unauthorized Reseller Claim", "category": "Fake Company Page Agent", "weight": 0.35, "score_contribution": 25.0, "description": "Claims official channel partnership not listed in partner directory.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Trademark Logo In Banner", "category": "Brand Impersonation Agent", "weight": 0.30, "score_contribution": 22.0, "description": "Displays CyberGuard Security crest without trademark disclaimer.", "risk_direction": "POSITIVE"}
                ],
                "evidence": [
                    ("SOCIAL_IOC", "Facebook Impersonator Page", "facebook.com/cyberguard.partner.network", "MEDIUM")
                ]
            },
            # Case 11: Low Risk Official Twitter Account Apex
            {
                "brand": b1,
                "case_number": "CS-2026-0091",
                "target_type": "SOCIAL_PROFILE",
                "target_name": "Apex Global Bank Official (@apexbank)",
                "target_identifier": "@apexbank",
                "target_url": "https://twitter.com/apexbank",
                "risk_score": 5,
                "risk_level": "LOW",
                "status": "RESOLVED",
                "threat_category": "Low-Risk / Benign Social Media Entity",
                "summary": "Baseline assessment of verified institutional Twitter profile. Verified gold organization badge and matches official registry.",
                "reviewer_name": "David Ross (Tier 1 SOC)",
                "review_notes": "Official verified corporate property. Retained as golden baseline.",
                "action_taken": "Marked Benign / Verified Official",
                "created_at": now - timedelta(days=6),
                "factors": [
                    {"factor_name": "Official Handle Match", "category": "Brand Profile Agent", "weight": 1.0, "score_contribution": -95.0, "description": "Strict match with verified brand asset handle '@apexbank'.", "risk_direction": "MITIGATING"}
                ],
                "evidence": [
                    ("VERIFICATION_BADGE", "Gold Organization Checkmark", "Verified institutional checkmark on X", "INFO")
                ]
            },
            # Case 12: High Risk Fake Support Channel on Telegram for CloudPulse
            {
                "brand": b2,
                "case_number": "CS-2026-0092",
                "target_type": "SOCIAL_PROFILE",
                "target_name": "CloudPulse Technical Helpdesk Bot",
                "target_identifier": "@cloudpulse_support_bot",
                "target_url": "https://t.me/cloudpulse_support_bot",
                "risk_score": 87,
                "risk_level": "HIGH",
                "status": "NEW",
                "threat_category": "Credential Harvesting & Social Impersonation",
                "summary": "Telegram bot posing as official CloudPulse support technician. Asks customers for API secret keys and cluster kubeconfig files to 'debug latency issues'.",
                "reviewer_name": None,
                "review_notes": None,
                "action_taken": None,
                "created_at": now - timedelta(hours=4),
                "factors": [
                    {"factor_name": "API Key Harvesting Intent", "category": "Scam Detection Agent", "weight": 0.35, "score_contribution": 34.0, "description": "Bot solicits 'CLOUDPULSE_API_SECRET' and Kubernetes config credentials.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Evasive Chat Channel", "category": "Social Media Monitoring Agent", "weight": 0.25, "score_contribution": 25.0, "description": "Operated through unmoderated Telegram bot platform.", "risk_direction": "POSITIVE"},
                    {"factor_name": "Official Branding Mimicry", "category": "Brand Impersonation Agent", "weight": 0.25, "score_contribution": 22.0, "description": "Cloned logo and greeting message from CloudPulse support portal.", "risk_direction": "POSITIVE"}
                ],
                "evidence": [
                    ("TELEGRAM_IOC", "Malicious Bot Handle", "@cloudpulse_support_bot", "CRITICAL"),
                    ("SOLICITED_CRED", "Sensitive Target Secret", "Kubernetes cluster admin kubeconfig / bearer tokens", "CRITICAL")
                ]
            }
        ]

        # Insert cases and their details
        for spec in cases_specs:
            brand_obj = spec["brand"]
            c = InvestigationCase(
                case_number=spec["case_number"],
                brand_id=brand_obj.id,
                target_type=spec["target_type"],
                target_name=spec["target_name"],
                target_identifier=spec["target_identifier"],
                target_url=spec["target_url"],
                risk_score=spec["risk_score"],
                risk_level=spec["risk_level"],
                status=spec["status"],
                threat_category=spec["threat_category"],
                summary=spec["summary"],
                reviewer_name=spec["reviewer_name"],
                review_notes=spec["review_notes"],
                reviewed_at=spec["created_at"] + timedelta(hours=1) if spec["reviewer_name"] else None,
                action_taken=spec["action_taken"],
                created_at=spec["created_at"],
                updated_at=spec["created_at"],
                explainability=json.dumps({
                    "final_score": spec["risk_score"],
                    "risk_level": spec["risk_level"],
                    "confidence": 0.92,
                    "summary_rationale": spec["summary"],
                    "factors": spec["factors"],
                    "mitigations_present": [f["description"] for f in spec["factors"] if f["risk_direction"] == "MITIGATING"]
                }),
                agent_telemetry=json.dumps([
                    {"agent_name": "Brand Profile Agent", "risk_level": spec["risk_level"], "confidence": 0.9, "summary": "Ground truth verification complete."},
                    {"agent_name": "Risk Scoring Agent", "risk_level": spec["risk_level"], "confidence": 0.94, "summary": f"Derived explainable score {spec['risk_score']}."}
                ])
            )
            db.add(c)
            db.flush()

            # Add Evidence
            for ev_type, title, desc, sev in spec["evidence"]:
                h = hashlib.sha256(f"{ev_type}:{desc}".encode()).hexdigest()
                ev = EvidenceItem(
                    case_id=c.id,
                    evidence_type=ev_type,
                    title=title,
                    description=desc,
                    value=desc[:200],
                    severity=sev,
                    sha256_hash=h,
                    created_at=c.created_at
                )
                db.add(ev)

            # Add Alert for HIGH / MEDIUM
            if spec["risk_level"] in ["HIGH", "MEDIUM"]:
                al = Alert(
                    case_id=c.id,
                    brand_id=brand_obj.id,
                    title=f"[{spec['risk_level']}] {spec['threat_category']}: {spec['target_name']}",
                    message=f"Threat detected targeting {brand_obj.name}. Risk Score: {spec['risk_score']}/100. Action required.",
                    severity="CRITICAL" if spec["risk_score"] >= 90 else spec["risk_level"],
                    is_read=spec["status"] in ["RESOLVED", "CONFIRMED_IMPERSONATION"],
                    is_dismissed=False,
                    created_at=c.created_at
                )
                db.add(al)

            # Add Report for High/Medium cases
            rep_num = f"REP-{spec['case_number'].replace('CS-', '')}"
            rep = InvestigationReport(
                report_number=rep_num,
                case_id=c.id,
                title=f"Incident Investigation Report: {c.case_number} ({spec['target_name']})",
                executive_summary=f"BrandShield AI investigated digital asset '{spec['target_name']}' affecting {brand_obj.name}. Classified as {spec['risk_level']} Risk ({spec['risk_score']}/100).",
                methodology="Conducted via BrandShield AI Multi-Agent Threat Intelligence Platform with lexical distance modeling, DNS/TLD inspection, and heuristic analysis.",
                threat_indicators=json.dumps([
                    {"title": title, "detail": desc, "severity": sev, "sha256": hashlib.sha256(desc.encode()).hexdigest()[:16] + "..."}
                    for _, title, desc, sev in spec["evidence"]
                ]),
                remediation_playbook=json.dumps([
                    {"step": 1, "action": "Evidence Preservation", "detail": "Cryptographic hashes generated and logged to case file."},
                    {"step": 2, "action": "Platform Takedown", "detail": f"File formal abuse ticket citing {brand_obj.name} trademark rights."},
                    {"step": 3, "action": "DNS Blocklisting", "detail": "Add IOCs to protective DNS firewalls."}
                ]),
                generated_by="BrandShield AI Report Generation Agent",
                created_at=c.created_at
            )
            db.add(rep)

        db.commit()

        return {
            "status": "success",
            "brands_created": 4,
            "cases_created": len(cases_specs),
            "message": "Demo data successfully seeded with 4 brands, 12 realistic cases, evidence items, alerts, and reports."
        }
