import logging
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from starlette.concurrency import run_in_threadpool

from backend.audit_report import (
    build_audit_assessment,
    build_verification_summary,
)
from backend.claim_extractor import extract_claims
from backend.confidence import build_confidence_report
from backend.error_localizer import localize_numeric_conflict
from backend.evidence_selection import (
    VerificationModelError,
    build_verified_claim,
)
from backend.pdf_parser import PDFParseError, extract_pdf_pages
from backend.reasoning_checker import check_reasoning_consistency
from backend.retriever import TfidfRetriever
from backend.schemas import (
    VerifiedClaim,
    VerifyResponse,
)
from backend.verifier import classify_evidence


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Second Opinion API",
    description=(
        "Audit claims in AI-generated answers against uploaded PDF sources."
    ),
    version="0.2.0",
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    body_schema = openapi_schema["components"]["schemas"][
        "Body_verify_answer_verify_post"
    ]

    body_schema["properties"]["files"] = {
        "type": "array",
        "title": "Files",
        "description": "Upload one or more source PDF files.",
        "items": {
            "type": "string",
            "format": "binary",
        },
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Development configuration. Restrict origins before production deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

TOP_K = 5
MIN_RETRIEVAL_SCORE = 0.05
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB per PDF


@app.get("/")
def root():
    return {
        "name": "Second Opinion API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


def _run_audit(answer: str, pages: list) -> VerifyResponse:
    """
    CPU-bound audit pipeline (retrieval, NLI, consistency checks).

    Runs in a worker thread so the event loop is not blocked by model
    inference. `classify_evidence` is looked up at call time.
    """
    claims = extract_claims(answer)

    if not claims:
        raise HTTPException(
            status_code=422,
            detail="No checkable sentences were found in the answer.",
        )

    retriever = TfidfRetriever()

    try:
        retriever.fit(pages)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not index the uploaded PDFs: {exc}",
        ) from exc

    verified_claims: list[VerifiedClaim] = []

    try:
        for claim in claims:
            passages = retriever.retrieve(claim, top_k=TOP_K)
            verified_claims.append(
                build_verified_claim(
                    claim,
                    passages,
                    classifier=classify_evidence,
                    confidence_builder=build_confidence_report,
                    localizer=localize_numeric_conflict,
                    min_retrieval_score=MIN_RETRIEVAL_SCORE,
                )
            )
    except VerificationModelError as exc:
        raise HTTPException(
            status_code=500,
            detail="The evidence verification model failed.",
        ) from exc

    # Look for possible direct contradictions between extracted claims.
    reasoning_issues = check_reasoning_consistency(
        [item.claim for item in verified_claims]
    )

    # Attach each detected issue to the claims involved so the frontend can
    # display both claim-level flags and a global audit list.
    for issue in reasoning_issues:
        for item in verified_claims:
            if item.claim in issue.related_claims:
                item.reasoning_issues.append(issue)

    summary = build_verification_summary(verified_claims)
    assessment = build_audit_assessment(
        verified_claims,
        reasoning_issues,
    )

    return VerifyResponse(
        claims=verified_claims,
        summary=summary,
        reasoning_issues=reasoning_issues,
        assessment=assessment,
    )


@app.post("/verify", response_model=VerifyResponse)
async def verify_answer(
    answer: str = Form(..., min_length=1),
    files: list[UploadFile] = File(
        ...,
        description="Upload one or more source PDF files.",
        media_type="application/pdf",
    ),
):
    """Verify extracted claims against uploaded PDF evidence."""

    if not answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer must not be empty.",
        )

    if not files:
        raise HTTPException(
            status_code=400,
            detail="Upload at least one source PDF.",
        )

    pages = []

    for uploaded_file in files:
        filename = Path(uploaded_file.filename or "source.pdf").name

        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail=f"'{filename}' is not a PDF file.",
            )

        # Read at most one byte past the limit so an oversized upload is
        # rejected without loading all of it into memory.
        content = await uploaded_file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail=f"'{filename}' is empty.",
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"'{filename}' exceeds the 20 MB file limit.",
            )

        temp_path = None

        try:
            with tempfile.NamedTemporaryFile(
                suffix=".pdf",
                delete=False,
            ) as temp_file:
                temp_file.write(content)
                temp_path = Path(temp_file.name)

            pages.extend(
                extract_pdf_pages(
                    temp_path,
                    source_name=filename,
                )
            )

        except PDFParseError as exc:
            raise HTTPException(
                status_code=422,
                detail=str(exc),
            ) from exc

        finally:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)

    if not pages:
        raise HTTPException(
            status_code=422,
            detail="No readable text was extracted from the PDFs.",
        )

    return await run_in_threadpool(_run_audit, answer, pages)