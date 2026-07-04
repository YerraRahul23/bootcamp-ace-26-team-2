"""
Tests for the ChunkService and Chunk model.

Uses the real CUAD dataset for integration tests and
synthetic Document fixtures for unit/edge-case tests.
"""

import pytest
import uuid
from pathlib import Path

from app.services.chunk_service import ChunkService
from app.services.document_loader import DocumentLoader
from app.models.document import Document
from app.models.chunk import Chunk
from app.core.config import settings

REPO_ROOT = Path(__file__).resolve().parents[1]
DATASET_PATH = REPO_ROOT / "data" / "CUAD"


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------


def make_document(content: str, **overrides) -> Document:
    """Create a synthetic Document with the given content and optional field overrides."""
    fields = {
        "id": str(uuid.uuid4()),
        "filename": "test_contract.txt",
        "relative_path": "Part_I/test_contract.txt",
        "dataset_name": "CUAD v1",
        "partition": "Part_I",
        "file_size": len(content.encode("utf-8")),
        "load_timestamp": "2026-07-04T12:00:00+00:00",
        "content": content,
    }
    fields.update(overrides)
    return Document(**fields)


# ------------------------------------------------------------------
# Unit tests — synthetic documents
# ------------------------------------------------------------------


def test_chunk_single_document():
    """Verify a single document is split into multiple chunks."""
    content = "Hello. " * 500  # ~3500 chars
    doc = make_document(content)
    service = ChunkService(chunk_size=500, chunk_overlap=50)
    chunks = service.chunk_document(doc)

    assert len(chunks) > 1
    assert all(isinstance(c, Chunk) for c in chunks)


def test_overlap_respected():
    """Verify that consecutive chunks share overlapping text."""
    content = "Hello. " * 500
    doc = make_document(content)
    service = ChunkService(chunk_size=300, chunk_overlap=100)
    chunks = service.chunk_document(doc)

    assert len(chunks) >= 2

    for i in range(len(chunks) - 1):
        current = chunks[i].text
        next_chunk = chunks[i + 1].text
        overlap_found = current[-100:] in next_chunk or next_chunk[:100] in current
        if not overlap_found:
            # The splitter may split at a separator boundary, so some
            # overlap may be smaller than the requested value.
            min_overlap = min(len(current), len(next_chunk), 50)
            overlap_found = current[-min_overlap:] in next_chunk or next_chunk[:min_overlap] in current
        assert overlap_found, (
            f"No overlap detected between chunk {i} and chunk {i + 1}"
        )


def test_metadata_preserved():
    """Verify each chunk preserves the parent document's metadata."""
    content = "Hello. " * 500
    doc = make_document(content)
    service = ChunkService(chunk_size=500, chunk_overlap=50)
    chunks = service.chunk_document(doc)

    for chunk in chunks:
        assert chunk.metadata["filename"] == doc.filename
        assert chunk.metadata["relative_path"] == doc.relative_path
        assert chunk.metadata["dataset_name"] == doc.dataset_name
        assert chunk.metadata["partition"] == doc.partition
        assert chunk.metadata["file_size"] == doc.file_size
        assert chunk.metadata["load_timestamp"] == doc.load_timestamp


def test_empty_document_produces_no_chunks():
    """Verify an empty document yields zero chunks."""
    doc = make_document("")
    service = ChunkService()
    chunks = service.chunk_document(doc)
    assert len(chunks) == 0


def test_whitespace_only_document_produces_no_chunks():
    """Verify a whitespace-only document yields zero chunks."""
    doc = make_document("   \n\n   \t   ")
    service = ChunkService()
    chunks = service.chunk_document(doc)
    assert len(chunks) == 0


def test_chunk_ids_are_unique():
    """Verify all chunk IDs across multiple documents are unique."""
    docs = [
        make_document("Hello. " * 200, id=str(uuid.uuid4())),
        make_document("World. " * 200, id=str(uuid.uuid4())),
        make_document("Test. " * 200, id=str(uuid.uuid4())),
    ]
    service = ChunkService(chunk_size=300, chunk_overlap=50)
    chunks = service.chunk_documents(docs)

    chunk_ids = [c.id for c in chunks]
    assert len(chunk_ids) == len(set(chunk_ids))


