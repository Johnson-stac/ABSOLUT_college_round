"""Deterministic unit tests: NLI is mocked, nothing is downloaded."""
import pytest

from backend.evidence_selection import (
    VerificationModelError,
    assess_relevance,
    build_verified_claim,
    claim_anchor_tokens,
)
from tests.ocean_fixtures import (
    ARCTIC, ATLANTIC, CLAIMS, EXPECTED, INDIAN, PACIFIC, PDF_SENTENCES,
    Passage, identity_confidence, make_nli, mock_classifier, no_localizer,
)

CLAIM = CLAIMS[0]


def run(claim, passages, table):
    """table: passage text -> (label, score)."""
    calls = []

    def classifier(c, e):
        calls.append(e)
        return make_nli(*table[e])

    result = build_verified_claim(
        claim, passages, classifier=classifier,
        confidence_builder=identity_confidence, localizer=no_localizer,
    )
    return result, calls


def test_supported_evidence():
    result, _ = run(CLAIM, [Passage(PACIFIC)], {PACIFIC: ("entailment", 0.99)})
    assert result.verdict == "SUPPORTED"
    assert result.nli_label == "entailment"
    assert result.confidence_status == "UNCALIBRATED"


def test_contradicted_evidence_on_subject():
    claim = "The Pacific Ocean is smaller than the Atlantic Ocean."
    result, _ = run(claim, [Passage(PACIFIC)], {PACIFIC: ("contradiction", 0.93)})
    assert result.verdict == "CONTRADICTED"
    assert result.evidence[0].text == PACIFIC


def test_unrelated_evidence_is_not_a_verdict():
    result, _ = run(CLAIM, [Passage(ARCTIC)], {ARCTIC: ("neutral", 0.9)})
    assert result.verdict == "INSUFFICIENT EVIDENCE"
    assert result.confidence_status == "NOT_AVAILABLE"
    assert result.nli_label is None


def test_genuine_conflict_between_relevant_passages_abstains():
    a = "The Pacific Ocean is the largest ocean on Earth by area."
    b = "The Pacific Ocean is not the largest ocean on Earth."
    passages = [Passage(a, page=1, retrieval_score=0.7),
                Passage(b, page=4, retrieval_score=0.6)]
    result, _ = run(CLAIM, passages,
                    {a: ("entailment", 0.95), b: ("contradiction", 0.92)})
    assert result.verdict == "INSUFFICIENT EVIDENCE"
    assert {e.text for e in result.evidence} == {a, b}
    assert {e.page for e in result.evidence} == {1, 4}
    assert any("conflicting" in r.lower() for r in result.uncertainty_reasons)


def test_high_scoring_irrelevant_contradictions_do_not_overturn_support():
    passages = [Passage(PACIFIC, retrieval_score=0.6),
                Passage(INDIAN, retrieval_score=0.5),
                Passage(ARCTIC, retrieval_score=0.4)]
    table = {PACIFIC: ("entailment", 0.989),
             INDIAN: ("contradiction", 0.96),
             ARCTIC: ("contradiction", 0.977)}
    result, _ = run(CLAIM, passages, table)
    assert result.verdict == "SUPPORTED"
    assert [e.text for e in result.evidence] == [PACIFIC]
    assert not result.uncertainty_reasons


def test_only_off_subject_contradiction_abstains_and_shows_passage():
    claim = "The Indian Ocean is the smallest ocean on Earth."
    result, _ = run(claim, [Passage(ARCTIC)], {ARCTIC: ("contradiction", 0.97)})
    assert result.verdict == "INSUFFICIENT EVIDENCE"
    assert result.evidence[0].text == ARCTIC  # surfaced for manual review
    assert result.confidence_status == "NOT_AVAILABLE"
    assert any("not treated as a verdict" in r for r in result.uncertainty_reasons)


def test_low_retrieval_score_never_reaches_nli():
    passages = [Passage(PACIFIC, retrieval_score=0.01)]
    result, calls = run(CLAIM, passages, {PACIFIC: ("entailment", 0.99)})
    assert calls == []
    assert result.verdict == "INSUFFICIENT EVIDENCE"
    assert result.evidence == []
    assert result.confidence_status == "NOT_AVAILABLE"


def test_no_passages_at_all():
    result, _ = run(CLAIM, [], {})
    assert result.verdict == "INSUFFICIENT EVIDENCE"
    assert result.evidence == []


def test_relevant_but_neutral_abstains_with_reason():
    result, _ = run(CLAIM, [Passage(PACIFIC)], {PACIFIC: ("neutral", 0.7)})
    assert result.verdict == "INSUFFICIENT EVIDENCE"
    assert result.evidence[0].text == PACIFIC
    assert result.uncertainty_reasons


def test_filename_and_page_preserved():
    passages = [Passage(PACIFIC, source="atlas_2024.pdf", page=17)]
    result, _ = run(CLAIM, passages, {PACIFIC: ("entailment", 0.99)})
    item = result.evidence[0]
    assert (item.source, item.page, item.text) == ("atlas_2024.pdf", 17, PACIFIC)


def test_classifier_failure_is_wrapped():
    def boom(c, e):
        raise RuntimeError("bad")
    with pytest.raises(VerificationModelError):
        build_verified_claim(CLAIM, [Passage(PACIFIC)], classifier=boom,
                             confidence_builder=identity_confidence,
                             localizer=no_localizer)


def test_localizer_called_only_for_contradictions():
    seen = []

    def loc(claim, text):
        seen.append(text)
        return []

    claim = "The Pacific Ocean is smaller than the Atlantic Ocean."
    build_verified_claim(claim, [Passage(PACIFIC)],
                         classifier=lambda c, e: make_nli("contradiction", 0.93),
                         confidence_builder=identity_confidence, localizer=loc)
    build_verified_claim(CLAIM, [Passage(PACIFIC)],
                         classifier=lambda c, e: make_nli("entailment", 0.99),
                         confidence_builder=identity_confidence, localizer=loc)
    assert seen == [PACIFIC]


# ---- relevance helper -----------------------------------------------------

def test_anchor_tokens():
    assert claim_anchor_tokens(CLAIM) == ("pacific",)
    assert claim_anchor_tokens("The Indian Ocean is the smallest ocean.") == ("indian",)
    assert claim_anchor_tokens("Revenue grew by 12% in 2023.") == ()


@pytest.mark.parametrize("passage,expected", [
    (PACIFIC, True), (ATLANTIC, False), (INDIAN, False), (ARCTIC, False)])
def test_relevance_for_pacific_claim(passage, expected):
    assert assess_relevance(CLAIM, passage).anchored is expected


def test_relevance_without_named_entity_uses_content_overlap():
    claim = "Revenue increased 12% in 2023."
    assert assess_relevance(claim, "Revenue rose 10% in 2023.").anchored
    assert not assess_relevance(claim, "The weather was mild in spring.").anchored


# ---- the four ocean claims, mocked NLI -------------------------------------

def test_four_ocean_claims_with_mocked_nli_even_under_worst_case_artifacts():
    passages = [Passage(t, page=1 + i // 2, retrieval_score=0.5)
                for i, t in enumerate(PDF_SENTENCES)]
    verdicts = [
        build_verified_claim(c, passages, classifier=mock_classifier,
                             confidence_builder=identity_confidence,
                             localizer=no_localizer).verdict
        for c in CLAIMS
    ]
    assert verdicts == EXPECTED