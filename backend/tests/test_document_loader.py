"""
Tests for the DocumentLoader service and file_utils.

Uses the real CUAD dataset at ``backend/data/CUAD/`` for
integration tests and temporary directories for edge cases.
"""

import pytest
import tempfile
from pathlib import Path

from app.services.document_loader import DocumentLoader
from app.models.document import Document
from app.utils.file_utils import (
    scan_directory,
    read_text_file,
    is_valid_file,
    extract_partition,
)

REPO_ROOT = Path(__file__).resolve().parents[1]
DATASET_PATH = REPO_ROOT / "data" / "CUAD"
CONTRACTS_PATH = DATASET_PATH / "contracts"


# ------------------------------------------------------------------
# Integration tests (use the real CUAD dataset)
# ------------------------------------------------------------------


def test_load_all_documents():
    """Verify all 516 contract documents are loaded."""
    loader = DocumentLoader(str(DATASET_PATH))
    docs = loader.load_all()
    assert len(docs) == 516


def test_load_all_returns_document_objects():
    """Verify every returned item is a Document instance."""
    loader = DocumentLoader(str(DATASET_PATH))
    docs = loader.load_all()
    for doc in docs:
        assert isinstance(doc, Document)


def test_document_metadata_fields():
    """Verify all metadata fields are populated on every document."""
    loader = DocumentLoader(str(DATASET_PATH))
    docs = loader.load_all()

    for doc in docs:
        assert doc.id, "id must be non-empty"
        assert doc.filename, "filename must be non-empty"
        assert doc.filename.endswith(".txt"), f"filename must end with .txt: {doc.filename}"
        assert doc.relative_path, "relative_path must be non-empty"
        assert doc.dataset_name == "CUAD v1"
        assert doc.partition in ("Part_I", "Part_II", "Part_III")
        assert doc.file_size > 0, f"file_size must be > 0 for {doc.filename}"
        assert doc.load_timestamp, "load_timestamp must be non-empty"
        assert doc.content, f"content must be non-empty for {doc.filename}"


def test_document_ids_are_unique():
    """Verify every document has a unique ID."""
    loader = DocumentLoader(str(DATASET_PATH))
    docs = loader.load_all()
    ids = [doc.id for doc in docs]
    assert len(ids) == len(set(ids))


def test_load_partition_counts():
    """Verify partition-level loading returns correct counts."""
    loader = DocumentLoader(str(DATASET_PATH))
    expected = {"Part_I": 225, "Part_II": 161, "Part_III": 130}

    for partition, expected_count in expected.items():
        docs = loader.load_partition(partition)
        assert len(docs) == expected_count, (
            f"Expected {expected_count} documents in {partition}, got {len(docs)}"
        )


def test_partition_field_is_correct():
    """Verify the partition field matches the source directory."""
    loader = DocumentLoader(str(DATASET_PATH))

    for partition in ("Part_I", "Part_II", "Part_III"):
        docs = loader.load_partition(partition)
        for doc in docs:
            assert doc.partition == partition, (
                f"Expected partition={partition}, got {doc.partition} for {doc.filename}"
            )


def test_count_matches_load_all():
    """Verify count() returns the same number as the length of load_all()."""
    loader = DocumentLoader(str(DATASET_PATH))
    assert loader.count() == len(loader.load_all())


def test_relative_path_format():
    """Verify relative_path starts with the partition name."""
    loader = DocumentLoader(str(DATASET_PATH))
    docs = loader.load_all()

    for doc in docs:
        assert doc.relative_path.startswith(doc.partition), (
            f"relative_path '{doc.relative_path}' should start with '{doc.partition}'"
        )


def test_content_is_readable_text():
    """Verify document content looks like readable contract text."""
    loader = DocumentLoader(str(DATASET_PATH))
    docs = loader.load_all()

    sample = [d for d in docs if d.partition == "Part_I"][:5]
    for doc in sample:
        assert len(doc.content) > 100, f"Content too short for {doc.filename}"
        assert any(c.isalpha() for c in doc.content[:100]), (
            f"Content does not start with readable text for {doc.filename}"
        )


# ------------------------------------------------------------------
# Edge case tests (use temporary directories)
# ------------------------------------------------------------------


def test_scan_directory_raises_on_missing():
    """Verify scan_directory raises FileNotFoundError for missing paths."""
    with pytest.raises(FileNotFoundError):
        scan_directory(Path("/nonexistent/path"))


def test_scan_directory_ignores_non_txt(tmp_path: Path):
    """Verify that only .txt files are returned when scanning."""
    (tmp_path / "contract.txt").write_text("hello")
    (tmp_path / "notes.md").write_text("# readme")
    (tmp_path / "data.json").write_text('{"a": 1}')

    files = scan_directory(tmp_path, extension=".txt")
    assert len(files) == 1
    assert files[0].name == "contract.txt"


def test_is_valid_file_rejects_empty(tmp_path: Path):
    """Verify is_valid_file rejects empty .txt files."""
    empty_file = tmp_path / "empty.txt"
    empty_file.write_text("")
    assert is_valid_file(empty_file) is False


def test_is_valid_file_rejects_unsupported_extension(tmp_path: Path):
    """Verify is_valid_file rejects non-.txt files."""
    md_file = tmp_path / "notes.md"
    md_file.write_text("# Hello")
    assert is_valid_file(md_file) is False


def test_is_valid_file_accepts_valid(tmp_path: Path):
    """Verify is_valid_file accepts a valid non-empty .txt file."""
    valid_file = tmp_path / "valid.txt"
    valid_file.write_text("Some contract text content here.")
    assert is_valid_file(valid_file) is True


def test_read_text_file_returns_content(tmp_path: Path):
    """Verify read_text_file returns the full file content."""
    file_path = tmp_path / "sample.txt"
    file_path.write_text("Hello, world!", encoding="utf-8")
    content = read_text_file(file_path)
    assert content == "Hello, world!"


def test_read_text_file_returns_none_on_missing():
    """Verify read_text_file returns None for a non-existent file."""
    content = read_text_file(Path("/nonexistent/file.txt"))
    assert content is None


def test_extract_partition_returns_none_for_unrelated_path(tmp_path: Path):
    """Verify extract_partition returns None when no partition is found."""
    file_path = tmp_path / "other" / "doc.txt"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text("content")
    partition = extract_partition(file_path, tmp_path)
    assert partition is None


def test_loader_raises_on_missing_dataset():
    """Verify DocumentLoader raises FileNotFoundError for missing dataset."""
    loader = DocumentLoader("/nonexistent/path")
    with pytest.raises(FileNotFoundError):
        loader.load_all()


def test_loader_load_all_skips_non_txt_in_contracts(tmp_path: Path):
    """Verify the loader skips non-.txt files and empty files."""
    part_dir = tmp_path / "contracts" / "Part_I"
    part_dir.mkdir(parents=True)

    valid = part_dir / "contract.txt"
    valid.write_text("This is a valid contract.")

    invalid_ext = part_dir / "notes.md"
    invalid_ext.write_text("# Not a contract")

    empty_file = part_dir / "empty.txt"
    empty_file.write_text("")

    loader = DocumentLoader(str(tmp_path))
    docs = loader.load_all()
    assert len(docs) == 1
    assert docs[0].filename == "contract.txt"
