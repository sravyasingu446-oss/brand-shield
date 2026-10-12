import time
import re
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AgentResult(BaseModel):
    agent_name: str
    risk_level: str = "LOW"  # LOW, MEDIUM, HIGH
    confidence: float = 0.8  # 0.0 to 1.0
    summary: str = ""
    indicators_found: List[str] = Field(default_factory=list)
    mitigating_factors: List[str] = Field(default_factory=list)
    raw_details: Dict[str, Any] = Field(default_factory=dict)
    execution_time_ms: int = 0
    engine: str = "heuristic_rule_engine"  # heuristic_rule_engine or gemini_pro


class BaseAgent(ABC):
    def __init__(self, name: str):
        self.name = name

    def execute(self, *args, **kwargs) -> AgentResult:
        start_time = time.time()
        try:
            result = self.analyze(*args, **kwargs)
        except Exception as e:
            result = AgentResult(
                agent_name=self.name,
                risk_level="LOW",
                confidence=0.5,
                summary=f"Analysis encountered an issue: {str(e)}",
                indicators_found=[],
                mitigating_factors=[],
                raw_details={"error": str(e)},
                engine="fallback_error_handler"
            )
        elapsed_ms = int((time.time() - start_time) * 1000)
        result.execution_time_ms = elapsed_ms
        return result

    @abstractmethod
    def analyze(self, *args, **kwargs) -> AgentResult:
        pass


# --- Cyber Security Text Analysis Utilities ---

HOMOGLYPH_MAP = {
    '0': 'o',
    '1': 'l',
    '|': 'l',
    '!': 'i',
    '3': 'e',
    '4': 'a',
    '@': 'a',
    '5': 's',
    '$': 's',
    '7': 't',
    '+': 't',
    '8': 'b',
    'vv': 'w',
    'rn': 'm',
    'cl': 'd'
}

SUSPICIOUS_TLDS = {
    '.xyz', '.top', '.cfd', '.ru', '.tk', '.ml', '.ga', '.cf', '.gq',
    '.work', '.click', '.buzz', '.shop', '.sbs', '.cam', '.country', '.cc'
}

PHISHING_KEYWORDS = [
    'login', 'signin', 'verify', 'verification', 'secure', 'security',
    'auth', 'authenticate', 'wallet', 'update', 'account', 'recover',
    'suspend', 'suspended', 'alert', 'support', 'helpdesk', 'claim',
    'airdrop', 'bonus', 'giveaway', 'password', 'credential', 'unlock',
    'customer-care', 'official-support'
]

SCAM_TRIGGER_PHRASES = [
    'urgent action required',
    'account suspended within',
    'suspended in 24 hours',
    'claim your reward',
    'crypto giveaway',
    'double your bitcoin',
    'send eth to receive',
    'telegram support',
    'whatsapp support',
    'contact our executive directly',
    'wire transfer required',
    'gift card payment',
    'send seed phrase',
    'verify your private key',
    'recruitment fee',
    'equipment deposit required'
]


def normalize_text(text: str) -> str:
    """Normalize text by converting to lower case and replacing common homoglyphs/leetspeak."""
    if not text:
        return ""
    t = text.lower().strip()
    # Replace multichar homoglyphs first
    t = t.replace('vv', 'w').replace('rn', 'm').replace('cl', 'd')
    # Replace single character homoglyphs
    for char, mapped in HOMOGLYPH_MAP.items():
        if len(char) == 1:
            t = t.replace(char, mapped)
    # Strip non-alphanumeric except hyphens and dots
    return re.sub(r'[^a-z0-9\.\-]', '', t)


def levenshtein_distance(s1: str, s2: str) -> int:
    """Calculate the Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


def similarity_ratio(s1: str, s2: str) -> float:
    """Return a normalized similarity score between 0.0 and 1.0."""
    n1 = normalize_text(s1)
    n2 = normalize_text(s2)
    if not n1 and not n2:
        return 1.0
    if not n1 or not n2:
        return 0.0
    if n1 == n2:
        return 1.0
    max_len = max(len(n1), len(n2))
    dist = levenshtein_distance(n1, n2)
    return round(max(0.0, 1.0 - (dist / max_len)), 3)


def contains_brand_keyword(text: str, brand_name: str, aliases: List[str] = None) -> bool:
    """Check if brand name or aliases appear within text."""
    norm_text = normalize_text(text)
    norm_brand = normalize_text(brand_name)
    if norm_brand in norm_text:
        return True
    if aliases:
        for alias in aliases:
            if normalize_text(alias) in norm_text:
                return True
    return False
