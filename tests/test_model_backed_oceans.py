"""
Model-backed check. Downloads cross-encoder/nli-deberta-v3-small on first run.

Run with:  RUN_MODEL_TESTS=1 python -m pytest tests/test_model_backed_oceans.py -s

This test is intentionally strict: if the pretrained model mislabels the
on-subject passages, it FAILS and prints the full pair table. Do not weaken it
to make it pass.
"""
import os
from types import SimpleNamespace

import pytest

from tests.ocean_fixtures import CLAIMS, EXPECTED, PDF_SENTENCES

pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_MODEL_TESTS") != "1",
    reason="set RUN_MODEL_TESTS=1 to run tests that load the real NLI model",
)


def test_four_ocean_claims_with_real_model(capsys):
    from backend.confidence import build_confidence_report
    from backend.error_localizer import localize_numeric_conflict
    from backend.evidence_selection import build_verified_claim
    from backend.retriever import TfidfRetriever
    from backend.verifier import classify_evidence

    pages = [SimpleNamespace(source="oceans.pdf", page=1, text=" ".join(PDF_SENTENCES))]
    retriever = TfidfRetriever()
    retriever.fit(pages)

    got = []
    with capsys.disabled():
        for claim in CLAIMS:
            passages = retriever.retrieve(claim, top_k=5)
            for p in passages:
                r = classify_evidence(claim, p.text)
                print(f"{claim!r} | {p.text!r} | retr={p.retrieval_score:.3f} "
                      f"| {r.label} {r.score:.3f}")
            got.append(build_verified_claim(
                claim, passages, classifier=classify_evidence,
                confidence_builder=build_confidence_report,
                localizer=localize_numeric_conflict).verdict)
        print("EXPECTED:", EXPECTED, "\nGOT:     ", got)

    assert got == EXPECTED