
import re

from backend.schemas import TextLocation


NUMBER_PATTERN = re.compile(
    r"(?<!\w)[+-]?\d+(?:,\d{3})*(?:\.\d+)?"
    r"(?:\s?(?:%|°\s?[CF]|degrees?\s+(?:Celsius|Fahrenheit)))?",
    re.IGNORECASE,
)


def localize_numeric_conflict(
    claim: str,
    evidence: str,
) -> list[TextLocation]:
    """
    Identify numeric values in a claim that differ from relevant evidence.

    This is a heuristic, not a general semantic contradiction detector.
    It only reports a conflict when both texts contain numeric values and
    their normalized numeric-value sets differ.
    """
    claim_matches = list(NUMBER_PATTERN.finditer(claim))
    evidence_matches = list(NUMBER_PATTERN.finditer(evidence))

    if not claim_matches or not evidence_matches:
        return []

    def normalize(value: str) -> str:
        value = value.lower().replace(",", "")
        value = re.sub(r"\s+", "", value)
        value = value.replace("degrees", "°")
        return value

    claim_values = {normalize(match.group()) for match in claim_matches}
    evidence_values = {normalize(match.group()) for match in evidence_matches}

    # Avoid localization if the evidence contains the same numeric values.
    if claim_values.issubset(evidence_values):
        return []

    issues: list[TextLocation] = []

    for match in claim_matches:
        value = normalize(match.group())

        if value not in evidence_values:
            issues.append(
                TextLocation(
                    text=match.group(),
                    start=match.start(),
                    end=match.end(),
                    reason=(
                        "This numeric value does not appear among the "
                        "numeric values extracted from the selected evidence. "
                        "Review the source context before treating it as an error."
                    ),
                )
            )

    return issues