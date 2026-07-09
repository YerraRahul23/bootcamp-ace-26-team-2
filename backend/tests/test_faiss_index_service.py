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
# Append
# ------------------------------------------------------------------


def test_append_empty_index():
    """Appending to an unbuilt service should build the index."""
    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0]),
        make_embedding([0.0, 1.0, 0.0, 0.0]),
    ]
    service = FaissIndexService()
    service.append_embeddings(embeddings)

    assert service.is_built
    assert service.size == 2


def test_append_to_existing_index():
    """Appending to an existing index should preserve old + new vectors."""
    first = [
        make_embedding([1.0, 0.0, 0.0, 0.0]),
        make_embedding([0.0, 1.0, 0.0, 0.0]),
    ]
    second = [
        make_embedding([0.0, 0.0, 1.0, 0.0]),
        make_embedding([0.0, 0.0, 0.0, 1.0]),
    ]
    service = FaissIndexService()
    service.build_index(first)
    assert service.size == 2

    service.append_embeddings(second)
    assert service.size == 4

    # All four vectors should be searchable
    results = service.search([1.0, 0.0, 0.0, 0.0], top_k=4)
    assert len(results) == 4


def test_append_empty_list_raises():
    service = FaissIndexService()
    with pytest.raises(ValueError, match="empty"):
        service.append_embeddings([])


# ------------------------------------------------------------------
# Metadata filter
# ------------------------------------------------------------------


def test_search_with_metadata_filter():
    doc_a_id = str(uuid.uuid4())
    doc_b_id = str(uuid.uuid4())

    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0], document_id=doc_a_id,
                       metadata={"document_id": doc_a_id, "filename": "a.txt"}),
        make_embedding([0.0, 1.0, 0.0, 0.0], document_id=doc_b_id,
                       metadata={"document_id": doc_b_id, "filename": "b.txt"}),
    ]
    service = FaissIndexService()
    service.build_index(embeddings)

    # Filter by doc_a
    results = service.search([0.9, 0.1, 0.0, 0.0], top_k=5, metadata_filter={"document_id": doc_a_id})
    assert len(results) == 1
    assert results[0].document_id == doc_a_id

    # Filter by doc_b
    results = service.search([0.9, 0.1, 0.0, 0.0], top_k=5, metadata_filter={"document_id": doc_b_id})
    assert len(results) == 1
    assert results[0].document_id == doc_b_id


def test_search_with_metadata_filter_multiple_docs():
    doc_ids = [str(uuid.uuid4()) for _ in range(3)]
    embeddings = []
    for i, did in enumerate(doc_ids):
        embeddings.append(
            make_embedding(
                [float(i) / 10.0] * 4,
                document_id=did,
                metadata={"document_id": did, "filename": f"{i}.txt"},
            )
        )

    service = FaissIndexService()
    service.build_index(embeddings)

    for did in doc_ids:
        results = service.search([1.0, 0.0, 0.0, 0.0], top_k=5, metadata_filter={"document_id": did})
        assert len(results) == 1
        assert results[0].document_id == did


# ------------------------------------------------------------------
# document_exists
# ------------------------------------------------------------------


def test_document_exists():
    did = str(uuid.uuid4())
    emb = make_embedding([1.0, 0.0, 0.0, 0.0], document_id=did,
                         metadata={"document_id": did})
    service = FaissIndexService()
    service.build_index([emb])

    assert service.document_exists(did)
    assert not service.document_exists("nonexistent-id")


# ------------------------------------------------------------------
# Cross-document boundary: metadata_filter must never leak
# ------------------------------------------------------------------


