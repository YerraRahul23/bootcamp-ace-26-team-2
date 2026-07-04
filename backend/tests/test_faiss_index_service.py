"""
Tests for FaissIndexService and SearchResult model.

Uses small synthetic Embedding objects with deterministic
vectors so tests are fast and have no external dependencies.
"""

import uuid
import tempfile
from pathlib import Path

import numpy as np
import pytest

from app.models.embedding import Embedding
from app.models.search_result import SearchResult
from app.services.faiss_index_service import FaissIndexService


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


# ------------------------------------------------------------------
# Build index
# ------------------------------------------------------------------


def test_build_index_with_embeddings():
    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0]),
        make_embedding([0.0, 1.0, 0.0, 0.0]),
        make_embedding([0.0, 0.0, 1.0, 0.0]),
    ]
    service = FaissIndexService()
    service.build_index(embeddings)

    assert service.is_built
    assert service.size == 3


def test_build_index_empty_list_raises():
    service = FaissIndexService()
    with pytest.raises(ValueError, match="empty"):
        service.build_index([])


def test_build_index_inconsistent_dimensions_raises():
    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0]),
        make_embedding([1.0, 0.0]),  # wrong dimension
    ]
    service = FaissIndexService()
    with pytest.raises(ValueError, match="dimension"):
        service.build_index(embeddings)


# ------------------------------------------------------------------
# Search
# ------------------------------------------------------------------


def test_search_returns_top_k():
    embeddings = [make_embedding([float(i) / 10.0] * 4) for i in range(10)]
    service = FaissIndexService()
    service.build_index(embeddings)

    results = service.search([1.0, 0.0, 0.0, 0.0], top_k=3)
    assert len(results) == 3


def test_search_k_larger_than_index():
    embeddings = [make_embedding([float(i) / 10.0] * 4) for i in range(3)]
    service = FaissIndexService()
    service.build_index(embeddings)

    results = service.search([1.0, 0.0, 0.0, 0.0], top_k=100)
    assert len(results) == 3


def test_search_k_zero():
    embeddings = [make_embedding([float(i) / 10.0] * 4) for i in range(5)]
    service = FaissIndexService()
    service.build_index(embeddings)

    results = service.search([1.0, 0.0, 0.0, 0.0], top_k=0)
    assert results == []


def test_search_on_empty_index():
    service = FaissIndexService()
    results = service.search([1.0, 0.0, 0.0, 0.0], top_k=5)
    assert results == []


def test_search_most_similar_first():
    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0]),
        make_embedding([0.0, 1.0, 0.0, 0.0]),
        make_embedding([0.0, 0.0, 1.0, 0.0]),
    ]
    service = FaissIndexService()
    service.build_index(embeddings)

    query = [0.9, 0.1, 0.0, 0.0]
    results = service.search(query, top_k=3)

    assert len(results) == 3
    assert results[0].chunk_id == embeddings[0].chunk_id
    assert results[0].score >= results[1].score


def test_cosine_similarity_identical_vectors():
    vector = [0.5, 0.5, 0.5, 0.5]
    embeddings = [make_embedding(vector) for _ in range(3)]
    service = FaissIndexService()
    service.build_index(embeddings)

    results = service.search(vector, top_k=3)

    assert len(results) == 3
    for r in results:
        assert abs(r.score - 1.0) < 1e-5


# ------------------------------------------------------------------
# Save / Load round-trip
# ------------------------------------------------------------------


def test_save_and_load_round_trip():
    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0]),
        make_embedding([0.0, 1.0, 0.0, 0.0]),
    ]
    service = FaissIndexService()
    service.build_index(embeddings)

    with tempfile.TemporaryDirectory() as tmp:
        index_path = Path(tmp) / "index.faiss"
        metadata_path = Path(tmp) / "metadata.pkl"

        svc = FaissIndexService(index_path=index_path, metadata_path=metadata_path)
        svc.build_index(embeddings)
        svc.save()

        loaded = FaissIndexService.load(index_path=index_path, metadata_path=metadata_path)
        assert loaded.size == 2
        assert loaded.is_built

        original_results = svc.search([0.8, 0.2, 0.0, 0.0], top_k=2)
        loaded_results = loaded.search([0.8, 0.2, 0.0, 0.0], top_k=2)

        for orig, load in zip(original_results, loaded_results):
            assert orig.chunk_id == load.chunk_id
            assert abs(orig.score - load.score) < 1e-5


def test_metadata_preserved_after_load():
    meta = {"filename": "nda.txt", "clause_type": "confidentiality"}
    emb = make_embedding([1.0, 0.0, 0.0, 0.0], metadata=meta)

    with tempfile.TemporaryDirectory() as tmp:
        index_path = Path(tmp) / "index.faiss"
        metadata_path = Path(tmp) / "metadata.pkl"

        svc = FaissIndexService(index_path=index_path, metadata_path=metadata_path)
        svc.build_index([emb])
        svc.save()

        loaded = FaissIndexService.load(index_path=index_path, metadata_path=metadata_path)
        results = loaded.search([1.0, 0.0, 0.0, 0.0], top_k=1)

        assert len(results) == 1
        assert results[0].metadata == meta


def test_load_nonexistent_index_raises():
    with tempfile.TemporaryDirectory() as tmp:
        index_path = Path(tmp) / "nonexistent.faiss"
        metadata_path = Path(tmp) / "nonexistent.pkl"
        with pytest.raises(FileNotFoundError):
            FaissIndexService.load(index_path=index_path, metadata_path=metadata_path)


# ------------------------------------------------------------------
# SearchResult structure
# ------------------------------------------------------------------


def test_search_result_structure():
    emb = make_embedding([1.0, 0.0, 0.0, 0.0])
    service = FaissIndexService()
    service.build_index([emb])

    results = service.search([1.0, 0.0, 0.0, 0.0], top_k=1)

    assert len(results) == 1
    r = results[0]
    assert isinstance(r, SearchResult)
    assert isinstance(r.chunk_id, str)
    assert isinstance(r.document_id, str)
    assert isinstance(r.score, float)
    assert isinstance(r.metadata, dict)


# ------------------------------------------------------------------
# Vector normalization
# ------------------------------------------------------------------


def test_normalized_vector_has_unit_length():
    emb = make_embedding([3.0, 4.0, 0.0, 0.0])  # length = 5
    service = FaissIndexService()
    service.build_index([emb])

    raw = np.zeros(4, dtype=np.float32)
    service._index.reconstruct(0, raw)
    length = np.linalg.norm(raw)
    assert abs(length - 1.0) < 1e-5


# ------------------------------------------------------------------
# Save with no index
# ------------------------------------------------------------------


def test_save_without_built_index_does_not_raise():
    service = FaissIndexService()
    service.save()
