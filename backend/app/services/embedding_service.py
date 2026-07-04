"""
Embedding generation service.

Converts Chunk objects into vector embeddings using a
configurable embedding model (defaults to Google Gemini).
Supports batch processing and injectable models for testing.
"""

import logging
import uuid

from app.core.config import settings
from app.models.chunk import Chunk
from app.models.embedding import Embedding

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Generates vector embeddings for text chunks.

    Uses an embedder that implements ``embed_documents(texts)``
    (e.g. LangChain's ``GoogleGenerativeAIEmbeddings``). The
    embedder is injectable for testability.
    """

    def __init__(
        self,
        embed_model=None,
        model_name: str = "models/embedding-001",
        batch_size: int = 32,
        api_key: str | None = None,
    ) -> None:
        """
        Initialize the EmbeddingService.

        Args:
            embed_model: An object with an ``embed_documents(texts)`` method.
                         If None, ``GoogleGenerativeAIEmbeddings`` is used.
            model_name: The embedding model identifier (default: models/embedding-001).
            batch_size: Number of texts to embed in a single API call.
            api_key: Google API key. If None, falls back to the GEMINI_API_KEY env var.
        """
        self.batch_size = batch_size
        self.model_name = model_name

        if embed_model is not None:
            self._model = embed_model
        else:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings

            resolved_key = api_key or settings.GEMINI_API_KEY
            self._model = GoogleGenerativeAIEmbeddings(
                model=model_name,
                google_api_key=resolved_key,
            )

        logger.info(
            "EmbeddingService initialized: model=%s, batch_size=%d",
            model_name,
            batch_size,
        )

    def embed_chunk(self, chunk: Chunk) -> Embedding | None:
        """
        Generate an embedding for a single chunk.

        Args:
            chunk: A Chunk object with non-empty text.

        Returns:
            An Embedding object, or None if the chunk text is empty.
        """
        if not chunk.text or not chunk.text.strip():
            logger.warning("Skipping chunk with empty text: %s", chunk.id)
            return None

        vectors = self._embed_texts([chunk.text])
        if not vectors or not vectors[0]:
            logger.error("Embedding returned empty vector for chunk: %s", chunk.id)
            return None

        return self._build_embedding(chunk, vectors[0])

    def embed_chunks(self, chunks: list[Chunk]) -> list[Embedding]:
        """
        Generate embeddings for a list of chunks with batching.

        Chunks with empty text are skipped and logged.

        Args:
            chunks: List of Chunk objects to embed.

        Returns:
            List of Embedding objects (same order as input, excluding skipped chunks).
        """
        if not chunks:
            logger.debug("No chunks provided to embed_chunks")
            return []

        valid_chunks = [c for c in chunks if c.text and c.text.strip()]
        skipped = len(chunks) - len(valid_chunks)
        if skipped:
            logger.warning("Skipping %d chunk(s) with empty text", skipped)

        if not valid_chunks:
            return []

        texts = [c.text for c in valid_chunks]
        all_vectors = self._embed_texts(texts)

        embeddings = [
            self._build_embedding(chunk, vector)
            for chunk, vector in zip(valid_chunks, all_vectors)
        ]

        logger.info(
            "Embedded %d chunks (batch_size=%d, skipped=%d)",
            len(embeddings),
            self.batch_size,
            skipped,
        )
        return embeddings

    def _embed_texts(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a list of texts in batches.

        Args:
            texts: List of text strings to embed.

        Returns:
            List of embedding vectors (same order as input).
        """
        all_vectors: list[list[float]] = []

        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            try:
                batch_vectors = self._model.embed_documents(batch)
                all_vectors.extend(batch_vectors)
                logger.debug(
                    "Embedded batch %d-%d of %d",
                    i,
                    min(i + self.batch_size, len(texts)),
                    len(texts),
                )
            except Exception as e:
                logger.error(
                    "Failed to embed batch %d-%d: %s",
                    i,
                    min(i + self.batch_size, len(texts)),
                    e,
                )
                raise

        return all_vectors

    @staticmethod
    def _build_embedding(chunk: Chunk, vector: list[float]) -> Embedding:
        """
        Build an Embedding object from a Chunk and its vector.

        Args:
            chunk: The source Chunk.
            vector: The embedding vector.

        Returns:
            A new Embedding instance.
        """
        return Embedding(
            id=str(uuid.uuid4()),
            chunk_id=chunk.id,
            document_id=chunk.document_id,
            vector=vector,
            metadata=chunk.metadata,
        )
