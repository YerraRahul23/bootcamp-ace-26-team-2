"""
Build a small FAISS index from a few documents (to stay within Gemini free tier quota).
"""
import logging
import sys
import time
import uuid

from app.core.config import settings
from app.services.chunk_service import ChunkService
from app.services.document_loader import DocumentLoader
from app.services.embedding_service import EmbeddingService
from app.services.faiss_index_service import FaissIndexService

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("build_small_index")


def main() -> None:
    logger.info("=== Starting small FAISS index build ===")

    t0 = time.time()

    loader = DocumentLoader(settings.CUAD_DATASET_PATH)
    documents = loader.load_all()
    logger.info("Loaded %d documents in %.1fs", len(documents), time.time() - t0)

    if not documents:
        logger.error("No documents loaded — aborting")
        sys.exit(1)

    # Use only first 3 documents to stay within free tier quota
    documents = documents[:3]
    logger.info("Using %d documents for small index", len(documents))

    t1 = time.time()
    chunk_service = ChunkService(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    chunks = chunk_service.chunk_documents(documents)
    logger.info("Chunked into %d chunks in %.1fs", len(chunks), time.time() - t1)

    t2 = time.time()
    embed_service = EmbeddingService(
        model_name=settings.EMBEDDING_MODEL,
        batch_size=settings.EMBEDDING_BATCH_SIZE,
    )
    embeddings = embed_service.embed_chunks(chunks)
    logger.info("Generated %d embeddings in %.1fs", len(embeddings), time.time() - t2)

    valid = [e for e in embeddings if e is not None]
    failed = len(embeddings) - len(valid)
    if failed:
        logger.warning("%d chunks failed to embed", failed)

    if not valid:
        logger.error("No valid embeddings — aborting")
        sys.exit(1)

    chunk_text_map = {c.id: c.text for c in chunks}
    ordered_texts = [chunk_text_map.get(e.chunk_id, "") for e in valid]

    t3 = time.time()
    index_service = FaissIndexService()
    index_service.build_index(valid, chunk_texts=ordered_texts)
    index_service.save()
    logger.info("FAISS index built and saved in %.1fs", time.time() - t3)

    total = time.time() - t0
    logger.info(
        "=== Small index build complete: %d docs, %d chunks, %d embeddings in %.1fs ===",
        len(documents),
        len(chunks),
        len(valid),
        total,
    )


if __name__ == "__main__":
    main()