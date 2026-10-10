
from typing import Literal

from pydantic import BaseModel, Field


Verdict = Literal[
    "SUPPORTED",
    "CONTRADICTED",
    "INSUFFICIENT EVIDENCE",
]

Severity = Literal["LOW", "MEDIUM", "HIGH"]
ConfidenceStatus = Literal[
    "CALIBRATED",
    "UNCALIBRATED",
    "NOT_AVAILABLE",
]


class EvidenceItem(BaseModel):
    text: str
    source: str
    page: int | None = Field(default=None, ge=1)
    retrieval_score: float | None = None


class TextLocation(BaseModel):
    """Character offsets refer to the original claim string."""
    text: str
    start: int = Field(ge=0)
    end: int = Field(ge=0)
    reason: str


class ReasoningIssue(BaseModel):
    issue: str
    explanation: str
    severity: Severity = "MEDIUM"
    related_claims: list[str] = Field(default_factory=list)


class VerifiedClaim(BaseModel):
    claim: str
    verdict: Verdict
    evidence: list[EvidenceItem] = Field(default_factory=list)

    nli_label: str | None = None
    nli_score: float | None = Field(default=None, ge=0.0, le=1.0)
    confidence_status: ConfidenceStatus = "UNCALIBRATED"

    explanation: str
    localized_issues: list[TextLocation] = Field(default_factory=list)
    uncertainty_reasons: list[str] = Field(default_factory=list)

    # Keep these separate from evidence-based factual verdicts.
    reasoning_issues: list[ReasoningIssue] = Field(default_factory=list)


class VerificationSummary(BaseModel):
    total_claims: int = Field(ge=0)
    supported: int = Field(ge=0)
    contradicted: int = Field(ge=0)
    insufficient_evidence: int = Field(ge=0)
    claims_with_reasoning_issues: int = Field(ge=0)
    claims_with_localized_issues: int = Field(ge=0)


class AuditAssessment(BaseModel):
    overall_status: Literal[
        "NO_CLEAR_ISSUES_FOUND",
        "ISSUES_FOUND",
        "INCONCLUSIVE",
    ]
    overview: str
    limitations: list[str] = Field(default_factory=list)


class VerifyResponse(BaseModel):
    claims: list[VerifiedClaim]
    summary: VerificationSummary
    reasoning_issues: list[ReasoningIssue] = Field(default_factory=list)
    assessment: AuditAssessment