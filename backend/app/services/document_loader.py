"""
Document loading service.

Scans the CUAD contracts directory, validates each file,
reads its content, and returns a list of standardized
Document objects with full metadata.
"""

import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.models.document import Document
from app.utils.file_utils import (
    scan_directory,
    read_text_file,
    get_file_size,
    is_valid_file,
    extract_partition,
)

logger = logging.getLogger(__name__)


class DocumentLoader:
    """
    Loads contract documents from the CUAD dataset.

    Scans the configured contracts directory, validates each file,
    reads its content, and produces a list of Document objects
    for downstream processing (chunking, embeddings, etc.).
    """

    def __init__(self, dataset_path: str | Path) -> None:
        """
        Initialize the DocumentLoader with a path to the CUAD dataset.

        Args:
            dataset_path: Path to the CUAD dataset root.
                          The contracts subdirectory is expected at
                          ``<dataset_path>/contracts/``.
        """
        self.dataset_path = Path(dataset_path).resolve()
        self.contracts_path = self.dataset_path / "contracts"
        logger.info(
            "DocumentLoader initialized with dataset path: %s",
            self.dataset_path,
        )

    def load_all(self) -> list[Document]:
        """
        Load all valid contract documents from the dataset.

        Recursively scans the contracts directory, validates each file,
        reads UTF-8 content, and returns a list of Document objects.

        Returns:
            List of Document objects with metadata and content.

        Raises:
            FileNotFoundError: If the contracts directory does not exist.
        """
        logger.info("Starting full document load from %s", self.contracts_path)
        file_paths = scan_directory(self.contracts_path, extension=".txt")
        documents = []

        for file_path in file_paths:
            doc = self._build_document(file_path)
            if doc is not None:
                documents.append(doc)

        logger.info(
            "Document load complete: %d documents loaded out of %d files found",
            len(documents),
            len(file_paths),
        )
        return documents

    def load_partition(self, partition: str) -> list[Document]:
        """
        Load documents from a single partition of the dataset.

        Args:
            partition: Partition name (e.g. "Part_I", "Part_II", "Part_III").

        Returns:
            List of Document objects for the given partition.

        Raises:
            FileNotFoundError: If the partition directory does not exist.
        """
        partition_path = self.contracts_path / partition
        logger.info("Loading partition %s from %s", partition, partition_path)
        file_paths = scan_directory(partition_path, extension=".txt")
        documents = []

        for file_path in file_paths:
            doc = self._build_document(file_path)
            if doc is not None:
                documents.append(doc)

        logger.info(
            "Partition %s load complete: %d documents loaded",
            partition,
            len(documents),
        )
        return documents

    def count(self) -> int:
        """
        Count the total number of valid documents in the dataset.

        Returns:
            Total document count.
        """
        file_paths = scan_directory(self.contracts_path, extension=".txt")
        valid = [fp for fp in file_paths if is_valid_file(fp)]
        return len(valid)

    def _build_document(self, file_path: Path) -> Document | None:
        """
        Build a Document object from a single file path.

        Validates the file, reads its content, extracts metadata,
        and returns a Document. Returns None if the file is invalid
        or cannot be read.

        Args:
            file_path: Path to a contract text file.

        Returns:
            A Document instance, or None if loading failed.
        """
        if not is_valid_file(file_path):
            return None

        content = read_text_file(file_path)
        if content is None:
            return None

        partition = extract_partition(file_path, self.contracts_path)
        if partition is None:
            logger.warning("Could not determine partition for %s, skipping", file_path)
            return None

        relative_path = str(file_path.relative_to(self.contracts_path))
        file_size = get_file_size(file_path)
        timestamp = datetime.now(timezone.utc).isoformat()

        return Document(
            id=str(uuid.uuid4()),
            filename=file_path.name,
            relative_path=relative_path,
            dataset_name="CUAD v1",
            partition=partition,
            file_size=file_size,
            load_timestamp=timestamp,
            content=content,
        )
