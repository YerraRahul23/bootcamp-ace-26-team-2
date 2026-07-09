"""
Document retrieval service.

Orchestrates query embedding and FAISS similarity search
to retrieve the top-k most relevant chunks for a user
question. Produces a RetrievalResult with a formatted
context string for downstream RAG consumption.
"""

import logging
from pathlib import Path

from app.core.config import settings
from app.models.search_result import SearchResult
from app.models.retrieval_result import RetrievalResult
from app.services.embedding_service import EmbeddingService
from app.services.faiss_index_service import FaissIndexService

logger = logging.getLogger(__name__)


class RetrievalService:
    """
    Retrieves relevant document chunks for a user query.

    Embeds the query, searches a FAISS index, and returns
    a RetrievalResult with a formatted context string.

    Usage::

        service = RetrievalService()
        service.load_index()
        result = service.retrieve("What does the NDA say?")
        print(result.context)
    """

    def __init__(
        self,
        embed_service: EmbeddingService | None = None,
        index_service: FaissIndexService | None = None,
        top_k: int | None = None,
    ) -> None:
        """
        Initialize the RetrievalService.

        Args:
            embed_service: Injectable EmbeddingService.
                           Defaults to a new EmbeddingService.
            index_service: Injectable FaissIndexService.
                           If None, the index is lazy-loaded from disk.
            top_k: Number of results to return.
                   Defaults to settings.RETRIEVAL_TOP_K.
        """
        self._embed_service = embed_service or EmbeddingService()
        self._index_service = index_service
        self._top_k = top_k or settings.RETRIEVAL_TOP_K
        self._index_path = Path(settings.FAISS_INDEX_PATH)
        self._metadata_path = Path(settings.FAISS_METADATA_PATH)

        logger.info(
            "RetrievalService initialized: top_k=%d, index_service=%s",
            self._top_k,
            "injected" if index_service else "lazy-load",
        )

    # ------------------------------------------------------------------
    # Index management
    # ------------------------------------------------------------------

    def load_index(self) -> bool:
        """
        Load the FAISS index from disk.

        Returns:
            True if the index was loaded successfully, False otherwise.
        """
        if not self._index_path.exists():
            logger.warning("FAISS index not found at %s", self._index_path)
            return False

        self._index_service = FaissIndexService.load(
            index_path=self._index_path,
            metadata_path=self._metadata_path,
        )
        logger.info("FAISS index loaded (size=%d)", self._index_service.size)
        return True

    @property
    def is_index_loaded(self) -> bool:
        """Whether a FAISS index is available for search."""
        return self._index_service is not None and self._index_service.is_built

    # ------------------------------------------------------------------
    # Embedding
    # ------------------------------------------------------------------

    def embed_query(self, query: str) -> list[float]:
        """
        Generate an embedding vector for a query string.

        Args:
            query: The user's question.

        Returns:
            A list of floats representing the query embedding.
        """
        if not query or not query.strip():
            logger.warning("Cannot embed empty query")
            return []

        vectors = self._embed_service._embed_texts([query.strip()])
        if not vectors or not vectors[0]:
            logger.error("Embedding returned empty vector for query")
            return []

        return vectors[0]

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def retrieve(
        self,
        query: str,
        top_k: int | None = None,
    ) -> RetrievalResult:
        """
        Retrieve the top-k most relevant chunks for a query.

        Steps:
            1. Validate the query.
            2. Generate a query embedding.
            3. Search the FAISS index.
            4. Format the results into a context string.

        Args:
            query: The user's question.
            top_k: Override the default top-k for this call.

        Returns:
            A RetrievalResult with results and formatted context.
        """
        if not query or not query.strip():
            logger.warning("Empty query provided to retrieve")
            return RetrievalResult(query=query, results=[], context="")

        if not self.is_index_loaded:
            logger.warning("No FAISS index available for retrieval")
            return RetrievalResult(query=query, results=[], context="")

        query_vector = self.embed_query(query)
        if not query_vector:
            return RetrievalResult(query=query, results=[], context="")

        k = top_k or self._top_k
        results = self._index_service.search(query_vector, top_k=k)

        context = self.format_context(results)

        logger.info(
            "Retrieved %d result(s) for query (top_k=%d)",
            len(results),
            k,
        )
        return RetrievalResult(query=query, results=results, context=context)

    # ------------------------------------------------------------------
    # Context formatting
    # ------------------------------------------------------------------

    @staticmethod
    def format_context(results: list[SearchResult]) -> str:
        """
        Format a list of SearchResult objects into a context string.

        Each result is rendered as::

            [Source 1] (score: 0.95) — filename.txt (Partition)
            The chunk text content...

        Args:
            results: List of SearchResult objects.

        Returns:
            A single formatted string, or empty string if results is empty.
        """
        if not results:
            return ""

        parts: list[str] = []
        for i, r in enumerate(results, 1):
            header = f"[Source {i}] (score: {r.score:.3f})"
            filename = r.metadata.get("filename", "")
            partition = r.metadata.get("partition", "")
            if filename and partition:
                header += f" \u2014 {filename} ({partition})"
            elif filename:
                header += f" \u2014 {filename}"
            text = r.chunk_text or f"[chunk_id: {r.chunk_id}]"
            parts.append(f"{header}\n{text}")

        return "\n\n".join(parts)
