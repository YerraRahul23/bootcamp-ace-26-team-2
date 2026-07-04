"""
Chunk data model.

Defines the structure for a single text chunk produced
by splitting a Document. Each chunk preserves the parent
document's metadata and tracks its position within the
original document.
"""

from pydantic import BaseModel, Field


class Chunk(BaseModel):
    """
    Represents a single text chunk from a split document.

    This model is the standardized output of the ChunkService
    and serves as the input for the embedding phase.
    """

    id: str = Field(description="Unique identifier for the chunk")
    document_id: str = Field(description="ID of the parent Document")
    chunk_index: int = Field(ge=0, description="0-based index within the parent document")
    text: str = Field(description="Chunk text content")
    metadata: dict = Field(default_factory=dict, description="Preserved metadata from the parent Document")
