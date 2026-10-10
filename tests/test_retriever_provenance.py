from types import SimpleNamespace

from backend.retriever import TfidfRetriever
from tests.ocean_fixtures import PACIFIC, INDIAN


def test_source_page_text_survive_retrieval():
    pages = [SimpleNamespace(source="a.pdf", page=3, text=PACIFIC),
             SimpleNamespace(source="b.pdf", page=9, text=INDIAN)]
    r = TfidfRetriever()
    r.fit(pages)
    top = r.retrieve("Pacific Ocean largest", top_k=2)[0]
    assert (top.source, top.page, top.text) == ("a.pdf", 3, PACIFIC)