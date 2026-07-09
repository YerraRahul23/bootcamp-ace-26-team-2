"""
Tests for RetrievalService and RetrievalResult model.

Uses a FakeEmbedder (deterministic, no API key) and a
directly-built FaissIndexService to test the full
retrieval pipeline without external dependencies.
"""

import uuid
import tempfile
from pathlib import Path

import pytest

from app.models.embedding import Embedding
from app.models.search_result import SearchResult
from app.models.retrieval_result import RetrievalResult
from app.services.retrieval_service import RetrievalService
from app.services.faiss_index_service import FaissIndexService


class FakeEmbedder:
    """A fake embedding model that returns deterministic vectors."""

    def __init__(self, dimension: int = 4) -> None:
        self.dimension = dimension
        self.call_count = 0

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        self.call_count += 1
        return [
            [float((len(text) + i) % 10) / 10.0 for _ in range(self.dimension)]
            for i, text in enumerate(texts)
        ]


def make_embedding(vector: list[float], **overrides) -> Embedding:
    """Create a synthetic Embedding with the given vector and optional field overrides."""
    fields = {
        "id": str(uuid.uuid4()),
        "chunk_id": str(uuid.uuid4()),
        "document_id": str(uuid.uuid4()),
        "vector": vector,
        "metadata": {"filename": "test.txt", "partition": "Part_I"},
    }
    fields.update(overrides)
    return Embedding(**fields)


def build_index(embeddings, chunk_texts=None):
    """Helper to build and return a FaissIndexService."""
    index_service = FaissIndexService()
    index_service.build_index(embeddings, chunk_texts=chunk_texts)
    return index_service


FAKE_EMBED = FakeEmbedder(dimension=4)


def make_embed_service():
    """Return an object that behaves like EmbeddingService for _embed_texts."""
    fake = FakeEmbedder(dimension=4)
    return type("FakeEmbedService", (), {"_embed_texts": fake.embed_documents})()


# ------------------------------------------------------------------
# embed_query
# ------------------------------------------------------------------


def test_embed_query_returns_vector():
    embed_svc = make_embed_service()
    service = RetrievalService(embed_service=embed_svc)
    vector = service.embed_query("test query")
    assert isinstance(vector, list)
    assert len(vector) > 0
    assert all(isinstance(v, float) for v in vector)


def test_embed_query_empty_returns_empty():
    embed_svc = make_embed_service()
    service = RetrievalService(embed_service=embed_svc)
    assert service.embed_query("") == []
    assert service.embed_query("   ") == []


# ------------------------------------------------------------------
# retrieve
# ------------------------------------------------------------------


def test_retrieve_basic():
    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0]),
        make_embedding([0.0, 1.0, 0.0, 0.0]),
    ]
    chunk_texts = ["Confidentiality clause.", "Indemnification clause."]
    index_service = build_index(embeddings, chunk_texts)
    embed_svc = make_embed_service()
    service = RetrievalService(embed_service=embed_svc, index_service=index_service)

    result = service.retrieve("confidentiality")
    assert isinstance(result, RetrievalResult)
    assert len(result.results) > 0
    assert result.query == "confidentiality"
    assert result.context


def test_retrieve_top_k():
    embeddings = [make_embedding([float(i) / 10.0] * 4) for i in range(10)]
    chunk_texts = [f"Chunk {i}." for i in range(10)]
    index_service = build_index(embeddings, chunk_texts)
    embed_svc = make_embed_service()
    service = RetrievalService(embed_service=embed_svc, index_service=index_service, top_k=3)

    result = service.retrieve("test")
    assert len(result.results) == 3


def test_retrieve_empty_query():
    index_service = build_index([make_embedding([1.0, 0.0, 0.0, 0.0])])
    embed_svc = make_embed_service()
    service = RetrievalService(embed_service=embed_svc, index_service=index_service)

    result = service.retrieve("")
    assert result.results == []
    assert result.context == ""

    result = service.retrieve("   ")
    assert result.results == []
    assert result.context == ""


def test_retrieve_no_index():
    embed_svc = make_embed_service()
    service = RetrievalService(embed_service=embed_svc)
    result = service.retrieve("test")
    assert result.results == []
    assert result.context == ""


