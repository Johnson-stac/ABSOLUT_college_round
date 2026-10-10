import logging
import re
from dataclasses import dataclass

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.pdf_parser import PDFPage


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class EvidencePassage:
    """A searchable text passage with its original provenance."""

    source: str
    page: int
    text: str
    retrieval_score: float


def split_into_passages(
    pages: list[PDFPage],
    max_words: int = 180,
    overlap_words: int = 35,
) -> list[EvidencePassage]:
    """
    Split PDF pages into sentence-level evidence passages.

    Each normal sentence becomes its own passage. Sentences that exceed
    max_words are split into overlapping word windows.

    Original source filenames and page numbers are preserved.
    Retrieval scores are assigned later.
    """
    if max_words < 1:
        raise ValueError("max_words must be at least 1.")

    if overlap_words < 0 or overlap_words >= max_words:
        raise ValueError(
            "overlap_words must be non-negative and smaller than max_words."
        )

    passages: list[EvidencePassage] = []
    step = max_words - overlap_words

    for page in pages:
        page_text = page.text.strip()

        if not page_text:
            continue

        # Split at sentence-ending punctuation followed by whitespace.
        # This avoids splitting decimal numbers such as 3.14.
        sentences = re.split(
            r"(?<=[.!?])\s+(?=[^\s])",
            page_text,
        )

        for sentence in sentences:
            sentence = re.sub(r"\s+", " ", sentence).strip()

            if not sentence:
                continue

            words = sentence.split()

            # Keep ordinary sentences intact.
            if len(words) <= max_words:
                passages.append(
                    EvidencePassage(
                        source=page.source,
                        page=page.page,
                        text=sentence,
                        retrieval_score=0.0,
                    )
                )
                continue

            # Split unusually long sentences into overlapping windows.
            for start in range(0, len(words), step):
                chunk = " ".join(words[start : start + max_words]).strip()

                if chunk:
                    passages.append(
                        EvidencePassage(
                            source=page.source,
                            page=page.page,
                            text=chunk,
                            retrieval_score=0.0,
                        )
                    )

                if start + max_words >= len(words):
                    break

    logger.info(
        "Split %d PDF pages into %d evidence passages.",
        len(pages),
        len(passages),
    )

    return passages


class TfidfRetriever:
    """Simple local TF-IDF retriever for evidence passages."""

    def __init__(self) -> None:
        self._vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            sublinear_tf=True,
            strip_accents="unicode",
            token_pattern=r"(?u)\b\w+\b",
        )
        self._passages: list[EvidencePassage] = []
        self._matrix = None
        self._fitted = False

    @property
    def passage_count(self) -> int:
        return len(self._passages)

    def fit(self, pages: list[PDFPage]) -> None:
        """Index sentence-level passages from uploaded PDF pages."""
        if not pages:
            raise ValueError(
                "Cannot index documents without extracted pages."
            )

        passages = split_into_passages(pages)

        if not passages:
            raise ValueError(
                "No non-empty passages were available for indexing."
            )

        texts = [passage.text for passage in passages]

        try:
            matrix = self._vectorizer.fit_transform(texts)
        except ValueError as exc:
            raise ValueError(
                "Could not build the search index. "
                "The supplied documents may contain no searchable terms."
            ) from exc

        self._passages = passages
        self._matrix = matrix
        self._fitted = True

        logger.info(
            "Indexed %d evidence passages from the uploaded PDFs.",
            len(self._passages),
        )

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
    ) -> list[EvidencePassage]:
        """Return the highest-scoring passages for a query."""
        if not self._fitted or self._matrix is None:
            raise RuntimeError("Call fit() before retrieve().")

        if not query or not query.strip():
            raise ValueError("Query must not be empty.")

        if top_k < 1:
            raise ValueError("top_k must be at least 1.")

        query_vector = self._vectorizer.transform([query])
        scores = cosine_similarity(
            query_vector,
            self._matrix,
        ).ravel()

        # Stable ordering: higher score first, then original passage order.
        ranked_indices = sorted(
            range(len(scores)),
            key=lambda index: (-float(scores[index]), index),
        )[:top_k]

        return [
            EvidencePassage(
                source=self._passages[index].source,
                page=self._passages[index].page,
                text=self._passages[index].text,
                retrieval_score=float(scores[index]),
            )
            for index in ranked_indices
        ]
