"""
Document upload endpoint.

Accepts a PDF file, extracts text, chunks, embeds,
and appends the new embeddings to the existing FAISS index.
Generates a unique document_id per upload for multi-document retrieval.
"""

import logging
import uuid
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.models.document import Document
from app.services.chunk_service import ChunkService
from app.services.embedding_service import EmbeddingService
from app.services.faiss_index_service import FaissIndexService
from app.api.deps import get_current_user
from app.api.routes.chat import clear_service_cache
from app.services.storage_service import StorageService
from app.services.document_db_service import DocumentDBService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])

ACCEPTED_TYPES = {
    "application/pdf",
    "application/x-pdf",
}


class UploadResponse(BaseModel):
    status: str = Field(description="success or error")
    document_id: str = Field(description="UUID assigned to this upload for multi-document retrieval")
    filename: str = Field(description="Original filename")
    chunks: int = Field(description="Number of chunks created")
    embeddings: int = Field(description="Number of embeddings stored")
    message: str = Field(default="", description="Status message")


@router.post("", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
) -> UploadResponse:
    """Upload a PDF, extract text, index it, and append to the FAISS index."""
    if file.content_type not in ACCEPTED_TYPES and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    contents = await file.read()
    text, num_pages = _extract_pdf_text(contents)

    if not text.strip():
        raise HTTPException(status_code=400, detail="PDF appears to contain no extractable text")

    logger.info("Authenticated user: %s", user_id)
    logger.info("Extracted %d characters from '%s' (%d pages)", len(text), file.filename, num_pages)

    storage = StorageService()
    storage_path = storage.upload_file(user_id, file.filename, contents)
    logger.info("Uploaded to Supabase Storage: path=%s", storage_path)

    document_id = str(uuid.uuid4())
    upload_time = datetime.now(timezone.utc).isoformat()

    doc = Document(
        id=str(uuid.uuid4()),
        filename=file.filename,
        relative_path=file.filename,
        dataset_name="upload",
        partition="upload",
        file_size=len(contents),
        load_timestamp=upload_time,
        content=text,
        document_id=document_id,
    )

    chunk_service = ChunkService(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    chunks = chunk_service.chunk_document(doc)

    if not chunks:
        raise HTTPException(status_code=500, detail="Chunking produced no chunks")

    # Enrich metadata with document_id, upload_time, chunk_index
    for chunk in chunks:
        chunk.metadata["document_id"] = document_id
        chunk.metadata["upload_time"] = upload_time

    logger.debug("Chunked into %d chunks:", len(chunks))
    for i, c in enumerate(chunks):
        logger.debug("  chunk[%d] (%d chars): %.100s...", i, len(c.text), c.text)

    embed_service = EmbeddingService(
        model_name=settings.EMBEDDING_MODEL,
        batch_size=settings.EMBEDDING_BATCH_SIZE,
    )
    embeddings = embed_service.embed_chunks(chunks)
    valid = [e for e in embeddings if e is not None]

    if not valid:
        raise HTTPException(status_code=500, detail="All chunks failed to embed")

    logger.debug("Generated %d embeddings (dim=%d)", len(valid), len(valid[0].vector))

    chunk_text_map = {c.id: c.text for c in chunks}
    ordered_texts = [chunk_text_map.get(e.chunk_id, "") for e in valid]

    # Append to existing index or build fresh
    try:
        index_service = FaissIndexService.load()
        index_service.append_embeddings(valid, chunk_texts=ordered_texts)
    except FileNotFoundError:
        index_service = FaissIndexService()
        index_service.build_index(valid, chunk_texts=ordered_texts)

    index_service.save()

    clear_service_cache()

    db = DocumentDBService()
    db.insert_document(
        document_id=document_id,
        user_id=user_id,
        filename=file.filename,
        storage_path=storage_path,
        file_size=len(contents),
    )
    logger.info("Document record inserted for user=%s, document_id=%s", user_id, document_id)

    logger.info(
        "Upload complete: document_id=%s, filename=%s, chunks=%d, total_index_size=%d",
        document_id,
        file.filename,
        len(valid),
        index_service.size,
    )

    return UploadResponse(
        status="success",
        document_id=document_id,
        filename=file.filename,
        chunks=len(chunks),
        embeddings=len(valid),
        message=f"Indexed {len(valid)} chunks from '{file.filename}' as document_id={document_id}",
    )


def _extract_pdf_text(pdf_bytes: bytes) -> tuple[str, int]:
    """Extract text from a PDF byte stream using pypdf.

    Returns:
        Tuple of (full_text, number_of_pages).
    """
    from pypdf import PdfReader

    reader = PdfReader(BytesIO(pdf_bytes))
    pages: list[str] = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        logger.debug("  page[%d]: %d chars extracted", i, len(text))
        pages.append(text)

    full = "\n\n".join(pages)
    num_pages = len(reader.pages)
    logger.debug("Total extracted text: %d chars across %d pages", len(full), num_pages)
    return full, num_pages
