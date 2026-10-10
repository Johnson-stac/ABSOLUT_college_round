from backend.claim_extractor import extract_claims


def test_words_ending_in_ms_no_are_not_treated_as_abbreviations():
    claims = extract_claims("The firm sells systems. It also sells items. Volcano. Done.")
    assert claims[:2] == ["The firm sells systems.", "It also sells items."]
    assert "Volcano." in claims


def test_real_abbreviations_keep_original_case_and_do_not_split():
    claims = extract_claims("Dr. Smith wrote it. See Fig. 3 for details. He left.")
    assert claims == ["Dr. Smith wrote it.", "See Fig. 3 for details.", "He left."]


def test_no_followed_by_sentence_splits():
    assert extract_claims("He said no. Then he left.") == ["He said no.", "Then he left."]


def test_list_and_dedup():
    claims = extract_claims("Facts:\n- A is big.\n- A is big.\n1. B is small.")
    assert claims == ["A is big.", "B is small."]