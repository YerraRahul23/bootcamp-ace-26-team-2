from pydantic import BaseModel, Field


class SearchResult(BaseModel):
    chunk_id: str = Field(description="ID of the matched Chunk")
    document_id: str = Field(description="ID of the source Document")
    chunk_text: str = Field(default="", description="Text content of the matched Chunk")
    score: float = Field(description="Similarity score (cosine similarity)")
    metadata: dict = Field(default_factory=dict, description="Preserved metadata from the Chunk")
