"""API contract tests. PDF parsing and NLI are mocked; the model is not loaded."""
from types import SimpleNamespace

import pytest

pytest.importorskip("fastapi")
pytest.importorskip("httpx")
from fastapi.testclient import TestClient  # noqa: E402

from backend import main  # noqa: E402
from tests.ocean_fixtures import (  # noqa: E402
    ARCTIC, ATLANTIC, CLAIMS, EXPECTED, INDIAN, PACIFIC, mock_classifier,
)

PDF = ("oceans.pdf", b"%PDF-1.4 fake", "application/pdf")


@pytest.fixture()
def client(monkeypatch):
    pages = [
        SimpleNamespace(source="oceans.pdf", page=1, text=f"{PACIFIC} {ATLANTIC}"),
        SimpleNamespace(source="oceans.pdf", page=2, text=f"{INDIAN} {ARCTIC}"),
    ]
    monkeypatch.setattr(main, "extract_pdf_pages", lambda path, source_name: pages)
    monkeypatch.setattr(main, "classify_evidence", mock_classifier)
    return TestClient(main.app)


def post(client, answer="\n".join(CLAIMS), files=None):
    return client.post("/verify", data={"answer": answer},
                       files=[("files", f) for f in (files or [PDF])])


def test_response_shape_and_ocean_verdicts(client):
    resp = post(client)
    assert resp.status_code == 200
    body = resp.json()
    assert set(body) == {"claims", "summary", "reasoning_issues", "assessment"}
    assert [c["verdict"] for c in body["claims"]] == EXPECTED
    for claim in body["claims"]:
        for key in ("claim", "verdict", "evidence", "nli_label", "nli_score",
                    "confidence_status", "explanation", "localized_issues",
                    "uncertainty_reasons", "reasoning_issues"):
            assert key in claim
        assert claim["confidence_status"] == "UNCALIBRATED"
    s = body["summary"]
    assert s["total_claims"] == 4 and s["supported"] == 2 and s["contradicted"] == 2
    assert {"overall_status", "overview", "limitations"} <= set(body["assessment"])


def test_evidence_provenance_in_response(client):
    body = post(client).json()
    first = body["claims"][0]["evidence"][0]
    assert first["source"] == "oceans.pdf" and first["page"] == 1
    assert first["text"] == PACIFIC
    assert body["claims"][3]["evidence"][0]["page"] == 2


def test_rejects_non_pdf_empty_and_oversize(client, monkeypatch):
    assert post(client, files=[("notes.txt", b"x", "text/plain")]).status_code == 400
    assert post(client, files=[("empty.pdf", b"", "application/pdf")]).status_code == 400
    monkeypatch.setattr(main, "MAX_FILE_SIZE", 4)
    assert post(client).status_code == 413


def test_empty_answer_rejected(client):
    assert post(client, answer="   ").status_code in (400, 422)


def test_model_failure_maps_to_500(client, monkeypatch):
    def boom(c, e):
        raise RuntimeError("nope")
    monkeypatch.setattr(main, "classify_evidence", boom)
    assert post(client).status_code == 500