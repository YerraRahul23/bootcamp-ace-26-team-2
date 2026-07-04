"""
Tests for the EmbeddingService and Embedding model.

Uses a fake embedder that returns deterministic vectors
so tests are fast and do not require a real API key.
"""

import pytest
import uuid
from pathlib import Path

from app.services.embedding_service import EmbeddingService
from app.services.chunk_service import ChunkService
from app.services.document_loader import DocumentLoader
from app.models.chunk import Chunk
from app.models.embedding import Embedding
from app.core.config import settings

REPO_ROOT = Path(__file__).resolve().parents[1]
DATASET_PATH = REPO_ROOT / "data" / "CUAD"


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


def make_chunk(text: str, **overrides) -> Chunk:
    """Create a synthetic Chunk with the given text and optional field overrides."""
    fields = {
        "id": str(uuid.uuid4()),
        "document_id": str(uuid.uuid4()),
        "chunk_index": 0,
        "text": text,
        "metadata": {"filename": "test.txt", "partition": "Part_I"},
    }
    fields.update(overrides)
    return Chunk(**fields)


def test_embed_single_chunk():
    """Verify a single chunk produces one Embedding with a non-empty vector."""
    chunk = make_chunk("This is a test contract clause.")
    fake = FakeEmbedder(dimension=4)
    service = EmbeddingService(embed_model=fake, batch_size=10)
    result = service.embed_chunk(chunk)

    assert result is not None
    assert isinstance(result, Embedding)
    assert len(result.vector) == 4
    assert all(isinstance(v, float) for v in result.vector)


def test_embed_single_chunk_empty_text():
    """Verify an empty-text chunk returns None."""
    chunk = make_chunk("")
    fake = FakeEmbedder()
    service = EmbeddingService(embed_model=fake)
    result = service.embed_chunk(chunk)
    assert result is None


def test_embed_single_chunk_whitespace_only():
    """Verify a whitespace-only chunk returns None."""
    chunk = make_chunk("   \n\n   ")
    fake = FakeEmbedder()
    service = EmbeddingService(embed_model=fake)
    result = service.embed_chunk(chunk)
    assert result is None


def test_embed_multiple_chunks():
    """Verify multiple chunks produce the correct number of Embeddings."""
    chunks = [
        make_chunk("First clause."),
        make_chunk("Second clause."),
        make_chunk("Third clause."),
    ]
    fake = FakeEmbedder(dimension=4)
    service = EmbeddingService(embed_model=fake, batch_size=10)
    results = service.embed_chunks(chunks)

    assert len(results) == 3
    assert all(isinstance(e, Embedding) for e in results)


def test_embed_multiple_chunks_skips_empty():
    """Verify empty chunks are skipped and not included in results."""
    chunks = [
        make_chunk("Valid text."),
        make_chunk(""),
        make_chunk("Also valid."),
    ]
    fake = FakeEmbedder()
    service = EmbeddingService(embed_model=fake)
    results = service.embed_chunks(chunks)

    assert len(results) == 2
    assert results[0].chunk_id == chunks[0].id
    assert results[1].chunk_id == chunks[2].id


def test_embed_all_empty_returns_empty():
    """Verify embedding a list of only empty chunks returns empty list."""
    chunks = [make_chunk(""), make_chunk("")]
    fake = FakeEmbedder()
    service = EmbeddingService(embed_model=fake)
    results = service.embed_chunks(chunks)
    assert results == []


def test_embed_empty_list():
    """Verify embedding an empty list returns an empty list."""
    fake = FakeEmbedder()
    service = EmbeddingService(embed_model=fake)
    results = service.embed_chunks([])
    assert results == []


def test_batch_processing():
    """Verify that batch_size smaller than chunk count processes in multiple batches."""
    chunks = [make_chunk(f"Chunk {i} text.") for i in range(10)]
    fake = FakeEmbedder(dimension=4)
    service = EmbeddingService(embed_model=fake, batch_size=3)
    results = service.embed_chunks(chunks)

    assert len(results) == 10
    assert fake.call_count > 1


def test_custom_batch_size():
    """Verify different batch sizes still produce correct results."""
    chunks = [make_chunk(f"Chunk {i} text.") for i in range(7)]
    fake = FakeEmbedder(dimension=4)

    service_small = EmbeddingService(embed_model=fake, batch_size=2)
    results_small = service_small.embed_chunks(chunks)

    fake.call_count = 0
    service_large = EmbeddingService(embed_model=fake, batch_size=10)
    results_large = service_large.embed_chunks(chunks)

    assert len(results_small) == 7
    assert len(results_large) == 7


def test_metadata_preserved():
    """Verify each Embedding preserves the parent chunk's metadata."""
    metadata = {"filename": "nda.txt", "partition": "Part_II", "source": "test"}
    chunk = make_chunk("Some text.", metadata=metadata)
    fake = FakeEmbedder()
    service = EmbeddingService(embed_model=fake)
    result = service.embed_chunk(chunk)

    assert result is not None
    assert result.metadata == metadata


def test_document_id_tracking():
    """Verify embedding.document_id matches the parent chunk's document_id."""
    doc_id = str(uuid.uuid4())
    chunk = make_chunk("Text.", document_id=doc_id)
    fake = FakeEmbedder()
    service = EmbeddingService(embed_model=fake)
    result = service.embed_chunk(chunk)

    assert result is not None
    assert result.document_id == doc_id


def test_chunk_id_tracking():
    """Verify embedding.chunk_id matches the parent chunk's id."""
    chunk_id = str(uuid.uuid4())
    chunk = make_chunk("Text.", id=chunk_id)
    fake = FakeEmbedder()
    service = EmbeddingService(embed_model=fake)
    result = service.embed_chunk(chunk)

    assert result is not None
    assert result.chunk_id == chunk_id


def test_vector_dimension_consistent():
    """Verify all embeddings have the same vector dimension."""
    chunks = [make_chunk(f"Chunk {i}.") for i in range(5)]
    fake = FakeEmbedder(dimension=8)
    service = EmbeddingService(embed_model=fake)
    results = service.embed_chunks(chunks)

    dimensions = {len(e.vector) for e in results}
    assert dimensions == {8}


def test_embedding_ids_unique():
    """Verify all embedding IDs are unique."""
    chunks = [make_chunk(f"Chunk {i}.") for i in range(20)]
    fake = FakeEmbedder(dimension=4)
    service = EmbeddingService(embed_model=fake, batch_size=5)
    results = service.embed_chunks(chunks)

    ids = [e.id for e in results]
    assert len(ids) == len(set(ids))


def test_full_pipeline_small():
    """Verify the loader -> chunker -> embedder pipeline works end-to-end."""
    loader = DocumentLoader(str(DATASET_PATH))
    docs = loader.load_partition("Part_I")

    chunk_service = ChunkService(chunk_size=500, chunk_overlap=100)
    chunks = chunk_service.chunk_documents(docs[:3])

    assert len(chunks) > 3

    fake = FakeEmbedder(dimension=8)
    embed_service = EmbeddingService(embed_model=fake, batch_size=5)
    embeddings = embed_service.embed_chunks(chunks)

    assert len(embeddings) == len(chunks)
    assert all(e.document_id in {d.id for d in docs[:3]} for e in embeddings)
    assert all(len(e.vector) == 8 for e in embeddings)