def test_chunk_indices_are_sequential():
    """Verify chunk indices within a document are 0, 1, 2, ..."""
    content = "Hello. " * 500
    doc = make_document(content)
    service = ChunkService(chunk_size=300, chunk_overlap=50)
    chunks = service.chunk_document(doc)

    for i, chunk in enumerate(chunks):
        assert chunk.chunk_index == i, (
            f"Expected index {i}, got {chunk.chunk_index}"
        )


def test_chunk_index_resets_per_document():
    """Verify each document's chunks start at index 0."""
    docs = [
        make_document("Hello. " * 500),
        make_document("World. " * 500),
    ]
    service = ChunkService(chunk_size=300, chunk_overlap=50)
    chunks = service.chunk_documents(docs)

    doc_ids = [c.document_id for c in chunks]

    # Find where the second document's chunks begin
    first_doc_id = docs[0].id
    second_start = None
    for i, cid in enumerate(doc_ids):
        if cid != first_doc_id:
            second_start = i
            break

    assert second_start is not None
    assert chunks[second_start].chunk_index == 0
    assert chunks[second_start + 1].chunk_index == 1


def test_document_id_tracking():
    """Verify each chunk's document_id matches its parent."""
    doc = make_document("Hello. " * 500)
    service = ChunkService(chunk_size=300, chunk_overlap=50)
    chunks = service.chunk_document(doc)

    for chunk in chunks:
        assert chunk.document_id == doc.id


def test_single_character_text():
    """Verify text shorter than chunk_size produces a single chunk at index 0."""
    doc = make_document("Short text.")
    service = ChunkService(chunk_size=1000, chunk_overlap=200)
    chunks = service.chunk_document(doc)

    assert len(chunks) == 1
    assert chunks[0].chunk_index == 0
    assert chunks[0].text == "Short text."


def test_custom_chunk_size():
    """Verify custom chunk_size and chunk_overlap are used."""
    content = "A. " * 2000  # ~6000 chars
    doc = make_document(content)

    service = ChunkService(chunk_size=200, chunk_overlap=50)
    chunks_200 = service.chunk_document(doc)

    service = ChunkService(chunk_size=1000, chunk_overlap=200)
    chunks_1000 = service.chunk_document(doc)

    assert len(chunks_200) > len(chunks_1000)


def test_chunk_count_greater_than_document_count():
    """Verify that chunking many documents yields more chunks than documents."""
    docs = [
        make_document("Hello. " * 200, id=str(uuid.uuid4())),
        make_document("World. " * 200, id=str(uuid.uuid4())),
        make_document("Test. " * 200, id=str(uuid.uuid4())),
        make_document("Foo. " * 200, id=str(uuid.uuid4())),
        make_document("Bar. " * 200, id=str(uuid.uuid4())),
    ]
    service = ChunkService(chunk_size=200, chunk_overlap=50)
    chunks = service.chunk_documents(docs)

    assert len(chunks) > len(docs)


# ------------------------------------------------------------------
# Integration tests — real CUAD dataset
# ------------------------------------------------------------------


def test_chunk_all_cuad_documents():
    """Verify the loader + chunker pipeline works end-to-end on all 516 contracts."""
    loader = DocumentLoader(str(DATASET_PATH))
    docs = loader.load_all()
    assert len(docs) == 516

    service = ChunkService(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    chunks = service.chunk_documents(docs)

    assert len(chunks) > len(docs)
    assert len(chunks) > 1000  # Sanity check: should produce thousands of chunks


def test_chunk_all_document_ids_unique():
    """Verify that chunks from the full dataset have no duplicate document_ids."""
    loader = DocumentLoader(str(DATASET_PATH))
    docs = loader.load_all()

    service = ChunkService(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    chunks = service.chunk_documents(docs)

    chunk_ids = [c.id for c in chunks]
    assert len(chunk_ids) == len(set(chunk_ids))


def test_chunk_all_metadata_preserved():
    """Verify metadata is preserved for chunks from the full dataset."""
    loader = DocumentLoader(str(DATASET_PATH))
    docs = loader.load_all()

    service = ChunkService(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    chunks = service.chunk_documents(docs)

    doc_map = {d.id: d for d in docs}
    for chunk in chunks:
        parent = doc_map[chunk.document_id]
        assert chunk.metadata["filename"] == parent.filename
        assert chunk.metadata["partition"] == parent.partition
