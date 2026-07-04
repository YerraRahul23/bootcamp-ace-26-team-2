"""
Embedding data model.

Defines the structure for a vector embedding produced
by the EmbeddingService. Each embedding preserves the
parent chunk's metadata and links back to both the
chunk and its source document.
"""

from pydantic import BaseModel, Field


class Embedding(BaseModel):
    """
    Represents a single vector embedding for a text chunk.

    This model is the standardized output of the EmbeddingService
    and serves as the input for the vector store indexing phase.
    """

    id: str = Field(description="Unique identifier for the embedding")
    chunk_id: str = Field(description="ID of the parent Chunk")
    document_id: str = Field(description="ID of the parent Document")
    vector: list[float] = Field(description="Embedding vector as a list of floats")
    metadata: dict = Field(default_factory=dict, description="Preserved metadata from the parent Chunk")
