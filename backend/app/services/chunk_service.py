"""
Document chunking service.

Splits Document objects into smaller Chunk objects using
LangChain's RecursiveCharacterTextSplitter. Chunk size
and overlap are configurable.
"""

import logging
import uuid

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.models.document import Document
from app.models.chunk import Chunk

logger = logging.getLogger(__name__)

# Metadata fields to preserve from each Document
METADATA_FIELDS = [
    "filename",
    "relative_path",
    "dataset_name",
    "partition",
    "file_size",
    "load_timestamp",
]


class ChunkService:
    """
    Splits Document objects into smaller Chunk objects.

    Uses RecursiveCharacterTextSplitter with configurable
    chunk_size and chunk_overlap. Each chunk preserves the
    parent document's metadata and tracks its position.
    """

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200) -> None:
        """
        Initialize the ChunkService with chunking parameters.

        Args:
            chunk_size: Maximum number of characters per chunk.
            chunk_overlap: Number of overlapping characters between consecutive chunks.
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ".", " ", ""],
        )
        logger.info(
            "ChunkService initialized: chunk_size=%d, chunk_overlap=%d",
            chunk_size,
            chunk_overlap,
        )

    def chunk_document(self, document: Document) -> list[Chunk]:
        """
        Split a single Document into a list of Chunks.

        Args:
            document: A Document object with populated content.

        Returns:
            List of Chunk objects. Returns an empty list if the
            document content is empty or whitespace-only.
        """
        if not document.content or not document.content.strip():
            logger.debug("Skipping empty document: %s", document.id)
            return []

        texts = self._splitter.split_text(document.content)

        if not texts:
            logger.debug("Splitter returned no chunks for document: %s", document.id)
            return []

        metadata = self._extract_metadata(document)
        chunks = [
            Chunk(
                id=str(uuid.uuid4()),
                document_id=document.id,
                chunk_index=idx,
                text=text,
                metadata=metadata,
            )
            for idx, text in enumerate(texts)
        ]

        logger.debug(
            "Document %s split into %d chunks (size=%d, overlap=%d)",
            document.id,
            len(chunks),
            self.chunk_size,
            self.chunk_overlap,
        )
        return chunks

    def chunk_documents(self, documents: list[Document]) -> list[Chunk]:
        """
        Split multiple Documents into a single flat list of Chunks.

        Args:
            documents: Iterable of Document objects.

        Returns:
            Flat list of Chunk objects from all documents.
        """
        all_chunks: list[Chunk] = []

        for document in documents:
            chunks = self.chunk_document(document)
            all_chunks.extend(chunks)

        logger.info(
            "Chunked %d documents into %d total chunks (size=%d, overlap=%d)",
            len(documents),
            len(all_chunks),
            self.chunk_size,
            self.chunk_overlap,
        )
        return all_chunks

    @staticmethod
    def _extract_metadata(document: Document) -> dict:
        """
        Extract a metadata dict from a Document for preservation in Chunks.

        Args:
            document: Source Document.

        Returns:
            Dictionary of metadata fields.
        """
        return {field: getattr(document, field, None) for field in METADATA_FIELDS}
