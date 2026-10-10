
from backend.schemas import (
    AuditAssessment,
    ReasoningIssue,
    VerifiedClaim,
    VerificationSummary,
)


def build_verification_summary(
    claims: list[VerifiedClaim],
) -> VerificationSummary:
    """Count claim verdicts and detected issues."""
    return VerificationSummary(
        total_claims=len(claims),
        supported=sum(c.verdict == "SUPPORTED" for c in claims),
        contradicted=sum(c.verdict == "CONTRADICTED" for c in claims),
        insufficient_evidence=sum(
            c.verdict == "INSUFFICIENT EVIDENCE" for c in claims
        ),
        claims_with_reasoning_issues=sum(
            bool(c.reasoning_issues) for c in claims
        ),
        claims_with_localized_issues=sum(
            bool(c.localized_issues) for c in claims
        ),
    )


def build_audit_assessment(
    claims: list[VerifiedClaim],
    reasoning_issues: list[ReasoningIssue],
) -> AuditAssessment:
    """
    Summarize the audit without claiming that an absence of flags
    proves the answer is correct.
    """
    if not claims:
        return AuditAssessment(
            overall_status="INCONCLUSIVE",
            overview="No checkable claims were available for assessment.",
            limitations=[
                "The system cannot assess an answer without extracted claims."
            ],
        )

    insufficient_count = sum(
        claim.verdict == "INSUFFICIENT EVIDENCE" for claim in claims
    )
    contradicted_count = sum(
        claim.verdict == "CONTRADICTED" for claim in claims
    )
    localized_count = sum(bool(claim.localized_issues) for claim in claims)

    limitations = [
        "Verification covers only the claims extracted by the heuristic claim extractor.",
        "The uploaded documents may not contain all relevant facts.",
        "Raw NLI scores are uncalibrated and are not probabilities of correctness.",
        "Reasoning consistency checks are heuristic and may miss complex contradictions.",
    ]

    if insufficient_count == len(claims):
        status = "INCONCLUSIVE"
        overview = (
            "No claims could be verified from the available evidence. "
            "This does not establish that the answer is false."
        )
    elif contradicted_count > 0 or reasoning_issues or localized_count > 0:
        status = "ISSUES_FOUND"
        overview = (
            "The audit found one or more potential factual or consistency "
            "issues. Review the cited evidence and flagged passages."
        )
    elif insufficient_count > 0:
        status = "INCONCLUSIVE"
        overview = (
            "Some claims remain unverified because the available evidence "
            "was insufficient. Review these claims before relying on the answer."
        )
    else:
        status = "NO_CLEAR_ISSUES_FOUND"
        overview = (
            "The available evidence supports the extracted claims, and no "
            "clear issues were flagged. This is not a guarantee that the "
            "entire answer is correct."
        )

    return AuditAssessment(
        overall_status=status,
        overview=overview,
        limitations=limitations,
    )