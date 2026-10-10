
from dataclasses import dataclass


@dataclass(frozen=True)
class ConfidenceReport:
    raw_score: float | None
    confidence_status: str
    explanation: str


def build_confidence_report(
    raw_score: float | None,
    *,
    has_relevant_evidence: bool,
    conflicting_signals: bool = False,
) -> ConfidenceReport:
    """
    Report a model score without misrepresenting it as calibrated confidence.

    Calibration requires labeled validation data and a separately evaluated
    calibration method. This function does not perform calibration.
    """
    if raw_score is not None and not 0.0 <= raw_score <= 1.0:
        raise ValueError("raw_score must be between 0 and 1.")

    if raw_score is None:
        return ConfidenceReport(
            raw_score=None,
            confidence_status="NOT_AVAILABLE",
            explanation="No usable model score was available.",
        )

    if not has_relevant_evidence:
        return ConfidenceReport(
            raw_score=raw_score,
            confidence_status="UNCALIBRATED",
            explanation=(
                "The raw model score is available, but relevant supporting "
                "evidence was not established. Do not interpret this score "
                "as confidence that the claim is true."
            ),
        )

    if conflicting_signals:
        return ConfidenceReport(
            raw_score=raw_score,
            confidence_status="UNCALIBRATED",
            explanation=(
                "Retrieved evidence produced conflicting signals. The raw "
                "model score is not a calibrated probability of correctness."
            ),
        )

    return ConfidenceReport(
        raw_score=raw_score,
        confidence_status="UNCALIBRATED",
        explanation=(
            "This is the model's raw NLI score, not a calibrated probability "
            "that the verdict is correct."
        ),
    )