"""Shared deterministic fixtures. No model, torch, or network required."""
from dataclasses import dataclass

PACIFIC = "The Pacific Ocean is the largest and deepest ocean on Earth."
ATLANTIC = "The Atlantic Ocean is the second-largest ocean on Earth."
INDIAN = "The Indian Ocean is the third-largest ocean on Earth."
ARCTIC = "The Arctic Ocean is the smallest ocean on Earth."

PDF_SENTENCES = [PACIFIC, ATLANTIC, INDIAN, ARCTIC]

CLAIMS = [
    "The Pacific Ocean is the largest ocean on Earth.",
    "The Pacific Ocean is smaller than the Atlantic Ocean.",
    "The Pacific Ocean is the deepest ocean on Earth.",
    "The Indian Ocean is the smallest ocean on Earth.",
]
EXPECTED = ["SUPPORTED", "CONTRADICTED", "SUPPORTED", "CONTRADICTED"]

THRESHOLD = 0.80


@dataclass(frozen=True)
class FakeNLI:
    """Duck-typed stand-in for backend.verifier.NLIResult."""
    label: str
    score: float
    verdict: str
    explanation: str


def make_nli(label: str, score: float) -> FakeNLI:
    if label == "entailment" and score >= THRESHOLD:
        verdict = "SUPPORTED"
    elif label == "contradiction" and score >= THRESHOLD:
        verdict = "CONTRADICTED"
    else:
        verdict = "INSUFFICIENT EVIDENCE"
    return FakeNLI(label, score, verdict, f"mock NLI: {label} {score}")


# Mocked NLI table. Pairs not listed default to the WORST CASE the bug report
# describes: a confident, spurious "contradiction". The on-subject entries for
# claims 2 and 4 (contradiction .93 / .90) are ASSUMED model outputs, not
# measured ones; the model-backed test checks the real values.
_ON_SUBJECT = {
    (CLAIMS[0], PACIFIC): ("entailment", 0.989),
    (CLAIMS[1], PACIFIC): ("contradiction", 0.93),
    (CLAIMS[2], PACIFIC): ("entailment", 0.979),
    (CLAIMS[3], INDIAN): ("contradiction", 0.90),
}


def mock_classifier(claim: str, evidence: str) -> FakeNLI:
    label, score = _ON_SUBJECT.get((claim, evidence), ("contradiction", 0.95))
    return make_nli(label, score)


@dataclass(frozen=True)
class Passage:
    text: str
    source: str = "oceans.pdf"
    page: int = 1
    retrieval_score: float = 0.5


def identity_confidence(score, *, has_relevant_evidence, conflicting_signals):
    from types import SimpleNamespace
    return SimpleNamespace(raw_score=score, confidence_status="UNCALIBRATED")


def no_localizer(claim, passage_text):
    return []