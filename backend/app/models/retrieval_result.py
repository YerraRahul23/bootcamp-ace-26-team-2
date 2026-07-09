from pydantic import BaseModel, Field

from app.models.search_result import SearchResult


class RetrievalResult(BaseModel):
    query: str = Field(description="Original user query")
    results: list[SearchResult] = Field(default_factory=list, description="Retrieved chunks ordered by descending score")
    context: str = Field(default="", description="Formatted context string from retrieved chunks")
