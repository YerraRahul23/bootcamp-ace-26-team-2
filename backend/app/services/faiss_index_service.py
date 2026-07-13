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
        self._chunk_texts: list[str] = []
        self._document_ids: list[str] = []
        self._metadata_list: list[dict] = []

    # ------------------------------------------------------------------
    # Build
    # ------------------------------------------------------------------

    def build_index(
        self,
        embeddings: list[Embedding],
        chunk_texts: list[str] | None = None,
    ) -> None:
        """
        Build a FAISS index from a list of Embedding objects.

        Args:
            embeddings: Non-empty list of Embedding objects.
                        All must have the same vector dimension.
            chunk_texts: Optional parallel list of chunk text strings.
                         If omitted, empty strings are stored.

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
        self._chunk_texts = chunk_texts if chunk_texts is not None else [""] * len(embeddings)
        self._document_ids = [e.document_id for e in embeddings]
        self._metadata_list = [e.metadata for e in embeddings]

        logger.info(
            "FAISS index built: dimension=%d, num_vectors=%d",
            dimension,
            len(embeddings),
        )

    # ------------------------------------------------------------------
    # Append
    # ------------------------------------------------------------------

    def append_embeddings(
        self,
        embeddings: list[Embedding],
        chunk_texts: list[str] | None = None,
    ) -> None:
        """
        Append embeddings to an existing index, or build a new one if empty.

        When the index already has vectors, normalizes the new vectors and
        calls FAISS ``add()``, then extends all tracking lists so the
        merged state is preserved on the next ``save()``.

        Args:
            embeddings: Non-empty list of Embedding objects.
                        All must have the same vector dimension as the
                        existing index (or, if empty, consistent with
                        each other).
            chunk_texts: Optional parallel list of chunk text strings.

        Raises:
            ValueError: If the list is empty.
        """
        if not embeddings:
            raise ValueError("Cannot append an empty list of embeddings.")

        vectors = np.array([e.vector for e in embeddings], dtype=np.float32)
        vectors = _normalize(vectors)
        new_texts = chunk_texts if chunk_texts is not None else [""] * len(embeddings)

        if self._index is None or self._index.ntotal == 0:
            dimension = len(embeddings[0].vector)
            self._index = faiss.IndexFlatIP(dimension)
            self._index.add(vectors)
            self._embedding_ids = [e.id for e in embeddings]
            self._chunk_ids = [e.chunk_id for e in embeddings]
            self._chunk_texts = list(new_texts)
            self._document_ids = [e.document_id for e in embeddings]
            self._metadata_list = [e.metadata for e in embeddings]
            logger.info(
                "FAISS index built via append: dimension=%d, num_vectors=%d",
                dimension,
                len(embeddings),
            )
        else:
            self._index.add(vectors)
            self._embedding_ids.extend(e.id for e in embeddings)
            self._chunk_ids.extend(e.chunk_id for e in embeddings)
            self._chunk_texts.extend(new_texts)
            self._document_ids.extend(e.document_id for e in embeddings)
            self._metadata_list.extend(e.metadata for e in embeddings)
            logger.info(
                "FAISS index appended: total_vectors=%d",
                self._index.ntotal,
            )

    def document_exists(self, document_id: str) -> bool:
        """Return True if *document_id* exists anywhere in the index metadata."""
        return document_id in self._document_ids

    def get_unique_document_ids(self) -> set[str]:
        """Return the set of all unique document IDs in the index."""
        return set(self._document_ids)

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
            "chunk_texts": self._chunk_texts,
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

        logger.info(
            "Attempting to load FAISS index from %s, metadata from %s",
            resolved_index,
            resolved_metadata,
        )

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
        instance._chunk_texts = metadata.get("chunk_texts", [""] * len(metadata["chunk_ids"]))
        instance._document_ids = metadata["document_ids"]
        instance._metadata_list = metadata["metadata_list"]

        logger.info(
            "FAISS index loaded: path=%s, size=%d, dimension=%d, metadata_count=%d, has_chunk_texts=%s",
            resolved_index,
            index.ntotal,
            index.d if hasattr(index, 'd') else 0,
            len(instance._metadata_list),
            bool(instance._chunk_texts and instance._chunk_texts[0]),
        )
        return instance

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search(
        self,
        query_vector: list[float],
        top_k: int = 5,
        use_mmr: bool = True,
        mmr_lambda: float = 0.7,
        metadata_filter: dict | None = None,
    ) -> list[SearchResult]:
        """
        Search the index for the top-k most similar vectors.

        Args:
            query_vector: Query embedding vector.
            top_k: Number of results to return.
            use_mmr: Whether to apply MMR diversity re-ranking.
            mmr_lambda: MMR diversity parameter (0=pure diversity, 1=pure relevance).
            metadata_filter: Optional dict of {key: value} to filter results.
                             Only results whose metadata matches all key-value
                             pairs are returned.

        Returns:
            List of SearchResult objects ordered by descending score.
            Empty list if the index is empty or top_k <= 0.
        """
        if self._index is None or self._index.ntotal == 0 or top_k <= 0:
            logger.info("FAISS search skipped: index_none=%s, ntotal=%d, top_k=%d",
                         self._index is None, self._index.ntotal if self._index else 0, top_k)
            return []

        candidate_k = min(top_k * 3, self._index.ntotal) if use_mmr else min(top_k, self._index.ntotal)
        query = np.array([query_vector], dtype=np.float32)
        query = _normalize(query)

        logger.info(
            "FAISS search: query_dim=%d, top_k=%d, candidate_k=%d, index_size=%d, use_mmr=%s",
            len(query_vector), top_k, candidate_k, self._index.ntotal, use_mmr,
        )

        distances, indices = self._index.search(query, candidate_k)

        candidates: list[SearchResult] = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue

            meta = self._metadata_list[idx]

            if metadata_filter:
                if not all(meta.get(k) == v for k, v in metadata_filter.items()):
                    continue

            candidates.append(SearchResult(
                chunk_id=self._chunk_ids[idx],
                document_id=self._document_ids[idx],
                chunk_text=self._chunk_texts[idx],
                score=float(dist),
                metadata=meta,
            ))

        if use_mmr and len(candidates) > top_k:
            results = self._mmr_select(candidates, query_vector, top_k, mmr_lambda)
        else:
            results = candidates[:top_k]

        for i, r in enumerate(results):
            logger.debug("  result[%d] score=%.4f chunk_id=%s text=%.80s", i, r.score, r.chunk_id, r.chunk_text)

        logger.info(
            "FAISS search complete: %d candidates -> %d final results",
            len(candidates),
            len(results),
        )
        return results

    @staticmethod
    def _mmr_select(
        candidates: list[SearchResult],
        query_vector: list[float],
        top_k: int,
        mmr_lambda: float,
    ) -> list[SearchResult]:
        """Select diverse results using document-aware diversity.

        Ensures at most one result per document in the top-k, then fills
        remaining slots with the next-best from any document.  This is a
        practical alternative to full vector-based MMR that doesn't require
        storing raw vectors in memory.
        """
        if len(candidates) <= top_k:
            return candidates

        selected: list[SearchResult] = []
        seen_files: set[str] = set()

        for c in candidates:
            filename = c.metadata.get("filename", "")
            if filename not in seen_files:
                selected.append(c)
                seen_files.add(filename)
            if len(selected) >= top_k:
                return selected

        for c in candidates:
            if c not in selected:
                selected.append(c)
            if len(selected) >= top_k:
                break

        return selected

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
