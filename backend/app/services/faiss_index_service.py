"""
FAISS vector index service.

Builds, persists, loads, and searches a FAISS index
from Embedding objects. Uses cosine similarity via
normalized inner-product search (IndexFlatIP).
"""

import logging
import pickle
from pathlib import Path

import faiss
import numpy as np

from app.core.config import settings
from app.models.embedding import Embedding
from app.models.search_result import SearchResult

logger = logging.getLogger(__name__)


def _normalize(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    return vectors / norms


class FaissIndexService:
    """
    Manages a FAISS index for vector similarity search.

    Usage::

        # Build
        service = FaissIndexService()
        service.build_index(embeddings)
        service.save()

        # Load
        service = FaissIndexService.load()
        results = service.search(query_vector, top_k=5)
    """

    def __init__(
        self,
        index_path: str | Path | None = None,
        metadata_path: str | Path | None = None,
    ) -> None:
        self._index_path = Path(index_path or settings.FAISS_INDEX_PATH)
        self._metadata_path = Path(metadata_path or settings.FAISS_METADATA_PATH)

        self._index: faiss.Index | None = None
        self._embedding_ids: list[str] = []
        self._chunk_ids: list[str] = []
        self._document_ids: list[str] = []
        self._metadata_list: list[dict] = []

    # ------------------------------------------------------------------
    # Build
    # ------------------------------------------------------------------

    def build_index(self, embeddings: list[Embedding]) -> None:
        """
        Build a FAISS index from a list of Embedding objects.

        Args:
            embeddings: Non-empty list of Embedding objects.
                        All must have the same vector dimension.

        Raises:
            ValueError: If the list is empty or dimensions are inconsistent.
        """
        if not embeddings:
            raise ValueError("Cannot build index from an empty list of embeddings.")

        dimension = len(embeddings[0].vector)
        if any(len(e.vector) != dimension for e in embeddings):
            raise ValueError(
                f"Inconsistent embedding dimensions. "
                f"Expected {dimension}, got varying lengths."
            )

        vectors = np.array([e.vector for e in embeddings], dtype=np.float32)
        vectors = _normalize(vectors)

        self._index = faiss.IndexFlatIP(dimension)
        self._index.add(vectors)

        self._embedding_ids = [e.id for e in embeddings]
        self._chunk_ids = [e.chunk_id for e in embeddings]
        self._document_ids = [e.document_id for e in embeddings]
        self._metadata_list = [e.metadata for e in embeddings]

        logger.info(
            "FAISS index built: dimension=%d, num_vectors=%d",
            dimension,
            len(embeddings),
        )

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self) -> None:
        """
        Save the FAISS index and metadata to disk.

        Creates parent directories if they do not exist.
        """
        if self._index is None:
            logger.warning("No index to save.")
            return

        self._index_path.parent.mkdir(parents=True, exist_ok=True)
        self._metadata_path.parent.mkdir(parents=True, exist_ok=True)

        faiss.write_index(self._index, str(self._index_path))

        metadata = {
            "embedding_ids": self._embedding_ids,
            "chunk_ids": self._chunk_ids,
            "document_ids": self._document_ids,
            "metadata_list": self._metadata_list,
        }
        with open(self._metadata_path, "wb") as f:
            pickle.dump(metadata, f)

        logger.info("Index saved to %s, metadata to %s", self._index_path, self._metadata_path)

    @classmethod
    def load(
        cls,
        index_path: str | Path | None = None,
        metadata_path: str | Path | None = None,
    ) -> "FaissIndexService":
        """
        Load a previously saved FAISS index and metadata from disk.

        Args:
            index_path: Path to the FAISS index file. Defaults to settings.FAISS_INDEX_PATH.
            metadata_path: Path to the pickled metadata file. Defaults to settings.FAISS_METADATA_PATH.

        Returns:
            A new FaissIndexService instance with the loaded index.
        """
        resolved_index = Path(index_path or settings.FAISS_INDEX_PATH)
        resolved_metadata = Path(metadata_path or settings.FAISS_METADATA_PATH)

        if not resolved_index.exists():
            raise FileNotFoundError(f"FAISS index file not found: {resolved_index}")
        if not resolved_metadata.exists():
            raise FileNotFoundError(f"FAISS metadata file not found: {resolved_metadata}")

        index = faiss.read_index(str(resolved_index))

        with open(resolved_metadata, "rb") as f:
            metadata = pickle.load(f)

        instance = cls(index_path=resolved_index, metadata_path=resolved_metadata)
        instance._index = index
        instance._embedding_ids = metadata["embedding_ids"]
        instance._chunk_ids = metadata["chunk_ids"]
        instance._document_ids = metadata["document_ids"]
        instance._metadata_list = metadata["metadata_list"]

        logger.info("Index loaded from %s (size=%d)", resolved_index, index.ntotal)
        return instance

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search(self, query_vector: list[float], top_k: int = 5) -> list[SearchResult]:
        """
        Search the index for the top-k most similar vectors.

        Args:
            query_vector: Query embedding vector.
            top_k: Number of results to return.

        Returns:
            List of SearchResult objects ordered by descending score.
            Empty list if the index is empty or top_k <= 0.
        """
        if self._index is None or self._index.ntotal == 0 or top_k <= 0:
            return []

        k = min(top_k, self._index.ntotal)
        query = np.array([query_vector], dtype=np.float32)
        query = _normalize(query)

        distances, indices = self._index.search(query, k)

        results: list[SearchResult] = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            results.append(
                SearchResult(
                    chunk_id=self._chunk_ids[idx],
                    document_id=self._document_ids[idx],
                    score=float(dist),
                    metadata=self._metadata_list[idx],
                )
            )

        return results

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def size(self) -> int:
        """Number of vectors in the index."""
        return self._index.ntotal if self._index is not None else 0

    @property
    def is_built(self) -> bool:
        """Whether the index has been built (non-empty)."""
        return self._index is not None and self._index.ntotal > 0
