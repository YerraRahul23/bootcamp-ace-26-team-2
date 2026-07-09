"""
Retrieval API endpoint.

Embeds a user query and returns the top-k most relevant
document chunks from the FAISS index.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.search_result import SearchResult
from app.services.retrieval_service import RetrievalService

router = APIRouter(prefix="/retrieve", tags=["retrieval"])


class RetrieveRequest(BaseModel):
    query: str = Field(description="The user's question")


class RetrieveResponse(BaseModel):
    query: str = Field(description="The original user query")
    results: list[SearchResult] = Field(default_factory=list, description="Retrieved chunks ordered by descending score")
    context: str = Field(default="", description="Formatted context string from retrieved chunks")


_service: RetrievalService | None = None


def get_service() -> RetrievalService:
    global _service
    if _service is None:
        _service = RetrievalService()
        _service.load_index()
    return _service


@router.post("", response_model=RetrieveResponse)
async def retrieve(request: RetrieveRequest) -> RetrieveResponse:
    """
    Accept a user query, embed it, and retrieve top-k relevant chunks.

    Returns the matched chunks and a formatted context string.
    """
    service = get_service()
    result = service.retrieve(request.query)
    return RetrieveResponse(
        query=result.query,
        results=result.results,
        context=result.context,
    )
