import re
from typing import List, Optional
from app.agents.base import BaseAgent, AgentResult, SCAM_TRIGGER_PHRASES


class ScamDetectionAgent(BaseAgent):
    def __init__(self):
        super().__init__("Scam Detection Agent")

    def analyze(self, text_samples: List[str], target_context: Optional[str] = None) -> AgentResult:
        indicators = []
        mitigating = []
        detected_categories = set()
        
        combined_text = " ".join(text_samples + ([target_context] if target_context else [])).lower()
        
        # 1. Urgent Social Engineering / Coercion
        urgency_patterns = [
            r'immediate action', r'urgent alert', r'suspended in 24',
            r'will be locked', r'confirm identity now', r'critical security warning',
            r'unauthorized login detected', r'act quickly'
        ]
        for p in urgency_patterns:
            if re.search(p, combined_text):
                indicators.append(f"Psychological coercion detected: Artificial urgency pattern '{p.replace(chr(92), '')}'.")
                detected_categories.add("URGENCY_MANIPULATION")
                break

        # 2. Financial / Giveaway / Crypto Lures
        lure_patterns = [
            r'giveaway', r'free bonus', r'airdrop', r'send \d+ to receive',
            r'double your', r'claim \$?\d+', r'investment reward', r'guaranteed returns'
        ]
        for p in lure_patterns:
            if re.search(p, combined_text):
                indicators.append(f"Financial lure detected: Promising deceptive rewards/giveaway '{p}'.")
                detected_categories.add("FINANCIAL_LURE")
                break

        # 3. Credential & Secret Harvesting
        harvesting_patterns = [
            r'enter otp', r'seed phrase', r'private key', r'password reset link',
            r'confirm your pin', r'submit card details', r'verify security questions'
        ]
        for p in harvesting_patterns:
            if re.search(p, combined_text):
                indicators.append(f"High-threat credential harvesting intent detected: Requesting sensitive authentication secrets ('{p}').")
                detected_categories.add("CREDENTIAL_HARVESTING")
                break

        # 4. Out-of-band evasion channels
        channel_patterns = [
            r't\.me/[a-zA-Z0-9_]+', r'wa\.me/[a-zA-Z0-9_]+', r'telegram @',
            r'whatsapp me', r'dm via telegram'
        ]
        for p in channel_patterns:
            if re.search(p, combined_text):
                indicators.append("Evasive communication tactic: Diverting victim to unmoderated messaging channel (Telegram/WhatsApp).")
                detected_categories.add("OFF_PLATFORM_DIVERSION")
                break

        # Risk scoring
        if "CREDENTIAL_HARVESTING" in detected_categories or len(indicators) >= 3:
            risk_level = "HIGH"
        elif len(indicators) >= 1:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            mitigating.append("No active scam keywords or coercive social engineering patterns observed in analyzed text.")

        summary = (
            f"Scam Detection Agent analyzed content corpus. "
            f"Found {len(indicators)} fraudulent indicators across categories: {', '.join(detected_categories) if detected_categories else 'None'}."
        )

        return AgentResult(
            agent_name=self.name,
            risk_level=risk_level,
            confidence=0.92,
            summary=summary,
            indicators_found=indicators,
            mitigating_factors=mitigating,
            raw_details={
                "categories": list(detected_categories),
                "indicators_count": len(indicators)
            }
        )
