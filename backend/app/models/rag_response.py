from pydantic import BaseModel, Field

from app.models.search_result import SearchResult


class RAGResponse(BaseModel):
    query: str = Field(description="The original user question")
    answer: str = Field(default="", description="Generated answer from the LLM")
    context: str = Field(default="", description="Retrieved context provided to the LLM")
    sources: list[SearchResult] = Field(default_factory=list, description="Supporting document chunks used for the answer")
    model: str = Field(default="", description="LLM model identifier used for generation")
