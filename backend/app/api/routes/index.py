"""
Index management endpoints.

Provides an endpoint to build or rebuild the FAISS index
from the CUAD dataset (load → chunk → embed → index → save).
"""

import logging
import time

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.chunk_service import ChunkService
from app.services.document_loader import DocumentLoader
from app.services.embedding_service import EmbeddingService
from app.services.faiss_index_service import FaissIndexService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/index", tags=["index"])


class IndexBuildResponse(BaseModel):
    status: str = Field(description="build success or failure")
    documents: int = Field(description="number of documents loaded")
    chunks: int = Field(description="number of chunks created")
    embeddings: int = Field(description="number of embeddings generated")
    duration_seconds: float = Field(description="total build time in seconds")
    message: str = Field(default="", description="status message")


@router.post("/build", response_model=IndexBuildResponse)
async def build_index() -> IndexBuildResponse:
    """Load all CUAD contracts, chunk, embed, and build the FAISS index."""
    t0 = time.time()

    loader = DocumentLoader(settings.CUAD_DATASET_PATH)
    documents = loader.load_all()

    if not documents:
        return IndexBuildResponse(
            status="error",
            documents=0,
            chunks=0,
            embeddings=0,
            duration_seconds=time.time() - t0,
            message="No documents found in dataset",
        )

    chunk_service = ChunkService(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    chunks = chunk_service.chunk_documents(documents)

    embed_service = EmbeddingService(
        model_name=settings.EMBEDDING_MODEL,
        batch_size=settings.EMBEDDING_BATCH_SIZE,
    )
    embeddings = embed_service.embed_chunks(chunks)
    valid = [e for e in embeddings if e is not None]

    if not valid:
        return IndexBuildResponse(
            status="error",
            documents=len(documents),
            chunks=len(chunks),
            embeddings=0,
            duration_seconds=time.time() - t0,
            message="All chunks failed to embed",
        )

    chunk_text_map = {c.id: c.text for c in chunks}
    ordered_texts = [chunk_text_map.get(e.chunk_id, "") for e in valid]

    index_service = FaissIndexService()
    index_service.build_index(valid, chunk_texts=ordered_texts)
    index_service.save()

    duration = time.time() - t0
    logger.info(
        "Index build complete: %d docs, %d chunks, %d embeddings in %.1fs",
        len(documents), len(chunks), len(valid), duration,
    )

    return IndexBuildResponse(
        status="success",
        documents=len(documents),
        chunks=len(chunks),
        embeddings=len(valid),
        duration_seconds=round(duration, 2),
        message=f"Index built with {len(valid)} embeddings from {len(documents)} documents",
    )
