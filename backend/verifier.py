from dataclasses import dataclass
from functools import lru_cache

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


MODEL_NAME = "cross-encoder/nli-deberta-v3-small"
DEFAULT_THRESHOLD = 0.80
MAX_LENGTH = 512


@dataclass(frozen=True)
class NLIResult:
    label: str
    score: float
    verdict: str
    explanation: str


@lru_cache(maxsize=1)
def load_nli_model():
    """Load and cache the tokenizer and classification model."""
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
    model.eval()
    return tokenizer, model


def _normalise_label(label: str) -> str | None:
    """Map recognized model labels to standard NLI classes."""
    value = label.strip().lower().replace("-", "_").replace(" ", "_")

    if "entailment" in value or value in {"entail", "entails"}:
        return "entailment"
    if "contradiction" in value or value in {"contradict", "contradicts"}:
        return "contradiction"
    if value == "neutral" or value.endswith("_neutral"):
        return "neutral"

    return None


def classify_evidence(
    claim: str,
    evidence: str,
    threshold: float = DEFAULT_THRESHOLD,
) -> NLIResult:
    """
    Compare a source passage (premise) with a claim (hypothesis).

    The returned score is the raw softmax score for the top class,
    not a calibrated probability that the final verdict is correct.
    """
    if not claim.strip():
        raise ValueError("Claim must not be empty.")
    if not evidence.strip():
        raise ValueError("Evidence must not be empty.")
    if not 0.0 < threshold < 1.0:
        raise ValueError("threshold must be between 0 and 1.")

    tokenizer, model = load_nli_model()

    encoded = tokenizer(
        evidence,
        claim,
        return_tensors="pt",
        truncation=True,
        max_length=MAX_LENGTH,
    )

    with torch.inference_mode():
        outputs = model(**encoded)
        probabilities = torch.softmax(outputs.logits, dim=-1)[0]

    best_index = int(torch.argmax(probabilities).item())
    score = float(probabilities[best_index].item())

    id2label = model.config.id2label
    raw_label = id2label.get(
        best_index,
        id2label.get(str(best_index), ""),
    )
    label = _normalise_label(str(raw_label))

    if label is None:
        return NLIResult(
            label=str(raw_label),
            score=score,
            verdict="INSUFFICIENT EVIDENCE",
            explanation=(
                "The model returned an unrecognized NLI label; "
                "the system abstained rather than guessing."
            ),
        )

    if label == "entailment" and score >= threshold:
        return NLIResult(
            label=label,
            score=score,
            verdict="SUPPORTED",
            explanation=(
                "The evidence passage supports the claim according "
                "to the NLI model."
            ),
        )

    if label == "contradiction" and score >= threshold:
        return NLIResult(
            label=label,
            score=score,
            verdict="CONTRADICTED",
            explanation=(
                "The evidence passage contradicts the claim according "
                "to the NLI model."
            ),
        )

    return NLIResult(
        label=label,
        score=score,
        verdict="INSUFFICIENT EVIDENCE",
        explanation=(
            "The evidence did not meet the threshold for a supported "
            "or contradicted verdict."
        ),
    )
