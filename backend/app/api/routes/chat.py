"""
Chat and document Q&A endpoints.

Handles user queries against uploaded legal documents
by orchestrating the RAG pipeline. Supports optional
document_id scoping for multi-document retrieval.
"""

import logging
import traceback

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models.search_result import SearchResult
from app.services.rag_pipeline_service import RAGPipelineService
from app.services.faiss_index_service import FaissIndexService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    query: str = Field(description="The user's legal question")
    document_id: str | None = Field(
        default=None,
        description="Optional document UUID to scope retrieval to a single uploaded contract",
    )


class ChatResponse(BaseModel):
    query: str = Field(description="The original user question")
    answer: str = Field(description="Generated answer from the LLM")
    context: str = Field(description="Retrieved context provided to the LLM")
    sources: list[SearchResult] = Field(default_factory=list, description="Supporting document chunks used for the answer")
    model: str = Field(description="LLM model identifier used for generation")


_service: RAGPipelineService | None = None


def get_service() -> RAGPipelineService:
    global _service
    if _service is None:
        _service = RAGPipelineService()
    return _service


def clear_service_cache() -> None:
    """Reset the cached RAGPipelineService so it reloads the index on next request."""
    global _service
    _service = None


@router.post("/ask", response_model=ChatResponse)
async def ask_question(request: ChatRequest) -> ChatResponse:
    """
    Accept a user question, retrieve relevant contract clauses,
    and return a generated answer grounded in the retrieved context.

    If *document_id* is provided, retrieval is scoped to chunks
    belonging to that document.  If the document does not exist,
    a 404 is returned.  If the document has no indexed chunks,
    a 400 is returned.

    When *document_id* is omitted, the entire index is searched.
    """
    # Validate document_id if provided
    if request.document_id:
        try:
            idx_service = FaissIndexService.load()
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Document not found.")

        if not idx_service.document_exists(request.document_id):
            raise HTTPException(status_code=404, detail="Document not found.")

        # Check whether the document has any indexed chunks
        doc_chunks = [
            m.get("document_id")
            for m in idx_service._metadata_list
            if m.get("document_id") == request.document_id
        ]
        if not doc_chunks:
            raise HTTPException(
                status_code=400,
                detail="Document has not been indexed.",
            )

    logger.info(
        "Chat request: query='%s', document_id=%s",
        request.query[:80],
        request.document_id,
    )

    try:
        service = get_service()
        result = service.answer(request.query, document_id=request.document_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Chat pipeline failed: %s\n%s",
            e,
            traceback.format_exc(),
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process your question: {str(e)}",
        )

    logger.info(
        "Chat response: answer_len=%d, sources=%d, model=%s",
        len(result.answer),
        len(result.sources),
        result.model,
    )

    return ChatResponse(
        query=result.query,
        answer=result.answer,
        context=result.context,
        sources=result.sources,
        model=result.model,
    )
