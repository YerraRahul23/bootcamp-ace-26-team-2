"""
Contract health analysis service.

Detects important clauses from contract text, computes a health score,
determines risk level, identifies missing clauses, and generates
recommendations.  Pure keyword-based — no LLM involved.

Scoring is modular: extend CLAUSE_PATTERNS and CLAUSE_PENALTIES
to add or adjust clauses and their weights.
"""

import logging
import re

logger = logging.getLogger(__name__)


class ContractAnalysisService:
    """Analyze a contract's clause coverage and compute a health score."""

    CLAUSE_PATTERNS: dict[str, list[str]] = {
        "Governing Law": [
            r"governing\s+law",
            r"governed\s+by",
            r"choice\s+of\s+law",
            r"applicable\s+law",
            r"jurisdiction",
        ],
        "Termination": [
            r"termination",
            r"terminate",
            r"terminated",
            r"terminating",
        ],
        "Confidentiality": [
            r"confidential",
            r"confidentiality",
            r"non-disclosure",
            r"proprietary\s+information",
        ],
        "Payment Terms": [
            r"payment",
            r"shall\s+pay",
            r"compensation",
            r"\bfee\b",
            r"invoice",
            r"payable",
        ],
        "Limitation of Liability": [
            r"limitation\s+of\s+liability",
            r"limit\s+our\s+liability",
            r"not\s+be\s+liable",
            r"shall\s+not\s+be\s+liable",
            r"neither\s+party.*liable",
        ],
        "Indemnification": [
            r"indemnif",
            r"hold\s+harmless",
            r"indemnification",
            r"indemnify",
        ],
        "Dispute Resolution": [
            r"dispute",
            r"arbitration",
            r"mediation",
            r"resolution",
            r"litigation",
        ],
        "Force Majeure": [
            r"force\s+majeure",
            r"act\s+of\s+god",
            r"beyond\s+reasonable\s+control",
            r"unforeseen",
        ],
        "Intellectual Property": [
            r"intellectual\s+property",
            r"intellectual\s+property\s+rights",
            r"\bcopyright\b",
            r"\bpatent\b",
            r"\btrademark\b",
        ],
        "Warranty": [
            r"\bwarrant",
            r"\bwarranty",
            r"\bwarranties",
            r"as\s+is",
            r"representations\s+and\s+warranties",
        ],
        "Notice": [
            r"\bnotice\b",
            r"\bnotify\b",
            r"\bnotification\b",
            r"shall\s+give\s+notice",
            r"written\s+notice",
        ],
    }

    CLAUSE_PENALTIES: dict[str, float] = {
        "Governing Law": 1.0,
        "Termination": 1.5,
        "Confidentiality": 1.0,
        "Payment Terms": 1.0,
        "Limitation of Liability": 1.5,
        "Indemnification": 1.0,
        "Dispute Resolution": 1.0,
        "Force Majeure": 0.5,
        "Intellectual Property": 0.5,
        "Warranty": 0.5,
        "Notice": 0.5,
    }

    RISK_THRESHOLDS: list[tuple[float, str]] = [
        (9.0, "Low"),
        (7.0, "Medium"),
        (5.0, "High"),
        (0.0, "Critical"),
    ]

    RECOMMENDATION_TEMPLATES: dict[str, str] = {
        "Governing Law": "Specify the governing jurisdiction to avoid legal ambiguity.",
        "Termination": "Add termination conditions to clarify how either party can end the agreement.",
        "Confidentiality": "Include a Confidentiality clause to protect sensitive business information.",
        "Payment Terms": "Clearly define payment schedules, due dates, and penalties for late payments.",
        "Limitation of Liability": "Add a Limitation of Liability clause to cap potential damages.",
        "Indemnification": "Include an Indemnification clause to allocate risk between parties.",
        "Dispute Resolution": "Add a Dispute Resolution clause outlining arbitration or mediation procedures.",
        "Force Majeure": "Add a Force Majeure clause to define responsibilities during unforeseen events.",
        "Intellectual Property": "Include an Intellectual Property clause to clarify ownership of IP.",
        "Warranty": "Consider adding Warranty provisions to define guarantees and disclaimers.",
        "Notice": "Add a Notice clause specifying how formal communications must be delivered.",
    }

    def analyze(self, chunks: list[str]) -> dict:
        """
        Analyze contract chunks and return a health assessment.

        Args:
            chunks: List of chunk text strings from the contract.

        Returns:
            dict with keys: health_score, risk_level, present_clauses,
                            missing_clauses, recommendations
        """
        if not chunks:
            return {
                "health_score": 0.0,
                "risk_level": "Critical",
                "present_clauses": [],
                "missing_clauses": list(self.CLAUSE_PATTERNS.keys()),
                "recommendations": list(self.RECOMMENDATION_TEMPLATES.values()),
            }

        present = self._detect_clauses(chunks)
        missing = self._find_missing(present)
        score = self._calculate_score(missing)
        risk = self._determine_risk_level(score)
        recommendations = self._generate_recommendations(missing)

        return {
            "health_score": round(score, 1),
            "risk_level": risk,
            "present_clauses": sorted(present),
            "missing_clauses": sorted(missing),
            "recommendations": recommendations,
        }

    def _detect_clauses(self, chunks: list[str]) -> set[str]:
        """Return the set of clause names detected in the chunk texts."""
        found: set[str] = set()
        for chunk in chunks:
            lower = chunk.lower()
            for clause_name, patterns in self.CLAUSE_PATTERNS.items():
                if clause_name in found:
                    continue
                for pattern in patterns:
                    if re.search(pattern, lower):
                        found.add(clause_name)
                        break
        return found

    def _find_missing(self, present: set[str]) -> set[str]:
        """Return clauses that are expected but not present."""
        return set(self.CLAUSE_PATTERNS.keys()) - present

    def _calculate_score(self, missing: set[str]) -> float:
        """Compute health score starting at 10.0, subtracting penalties."""
        score = 10.0
        for clause in missing:
            score -= self.CLAUSE_PENALTIES.get(clause, 0.0)
        return max(0.0, min(10.0, score))

    def _determine_risk_level(self, score: float) -> str:
        """Map a numeric score to a risk level label."""
        for threshold, level in self.RISK_THRESHOLDS:
            if score >= threshold:
                return level
        return "Critical"

    def _generate_recommendations(self, missing: set[str]) -> list[str]:
        """Generate recommendation text for each missing clause."""
        if not missing:
            return []
        return [
            self.RECOMMENDATION_TEMPLATES.get(clause, f"Consider adding a {clause} clause.")
            for clause in sorted(missing)
        ]
