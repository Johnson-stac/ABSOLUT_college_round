
import re

from backend.schemas import ReasoningIssue


NEGATION_WORDS = {
    "not", "never", "no", "cannot", "can't", "doesn't",
    "isn't", "aren't", "wasn't", "weren't", "without"
}


def _normalize(text: str) -> str:
    text = text.casefold()
    text = re.sub(r"[^\w\s'-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _tokens(text: str) -> set[str]:
    return set(_normalize(text).split())


def _has_negation(text: str) -> bool:
    tokens = _tokens(text)
    return bool(tokens & NEGATION_WORDS)


def check_reasoning_consistency(
    claims: list[str],
) -> list[ReasoningIssue]:
    """
    Flag possible direct contradictions between claims.

    This is a heuristic consistency check, not a full logical reasoner.
    It only flags pairs with strong lexical overlap and different negation
    status. More complex reasoning requires additional methods.
    """
    issues: list[ReasoningIssue] = []

    for i, first in enumerate(claims):
        first_tokens = _tokens(first)
        if len(first_tokens) < 3:
            continue

        for second in claims[i + 1:]:
            second_tokens = _tokens(second)
            if len(second_tokens) < 3:
                continue

            # Exclude negation terms when estimating shared content.
            first_content = first_tokens - NEGATION_WORDS
            second_content = second_tokens - NEGATION_WORDS

            if not first_content or not second_content:
                continue

            overlap = len(first_content & second_content) / max(
                len(first_content | second_content), 1
            )

            if overlap < 0.70:
                continue

            if _has_negation(first) == _has_negation(second):
                continue

            issues.append(
                ReasoningIssue(
                    issue="POSSIBLE_DIRECT_CONTRADICTION",
                    explanation=(
                        "These statements use very similar wording but differ "
                        "in negation. Review them together to determine whether "
                        "they genuinely conflict in context."
                    ),
                    severity="MEDIUM",
                    related_claims=[first, second],
                )
            )

    return issues