def test_search_metadata_filter_never_crosses_documents():
    """With 3 documents in the index, filtering by one doc's ID must return
    zero results from the other two documents."""
    doc_ids = [str(uuid.uuid4()) for _ in range(3)]
    embeddings = []
    for i, did in enumerate(doc_ids):
        for j in range(3):  # 3 chunks per document
            embeddings.append(
                make_embedding(
                    [float(i + j * 0.1)] * 4,
                    document_id=did,
                    metadata={
                        "document_id": did,
                        "filename": f"doc_{i}.pdf",
                        "chunk_index": j,
                    },
                )
            )
    service = FaissIndexService()
    service.build_index(embeddings)
    assert service.size == 9

    for target_did in doc_ids:
        results = service.search(
            [1.0, 0.0, 0.0, 0.0],
            top_k=9,  # request all
            metadata_filter={"document_id": target_did},
        )
        # Every result must belong to the target document
        for r in results:
            assert r.document_id == target_did, (
                f"Expected doc_id={target_did}, got {r.document_id}"
            )
        assert len(results) == 3  # exactly 3 chunks from the target doc


def test_search_metadata_filter_multiple_filters():
    """Multiple filter keys must all match for a result to pass."""
    doc_id = str(uuid.uuid4())
    embeddings = [
        make_embedding(
            [1.0, 0.0, 0.0, 0.0],
            document_id=doc_id,
            metadata={"document_id": doc_id, "filename": "a.pdf", "type": "nda"},
        ),
        make_embedding(
            [0.0, 1.0, 0.0, 0.0],
            document_id=doc_id,
            metadata={"document_id": doc_id, "filename": "a.pdf", "type": "service"},
        ),
    ]
    service = FaissIndexService()
    service.build_index(embeddings)

    results = service.search(
        [1.0, 0.0, 0.0, 0.0],
        top_k=5,
        metadata_filter={"document_id": doc_id, "type": "nda"},
    )
    assert len(results) == 1
    assert results[0].metadata.get("type") == "nda"


# ------------------------------------------------------------------
# MMR must never mix documents when metadata_filter is active
# ------------------------------------------------------------------


def test_mmr_never_mixes_documents():
    """When metadata_filter restricts to one document, MMR must not
    introduce chunks from other documents."""
    doc_a = str(uuid.uuid4())
    doc_b = str(uuid.uuid4())
    embeddings = []
    # 10 chunks from doc_a
    for j in range(10):
        embeddings.append(
            make_embedding(
                [0.9 - j * 0.05, 0.1, 0.0, 0.0],
                document_id=doc_a,
                metadata={"document_id": doc_a, "filename": "a.pdf"},
            )
        )
    # 10 chunks from doc_b
    for j in range(10):
        embeddings.append(
            make_embedding(
                [0.1, 0.9 - j * 0.05, 0.0, 0.0],
                document_id=doc_b,
                metadata={"document_id": doc_b, "filename": "b.pdf"},
            )
        )

    service = FaissIndexService()
    service.build_index(embeddings)
    assert service.size == 20

    # Filter to doc_a with top_k=5
    results = service.search(
        [1.0, 0.0, 0.0, 0.0],
        top_k=5,
        use_mmr=True,
        metadata_filter={"document_id": doc_a},
    )
    assert len(results) == 5
    for r in results:
        assert r.document_id == doc_a, f"MMR leaked doc_id={r.document_id}"
        assert r.metadata.get("filename") == "a.pdf"


def test_mmr_never_mixes_without_filter():
    """Without metadata_filter, MMR deduplicates by filename, but each
    result must still come from the correct document_id."""
    doc_a = str(uuid.uuid4())
    doc_b = str(uuid.uuid4())
    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0], document_id=doc_a,
                       metadata={"document_id": doc_a, "filename": "a.pdf"}),
        make_embedding([0.0, 1.0, 0.0, 0.0], document_id=doc_b,
                       metadata={"document_id": doc_b, "filename": "b.pdf"}),
    ]
    service = FaissIndexService()
    service.build_index(embeddings)

    results = service.search([1.0, 0.0, 0.0, 0.0], top_k=5, use_mmr=True)
    # Without filter, both docs can appear
    assert len(results) == 2
    doc_ids_found = {r.document_id for r in results}
    assert doc_a in doc_ids_found
    assert doc_b in doc_ids_found


# ------------------------------------------------------------------
# Save with no index
# ------------------------------------------------------------------


def test_save_without_built_index_does_not_raise():
    service = FaissIndexService()
    service.save()