def test_retrieve_ordering():
    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0]),
        make_embedding([0.0, 1.0, 0.0, 0.0]),
        make_embedding([0.0, 0.0, 1.0, 0.0]),
    ]
    chunk_texts = ["Doc A.", "Doc B.", "Doc C."]
    index_service = build_index(embeddings, chunk_texts)
    embed_svc = make_embed_service()
    service = RetrievalService(embed_service=embed_svc, index_service=index_service)

    result = service.retrieve("confidentiality")
    scores = [r.score for r in result.results]
    assert scores == sorted(scores, reverse=True)


def test_metadata_preserved():
    meta = {"filename": "nda.txt", "clause": "confidentiality"}
    emb = make_embedding([1.0, 0.0, 0.0, 0.0], metadata=meta)
    index_service = build_index([emb], ["Text."])
    embed_svc = make_embed_service()
    service = RetrievalService(embed_service=embed_svc, index_service=index_service)

    result = service.retrieve("test")
    assert len(result.results) == 1
    assert result.results[0].metadata == meta


# ------------------------------------------------------------------
# format_context
# ------------------------------------------------------------------


def test_format_context():
    results = [
        SearchResult(chunk_id="c1", document_id="d1", chunk_text="Hello world.", score=0.95, metadata={"filename": "a.txt", "partition": "Part_I"}),
    ]
    context = RetrievalService.format_context(results)
    assert "[Source 1]" in context
    assert "0.950" in context
    assert "a.txt" in context
    assert "Hello world." in context


def test_format_context_multiple():
    results = [
        SearchResult(chunk_id="c1", document_id="d1", chunk_text="First.", score=0.9, metadata={"filename": "a.txt"}),
        SearchResult(chunk_id="c2", document_id="d2", chunk_text="Second.", score=0.8, metadata={}),
    ]
    context = RetrievalService.format_context(results)
    assert "[Source 1]" in context
    assert "[Source 2]" in context
    assert "First." in context
    assert "Second." in context


def test_format_context_empty():
    assert RetrievalService.format_context([]) == ""


def test_format_context_missing_chunk_text():
    results = [
        SearchResult(chunk_id="c1", document_id="d1", chunk_text="", score=0.9, metadata={}),
    ]
    context = RetrievalService.format_context(results)
    assert "[chunk_id: c1]" in context


# ------------------------------------------------------------------
# RetrievalResult model
# ------------------------------------------------------------------


def test_retrieval_result_model():
    result = RetrievalResult(query="q", results=[], context="")
    assert result.query == "q"
    assert result.results == []
    assert result.context == ""


def test_retrieval_result_defaults():
    result = RetrievalResult(query="q")
    assert result.results == []
    assert result.context == ""


# ------------------------------------------------------------------
# Integration: FAISS save/load + retrieve
# ------------------------------------------------------------------


def test_retrieve_after_index_save_and_load():
    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0]),
        make_embedding([0.0, 1.0, 0.0, 0.0]),
    ]
    chunk_texts = ["First.", "Second."]
    embed_svc = make_embed_service()

    with tempfile.TemporaryDirectory() as tmp:
        index_path = Path(tmp) / "index.faiss"
        metadata_path = Path(tmp) / "metadata.pkl"

        svc = FaissIndexService(index_path=index_path, metadata_path=metadata_path)
        svc.build_index(embeddings, chunk_texts=chunk_texts)
        svc.save()

        loaded_svc = FaissIndexService.load(index_path=index_path, metadata_path=metadata_path)
        service = RetrievalService(embed_service=embed_svc, index_service=loaded_svc)
        result = service.retrieve("test", top_k=2)

        assert len(result.results) == 2
        # Order depends on fake embedder's deterministic vector output
        assert {r.chunk_text for r in result.results} == {"First.", "Second."}


def test_retrieve_document_id_matches():
    doc_id = str(uuid.uuid4())
    emb = make_embedding([1.0, 0.0, 0.0, 0.0], document_id=doc_id)
    index_service = build_index([emb], ["Text."])
    embed_svc = make_embed_service()
    service = RetrievalService(embed_service=embed_svc, index_service=index_service)

    result = service.retrieve("test")
    assert result.results[0].document_id == doc_id
